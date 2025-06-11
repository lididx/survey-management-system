
import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, Mail } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { GroupedAuditsTable } from "@/components/dashboard/GroupedAuditsTable";
import { StatisticsChart } from "@/components/dashboard/StatisticsChart";
import { AuditFormModal } from "@/components/AuditFormModal";
import { EmailTemplatePopup } from "@/components/EmailTemplatePopup";
import { Audit, StatusType } from "@/types/types";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { useAuditManager } from "@/hooks/useAuditManager";
import { toast } from "sonner";
import { addToArchive, isAuditInArchiveView } from "@/utils/archiveManager";

const Dashboard = () => {
  const { user } = useAuthManager();
  const { canEdit, canDelete } = useAuditPermissions(user);
  
  console.log("[Dashboard] Current user:", user);
  console.log("[Dashboard] User role:", user?.role);
  
  // Use the useAuditManager hook properly
  const {
    audits,
    filteredAudits,
    currentAudit,
    newlyCreatedAudit,
    formMode,
    loading,
    setFormMode,
    setCurrentAudit,
    setNewlyCreatedAudit,
    handleCreateAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleStatusChange,
    handleAuditSubmit
  } = useAuditManager([], user);
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const navigate = useNavigate();

  console.log("[Dashboard] Total audits:", audits.length);
  console.log("[Dashboard] Filtered audits:", filteredAudits.length);

  // Memoize form success handler to prevent recreation
  const handleFormSuccess = useCallback(async (auditData: Partial<Audit>) => {
    console.log("[Dashboard] Form success with data:", auditData);
    
    const result = await handleAuditSubmit(auditData, canEdit);
    
    if (result) {
      setNewlyCreatedAudit(result);
      
      if (formMode === "create") {
        toast.success("סקר חדש נוצר בהצלחה!", {
          description: "לחץ על הכפתור למטה לשליחת מייל תיאום",
          action: {
            label: "שלח מייל תיאום",
            onClick: () => setShowEmailModal(true),
          },
          duration: 8000,
        });
      }
    }
    
    setShowAuditModal(false);
    setCurrentAudit(null);
  }, [handleAuditSubmit, canEdit, formMode, setNewlyCreatedAudit, setCurrentAudit]);

  // Memoize edit handler
  const handleEdit = useCallback((audit: Audit) => {
    console.log("[Dashboard] Editing audit:", audit.id);
    handleEditAudit(audit);
    setShowAuditModal(true);
  }, [handleEditAudit]);

  // Memoize delete handler
  const handleDelete = useCallback(async (id: string) => {
    console.log("[Dashboard] Deleting audit:", id);
    await handleDeleteAudit(id, canDelete);
  }, [handleDeleteAudit, canDelete]);

  // Memoize status handler
  const handleStatus = useCallback(async (audit: Audit, newStatus: StatusType) => {
    console.log("[Dashboard] Changing status for audit:", audit.id, "to:", newStatus);
    
    await handleStatusChange(audit, newStatus);
    
    // If status changed to "הסתיים", add to archive
    if (newStatus === "הסתיים") {
      addToArchive(audit.id);
    }
  }, [handleStatusChange]);

  // Memoize navigation handlers
  const handleNavigateToArchive = useCallback(() => {
    navigate("/archive");
  }, [navigate]);

  const handleNavigateToAdmin = useCallback(() => {
    navigate("/admin");
  }, [navigate]);

  const handleEmailClick = useCallback((audit: Audit) => {
    setNewlyCreatedAudit(audit);
    setShowEmailModal(true);
  }, [setNewlyCreatedAudit]);

  // Check if user is manager to show statistics - memoized
  const isManager = useMemo(() => 
    user?.role === "מנהלת" || user?.email === "chen@citadel.co.il"
  , [user?.role, user?.email]);

  // Memoize active audits calculation
  const activeAudits = useMemo(() => 
    filteredAudits.filter(audit => !isAuditInArchiveView(audit))
  , [filteredAudits]);

  console.log("[Dashboard] Active audits to display:", activeAudits.length);

  // Early returns for loading states
  if (!user) {
    console.log("[Dashboard] No user, returning loading");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען משתמש...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log("[Dashboard] Still loading audits");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני סקרים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={handleNavigateToArchive}
        onNavigateToAdmin={user?.isAdmin ? handleNavigateToAdmin : undefined}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  handleCreateAudit();
                  setShowAuditModal(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                סקר חדש
              </Button>
              
              {isManager && (
                <Button
                  variant={showStatistics ? "default" : "outline"}
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  {showStatistics ? "הסתר סטטיסטיקות" : "הצג סטטיסטיקות"}
                </Button>
              )}

              {newlyCreatedAudit && (
                <Button
                  onClick={() => setShowEmailModal(true)}
                  variant="outline"
                  className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <Mail className="h-4 w-4" />
                  שלח מייל תיאום
                </Button>
              )}
            </div>
          </div>

          {isManager && showStatistics && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>דשבורד סטטיסטיקות</CardTitle>
              </CardHeader>
              <CardContent>
                <StatisticsChart audits={filteredAudits} />
              </CardContent>
            </Card>
          )}

          <StatusCards 
            audits={activeAudits}
            userRole={user?.role || "בודק"}
            userEmail={user?.email}
          />
          
          <div className="mt-8">
            <GroupedAuditsTable
              audits={activeAudits}
              userRole={user?.role || "בודק"}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={handleEdit}
              onDeleteAudit={handleDelete}
              onEmailClick={handleEmailClick}
              onStatusChange={handleStatus}
            />
          </div>
        </div>
      </main>

      <AuditFormModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setCurrentAudit(null);
          setFormMode("create");
        }}
        audit={currentAudit}
        onSubmit={handleFormSuccess}
        mode={formMode}
        currentUser={user}
      />

      {newlyCreatedAudit && (
        <EmailTemplatePopup
          audit={newlyCreatedAudit}
          open={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setNewlyCreatedAudit(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
