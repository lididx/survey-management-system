
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Archive, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Audit, StatusType } from "@/types/types";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { useAuditManager } from "@/hooks/useAuditManager";

const ArchivePage = () => {
  const { user, handleLogout } = useAuthManager();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { 
    filteredAudits,
    currentAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleStatusChange,
    loading
  } = useAuditManager([], user);
  
  const { canDelete, canEdit } = useAuditPermissions(user);

  // סינון סקרים שבארכיון בלבד
  const archivedAudits = filteredAudits.filter(
    audit => audit.currentStatus === "הסתיים"
  );
  
  const displayedAudits = searchQuery
    ? archivedAudits.filter(audit => 
        audit.name.includes(searchQuery) || 
        audit.currentStatus.includes(searchQuery) ||
        (audit.clientName && audit.clientName.includes(searchQuery))
      )
    : archivedAudits;

  const handleAuditStatusChange = async (audit: Audit, newStatus: StatusType) => {
    console.log(`[Archive] Changing status from ${audit.currentStatus} to ${newStatus} for audit ${audit.id}`);
    
    try {
      await handleStatusChange(audit, newStatus);
      
      if (newStatus !== "הסתיים") {
        toast.success("הסקר הוחזר לרשימת הסקרים הפעילים", {
          description: `הסקר "${audit.name}" הועבר בהצלחה לסטטוס ${newStatus}`
        });
      }
    } catch (error) {
      console.error("[Archive] Error changing status:", error);
      toast.error("שגיאה בעדכון סטטוס הסקר");
    }
  };

  const handleAuditDelete = async (auditId: string) => {
    console.log(`[Archive] Deleting audit ${auditId}`);
    
    try {
      await handleDeleteAudit(auditId, canDelete);
      toast.success("הסקר נמחק בהצלחה מהארכיון");
    } catch (error) {
      console.error("[Archive] Error deleting audit:", error);
      toast.error("שגיאה במחיקת הסקר");
    }
  };

  const handleBackToHome = () => {
    navigate("/dashboard");
  };

  const handleNavigateToArchive = () => {
    // We're already on archive page
  };

  const handleNotificationClick = (auditId: string) => {
    setTimeout(() => {
      const auditElement = document.querySelector(`[data-audit-id="${auditId}"]`);
      if (auditElement) {
        auditElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        auditElement.classList.add('bg-yellow-100', 'transition-colors', 'duration-3000');
        setTimeout(() => {
          auditElement.classList.remove('bg-yellow-100');
        }, 3000);
      }
    }, 100);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={handleNavigateToArchive}
        onNotificationClick={handleNotificationClick}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              <h2 className="text-xl font-semibold">ארכיון סקרים שהסתיימו</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              עמוד הבית
            </Button>
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
              onStatusChange={handleAuditStatusChange}
              isArchive={true}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ArchivePage;
