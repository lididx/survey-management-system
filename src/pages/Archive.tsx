
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
  } = useAuditManager([], user);
  
  const { canDelete, canEdit } = useAuditPermissions(user);

  // Only show completed audits
  const archivedAudits = filteredAudits.filter(
    audit => audit.currentStatus === "הסתיים"
  );
  
  // Filter audits based on search query
  const displayedAudits = searchQuery
    ? archivedAudits.filter(audit => 
        audit.name.includes(searchQuery) || 
        audit.currentStatus.includes(searchQuery) ||
        (audit.clientName && audit.clientName.includes(searchQuery))
      )
    : archivedAudits;

  const handleAuditStatusChange = (audit: Audit, newStatus: StatusType) => {
    handleStatusChange(audit, newStatus);
    
    if (newStatus !== "הסתיים") {
      toast.success("הסקר הוחזר לרשימת הסקרים הפעילים", {
        description: `הסקר "${audit.name}" הועבר בהצלחה לסטטוס ${newStatus}`
      });
    }
  };

  const handleBackToHome = () => {
    navigate("/dashboard");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={() => {}}
        onNavigateToAdmin={() => {}}
        onNotificationClick={() => {}}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              עמוד הבית
            </Button>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              <h2 className="text-xl font-semibold">ארכיון סקרים שהסתיימו</h2>
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
              רשימת סקרים בארכיון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditsTable 
              audits={displayedAudits}
              userRole={user.role}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={(audit) => {}}
              onDeleteAudit={(id) => handleDeleteAudit(id, canDelete)}
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
