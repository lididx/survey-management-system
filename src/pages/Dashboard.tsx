
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { GroupedAuditsTable } from "@/components/dashboard/GroupedAuditsTable";
import { StatisticsChart } from "@/components/dashboard/StatisticsChart";
import { AuditFormModal } from "@/components/AuditFormModal";
import { getStoredAudits } from "@/utils/auditStorage";
import { Audit } from "@/types/types";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/supabaseAuth";

const Dashboard = () => {
  const [audits, setAudits] = useState<Audit[]>(getStoredAudits(null));
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const navigate = useNavigate();
  const { user } = useAuthManager();
  const currentUser = getCurrentUser();

  const refreshAudits = useCallback(() => {
    setAudits(getStoredAudits(null));
  }, []);

  const handleFormSuccess = () => {
    refreshAudits();
    setShowAuditModal(false);
    setEditingAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setEditingAudit(audit);
    setShowAuditModal(true);
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
    setTimeout(() => {
      const auditElement = document.querySelector(`[data-audit-id="${auditId}"]`);
      if (auditElement) {
        auditElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        auditElement.classList.add('bg-yellow-100', 'transition-colors', 'duration-3000');
        setTimeout(() => {
          auditElement.classList.remove('bg-yellow-100');
        }, 3000);
      }
    }, 100);
  };

  // Check if user is Chen (manager) to show statistics
  const isManager = currentUser?.role === "מנהלת" || currentUser?.email === "chen@example.com";

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <DashboardHeader
        onNavigateToArchive={handleNavigateToArchive}
        onNavigateToAdmin={currentUser?.isAdmin ? handleNavigateToAdmin : undefined}
        onNotificationClick={handleNotificationClick}
      />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAuditModal(true)}
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
            </div>
          </div>

          {/* Statistics for Manager */}
          {isManager && showStatistics && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>דשבורד סטטיסטיקות</CardTitle>
              </CardHeader>
              <CardContent>
                <StatisticsChart audits={audits} />
              </CardContent>
            </Card>
          )}

          {/* Status Cards */}
          <StatusCards 
            audits={audits}
            userRole={currentUser?.role || "בודק"}
            userEmail={currentUser?.email}
          />
          
          {/* Audits Table */}
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

      {/* Audit Form Modal */}
      <AuditFormModal
        isOpen={showAuditModal}
        onClose={() => {
          setShowAuditModal(false);
          setEditingAudit(null);
        }}
        audit={editingAudit}
        onSubmit={handleFormSuccess}
        mode={editingAudit ? "edit" : "create"}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Dashboard;
