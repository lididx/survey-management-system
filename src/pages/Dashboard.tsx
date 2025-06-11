
import { useState, useCallback } from "react";
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
import { getStoredAudits, saveAuditsToStorage } from "@/utils/auditStorage";
import { Audit, StatusType } from "@/types/types";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/supabaseAuth";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { toast } from "sonner";
import { addToArchive, isAuditInArchiveView } from "@/utils/archiveManager";

const Dashboard = () => {
  const { user } = useAuthManager();
  const currentUser = getCurrentUser();
  const { canEdit, canDelete } = useAuditPermissions(currentUser);
  
  // טעינת סקרים לפי הרשאות המשתמש
  const [audits, setAudits] = useState<Audit[]>(() => {
    if (!currentUser) return [];
    
    // מנהלת רואה את כל הסקרים
    if (currentUser.role === "מנהלת") {
      return getStoredAudits(null);
    }
    
    // בודקים רואים רק את הסקרים שלהם
    return getStoredAudits(currentUser.email);
  });
  
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const navigate = useNavigate();

  const refreshAudits = useCallback(() => {
    if (!currentUser) return;
    
    // רענון הסקרים לפי הרשאות המשתמש
    if (currentUser.role === "מנהלת") {
      setAudits(getStoredAudits(null));
    } else {
      setAudits(getStoredAudits(currentUser.email));
    }
  }, [currentUser]);

  const handleFormSuccess = (createdAudit?: Partial<Audit>) => {
    if (!currentUser) {
      toast.error("משתמש לא מחובר");
      return;
    }

    // יצירת סקר חדש
    if (createdAudit && !editingAudit) {
      const newAudit: Audit = {
        ...createdAudit,
        id: crypto.randomUUID(),
        receivedDate: new Date(),
        currentStatus: "התקבל",
        statusLog: [{
          id: crypto.randomUUID(),
          timestamp: new Date(),
          oldStatus: null,
          newStatus: "התקבל",
          oldDate: null,
          newDate: null,
          reason: "יצירת סקר",
          modifiedBy: currentUser.name
        }],
        ownerId: currentUser.email,
        ownerName: currentUser.name
      } as Audit;

      // שמירת הסקר החדש
      const userAudits = getStoredAudits(currentUser.email);
      const updatedUserAudits = [newAudit, ...userAudits];
      
      if (saveAuditsToStorage(currentUser.email, updatedUserAudits)) {
        // גם לעדכן באחסון הגלובלי
        const globalAudits = getStoredAudits(null);
        const otherUsersAudits = globalAudits.filter(audit => audit.ownerId !== currentUser.email);
        saveAuditsToStorage(null, [...otherUsersAudits, ...updatedUserAudits]);
        
        setNewlyCreatedAudit(newAudit);
        
        // רענון הרשימה
        refreshAudits();
        
        toast.success("סקר חדש נוצר בהצלחה!", {
          description: "לחץ על הכפתור למטה לשליחת מייל תיאום",
          action: {
            label: "שלח מייל תיאום",
            onClick: () => setShowEmailModal(true),
          },
          duration: 8000,
        });
      } else {
        toast.error("שגיאה בשמירת הסקר החדש");
      }
    }
    
    // עדכון סקר קיים
    if (editingAudit && createdAudit) {
      const updatedAudit = {
        ...editingAudit,
        ...createdAudit
      };

      // עדכון הסקר באחסון המשתמש
      const userAudits = getStoredAudits(currentUser.email);
      const updatedUserAudits = userAudits.map(audit => 
        audit.id === editingAudit.id ? updatedAudit : audit
      );
      
      if (saveAuditsToStorage(currentUser.email, updatedUserAudits)) {
        // גם לעדכן באחסון הגלובלי
        const globalAudits = getStoredAudits(null);
        const otherUsersAudits = globalAudits.filter(audit => audit.ownerId !== currentUser.email);
        saveAuditsToStorage(null, [...otherUsersAudits, ...updatedUserAudits]);
        
        refreshAudits();
        toast.success("סקר עודכן בהצלחה");
      } else {
        toast.error("שגיאה בעדכון הסקר");
      }
    }
    
    setShowAuditModal(false);
    setEditingAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    if (!canEdit(audit.ownerId)) {
      toast.error("אין לך הרשאה לערוך סקר זה");
      return;
    }
    
    setEditingAudit(audit);
    setShowAuditModal(true);
  };

  const handleDeleteAudit = (id: string) => {
    if (!currentUser) {
      toast.error("משתמש לא מחובר");
      return;
    }

    const auditToDelete = audits.find(audit => audit.id === id);
    if (!auditToDelete) {
      toast.error("הסקר לא נמצא");
      return;
    }

    if (!canDelete(auditToDelete.ownerId)) {
      toast.error("אין לך הרשאה למחוק סקר זה");
      return;
    }

    // מחיקת הסקר
    const userAudits = getStoredAudits(currentUser.email);
    const updatedUserAudits = userAudits.filter(audit => audit.id !== id);
    
    if (saveAuditsToStorage(currentUser.email, updatedUserAudits)) {
      // גם לעדכן באחסון הגלובלי
      const globalAudits = getStoredAudits(null);
      const updatedGlobalAudits = globalAudits.filter(audit => audit.id !== id);
      saveAuditsToStorage(null, updatedGlobalAudits);
      
      refreshAudits();
      toast.success("סקר נמחק בהצלחה");
    } else {
      toast.error("שגיאה במחיקת הסקר");
    }
  };

  const handleStatusChange = (audit: Audit, newStatus: StatusType) => {
    if (!currentUser) {
      toast.error("נדרש להיות מחובר כדי לעדכן סטטוס");
      return;
    }

    if (!canEdit(audit.ownerId) && currentUser.role !== "מנהלת") {
      toast.error("אין לך הרשאה לעדכן סקר זה");
      return;
    }

    const statusChange = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      oldStatus: audit.currentStatus,
      newStatus: newStatus,
      oldDate: null,
      newDate: null,
      reason: `עדכון סטטוס ל-${newStatus}`,
      modifiedBy: currentUser.name
    };

    const updatedAudit = {
      ...audit,
      currentStatus: newStatus,
      statusLog: [statusChange, ...audit.statusLog]
    };

    // עדכון הסקר באחסון
    const auditOwnerEmail = audit.ownerId;
    const userAudits = getStoredAudits(auditOwnerEmail);
    const updatedUserAudits = userAudits.map(a => a.id === audit.id ? updatedAudit : a);
    
    if (saveAuditsToStorage(auditOwnerEmail, updatedUserAudits)) {
      // גם לעדכן באחסון הגלובלי
      const globalAudits = getStoredAudits(null);
      const updatedGlobalAudits = globalAudits.map(a => a.id === audit.id ? updatedAudit : a);
      saveAuditsToStorage(null, updatedGlobalAudits);
      
      // אם הסטטוס השתנה ל"הסתיים", הוסף לארכיון
      if (newStatus === "הסתיים") {
        addToArchive(audit.id);
      }
      
      refreshAudits();
      toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
      
      // רענון הדף לעדכון התצוגה
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error("שגיאה בעדכון סטטוס הסקר");
    }
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

  const handleEmailClick = (audit: Audit) => {
    setNewlyCreatedAudit(audit);
    setShowEmailModal(true);
  };

  // Check if user is Chen (manager) to show statistics
  const isManager = currentUser?.role === "מנהלת" || currentUser?.email === "chen@citadel.co.il";

  // בדיקה שהמשתמש מחובר
  if (!currentUser) {
    return <div>טוען...</div>;
  }

  // סינון הסקרים - הסרת סקרים שבארכיון מהעמוד הראשי
  const activeAudits = audits.filter(audit => 
    !isAuditInArchiveView(audit.id, audit.currentStatus)
  );

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

              {/* כפתור מייל תיאום שמופיע רק אם יש סקר חדש */}
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
            audits={activeAudits}
            userRole={currentUser?.role || "בודק"}
            userEmail={currentUser?.email}
          />
          
          {/* Audits Table */}
          <div className="mt-8">
            <GroupedAuditsTable
              audits={activeAudits}
              userRole={currentUser?.role || "בודק"}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={handleEditAudit}
              onDeleteAudit={handleDeleteAudit}
              onEmailClick={handleEmailClick}
              onStatusChange={handleStatusChange}
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

      {/* Email Template Modal */}
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
