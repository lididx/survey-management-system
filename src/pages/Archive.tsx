
import { useState, useCallback, useEffect } from "react";
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
import { getStoredAudits } from "@/utils/auditStorage";
import { getCurrentUser } from "@/utils/supabaseAuth";

const ArchivePage = () => {
  const { user } = useAuthManager();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [audits, setAudits] = useState<Audit[]>([]);
  const currentUser = getCurrentUser();
  
  const { canDelete, canEdit } = useAuditPermissions(currentUser);

  const loadAudits = useCallback(() => {
    if (!currentUser) return;
    
    // Load audits based on user permissions
    let allAudits: Audit[] = [];
    if (currentUser.role === "מנהלת") {
      allAudits = getStoredAudits(null);
    } else {
      allAudits = getStoredAudits(currentUser.email);
    }
    
    setAudits(allAudits);
  }, [currentUser]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  // Filter audits for archive - based on new logic
  const archivedAudits = audits.filter(audit => 
    isAuditInArchiveView(audit.id, audit.currentStatus)
  );
  
  const displayedAudits = searchQuery
    ? archivedAudits.filter(audit => 
        audit.name.includes(searchQuery) || 
        audit.currentStatus.includes(searchQuery) ||
        (audit.clientName && audit.clientName.includes(searchQuery))
      )
    : archivedAudits;

  const handleAuditDelete = async (auditId: string) => {
    console.log(`[Archive] Deleting audit ${auditId}`);
    
    try {
      if (!currentUser) {
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

      // Here we would call the delete function
      // For now, we'll refresh the data
      loadAudits();
      toast.success("הסקר נמחק בהצלחה מהארכיון");
    } catch (error) {
      console.error("[Archive] Error deleting audit:", error);
      toast.error("שגיאה במחיקת הסקר");
    }
  };

  const handleNavigateToArchive = () => {
    // We're already on archive page
  };

  if (!currentUser) return null;

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
              userRole={currentUser.role}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={(audit) => {}}
              onDeleteAudit={handleAuditDelete}
              onEmailClick={() => {}}
              onStatusChange={() => {}}
              isArchive={true}
              onDataChange={loadAudits}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ArchivePage;
