
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { GroupedAuditsTable } from "@/components/dashboard/GroupedAuditsTable";
import { AuditForm } from "@/components/AuditForm";
import { getStoredAudits } from "@/utils/auditStorage";
import { Audit } from "@/types/types";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/localAuth";

const Dashboard = () => {
  const [audits, setAudits] = useState<Audit[]>(getStoredAudits(null));
  const [showAuditForm, setShowAuditForm] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthManager();
  const currentUser = getCurrentUser();

  const refreshAudits = useCallback(() => {
    setAudits(getStoredAudits(null));
  }, []);

  const handleFormSuccess = () => {
    refreshAudits();
    setShowAuditForm(false);
    setEditingAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setEditingAudit(audit);
    setShowAuditForm(true);
  };

  const handleDeleteAudit = () => {
    refreshAudits();
  };

  const handleNavigateToArchive = () => {
    navigate("/archive");
  };

  const handleNavigateToAdmin = () => {
    navigate("/admin");
  };

  const handleNotificationClick = (auditId: string) => {
    // Find the audit and scroll to it in the table
    const auditElement = document.querySelector(`[data-audit-id="${auditId}"]`);
    if (auditElement) {
      auditElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary highlight effect
      auditElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        auditElement.classList.remove('bg-yellow-100');
      }, 3000);
    }
  };

  if (showAuditForm) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <AuditForm
          audit={editingAudit}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowAuditForm(false);
            setEditingAudit(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={handleNavigateToArchive}
        onNavigateToAdmin={currentUser?.isAdmin ? handleNavigateToAdmin : undefined}
        onNotificationClick={handleNotificationClick}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <StatusCards 
            audits={audits}
          />
          
          <div className="mt-8">
            <GroupedAuditsTable
              audits={audits}
              userRole={currentUser?.role || "בודק"}
              canEdit={(auditOwnerId: string) => true}
              canDelete={(auditOwnerId: string) => true}
              onEditAudit={handleEditAudit}
              onDeleteAudit={handleDeleteAudit}
              onEmailClick={() => {}}
              onStatusChange={() => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
