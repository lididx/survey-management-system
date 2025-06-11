
import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Archive } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Audit, StatusType } from "@/types/types";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { isAuditInArchiveView } from "@/utils/archiveManager";
import { getArchivedAudits, deleteAuditById, updateAuditStatusInDb } from "@/utils/supabase";

const ArchivePage = () => {
  console.log("[Archive] Component rendering...");
  
  const { user } = useAuthManager();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  console.log("[Archive] Current user:", user);
  
  const { canDelete, canEdit } = useAuditPermissions(user);

  // Memoized loadAudits function to prevent recreation
  const loadAudits = useCallback(async () => {
    console.log("[Archive] loadAudits called, user:", user);
    
    if (!user) {
      console.log("[Archive] No user, returning");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setLoadingError(null);
      console.log("[Archive] Starting to load archived audits...");
      
      // Load archived audits from database - RLS will handle filtering
      const archivedAudits = await getArchivedAudits(user);
      console.log("[Archive] Loaded archived audits:", archivedAudits.length);
      
      setAudits(archivedAudits);
    } catch (error) {
      console.error("[Archive] Error loading audits:", error);
      const errorMessage = "שגיאה בטעינת נתוני הסקרים";
      setLoadingError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log("[Archive] Loading completed");
    }
  }, [user]);

  useEffect(() => {
    console.log("[Archive] useEffect triggered");
    loadAudits();
  }, [loadAudits]);

  // Use audits directly since they're already filtered by RLS for archived status
  const archivedAudits = audits;
  
  console.log("[Archive] Total archived audits:", archivedAudits.length);
  
  // Memoize search filtering
  const displayedAudits = useMemo(() => {
    if (!searchQuery.trim()) return archivedAudits;
    
    const query = searchQuery.toLowerCase();
    return archivedAudits.filter(audit => 
      audit.name.toLowerCase().includes(query) || 
      audit.currentStatus.toLowerCase().includes(query) ||
      (audit.clientName && audit.clientName.toLowerCase().includes(query))
    );
  }, [archivedAudits, searchQuery]);

  // Memoized delete handler
  const handleAuditDelete = useCallback(async (auditId: string) => {
    console.log(`[Archive] Deleting audit ${auditId}`);
    
    try {
      if (!user) {
        toast.error("משתמש לא מחובר");
        return;
      }

      const auditToDelete = audits.find(audit => audit.id === auditId);
      if (!auditToDelete) {
        toast.error("הסקר לא נמצא");
        return;
      }

      if (!canDelete(auditToDelete.ownerId)) {
        toast.error("אין לך הרשאה למחוק סקר זה");
        return;
      }

      // Delete from database - RLS will handle authorization
      const success = await deleteAuditById(auditId);
      
      if (success) {
        // Update local state instead of reloading
        setAudits(prevAudits => prevAudits.filter(audit => audit.id !== auditId));
        toast.success("הסקר נמחק בהצלחה מהארכיון");
      } else {
        toast.error("שגיאה במחיקת הסקר");
      }
    } catch (error) {
      console.error("[Archive] Error deleting audit:", error);
      toast.error("שגיאה במחיקת הסקר");
    }
  }, [audits, user, canDelete]);

  // Memoized status change handler
  const handleStatusChange = useCallback(async (audit: Audit, newStatus: StatusType) => {
    console.log(`[Archive] Changing status of audit ${audit.id} to ${newStatus}`);
    
    try {
      if (!user) {
        toast.error("נדרש להיות מחובר כדי לעדכן סטטוס");
        return;
      }

      // Allow managers to change status with limited options, or full access for owners
      if (!canEdit(audit.ownerId) && user.role !== "מנהלת") {
        toast.error("אין לך הרשאה לעדכן סקר זה");
        return;
      }

      // For managers, limit status options
      if (user.role === "מנהלת" && !canEdit(audit.ownerId)) {
        if (newStatus !== "הסתיים" && newStatus !== "בבקרה") {
          toast.error("מנהלים יכולים לעדכן רק לסטטוס 'הסתיים' או 'בבקרה'");
          return;
        }
      }

      const reason = `עדכון סטטוס ל-${newStatus} מהארכיון`;
      
      // Update status in database - RLS will handle authorization
      const success = await updateAuditStatusInDb(audit.id, newStatus, reason, user.name);
      
      if (success) {
        // Update local state instead of reloading
        setAudits(prevAudits => 
          prevAudits.map(a => 
            a.id === audit.id 
              ? { 
                  ...a, 
                  currentStatus: newStatus,
                  statusLog: [{
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    oldStatus: audit.currentStatus,
                    newStatus,
                    oldDate: null,
                    newDate: null,
                    reason,
                    modifiedBy: user.name
                  }, ...a.statusLog]
                }
              : a
          )
        );
        
        toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
        
        // If status changed from "הסתיים" to something else, the audit will automatically move out of archive view
        if (audit.currentStatus === "הסתיים" && newStatus !== "הסתיים") {
          toast.success("הסקר הוחזר לרשימת הסקרים הפעילים");
        }
      } else {
        toast.error("שגיאה בעדכון סטטוס הסקר");
      }
    } catch (error) {
      console.error("[Archive] Error updating status:", error);
      toast.error("שגיאה בעדכון סטטוס הסקר");
    }
  }, [user, canEdit]);

  // Memoized navigation handlers
  const handleNavigateToArchive = useCallback(() => {
    console.log("[Archive] handleNavigateToArchive called - already on archive page");
    // We're already on archive page
  }, []);

  const handleDataChange = useCallback(() => {
    console.log("[Archive] handleDataChange called - reloading data");
    loadAudits();
  }, [loadAudits]);

  // Early return for no user
  if (!user) {
    console.log("[Archive] No user, redirecting to login");
    navigate('/');
    return null;
  }

  // Early return for loading
  if (loading) {
    console.log("[Archive] Still loading...");
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני ארכיון...</p>
        </div>
      </div>
    );
  }

  // Early return for error
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-red-600 mb-4">{loadingError}</p>
          <button 
            onClick={loadAudits}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  console.log("[Archive] Rendering archive page with", displayedAudits.length, "audits");

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={handleNavigateToArchive}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              <h2 className="text-xl font-semibold">ארכיון סקרים</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="חיפוש בארכיון..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 w-[250px] text-right"
                dir="rtl"
              />
            </div>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              רשימת סקרים בארכיון ({displayedAudits.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditsTable 
              audits={displayedAudits}
              userRole={user.role}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={(audit) => {}}
              onDeleteAudit={handleAuditDelete}
              onEmailClick={() => {}}
              onStatusChange={handleStatusChange}
              isArchive={true}
              onDataChange={handleDataChange}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ArchivePage;
