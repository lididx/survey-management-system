
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { Audit } from "@/types/types";
import { AuditForm } from "@/components/AuditForm";
import { EmailTemplatePopup } from "@/components/EmailTemplatePopup";
import { RecipientCountInput } from "@/components/RecipientCountInput";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { AuditsTable } from "@/components/dashboard/AuditsTable";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useAuditPermissions } from "@/hooks/useAuditPermissions";
import { useAuditManager } from "@/hooks/useAuditManager";
import { useStaleAudits } from "@/hooks/useStaleAudits";

// נתונים לדוגמה
const sampleAudits: Audit[] = [
  {
    id: "1",
    name: "סקר אבטחה מערכת CRM",
    description: "סקר אבטחת מידע למערכת CRM של החברה",
    contacts: [
      { id: "c1", fullName: "יוסי כהן", role: "מנהל מערכת", email: "yossi@example.com", phone: "050-1234567" }
    ],
    receivedDate: new Date("2023-05-15"),
    plannedMeetingDate: new Date("2023-06-01"),
    currentStatus: "בכתיבה",
    statusLog: [
      {
        id: "s1",
        timestamp: new Date("2023-05-15"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s2",
        timestamp: new Date("2023-05-16"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום"
      },
      {
        id: "s3",
        timestamp: new Date("2023-05-18"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-01"),
        reason: "התקבל אישור לפגישה"
      },
      {
        id: "s4",
        timestamp: new Date("2023-06-02"),
        oldStatus: "נקבע",
        newStatus: "בכתיבה",
        oldDate: null,
        newDate: null,
        reason: "הפגישה הסתיימה, התחלת כתיבת הסקר"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "2",
    name: "סקר אבטחה שרתי מידע",
    description: "סקר אבטחת מידע לשרתי המידע של החברה",
    contacts: [
      { id: "c2", fullName: "שרה לוי", role: "מנהלת תשתיות", email: "sarah@example.com", phone: "050-7654321" },
      { id: "c3", fullName: "דוד ישראלי", role: "מנהל אבטחת מידע", email: "david@example.com", phone: "052-1234567" }
    ],
    receivedDate: new Date("2023-04-10"),
    plannedMeetingDate: null,
    currentStatus: "הסתיים",
    statusLog: [
      {
        id: "s5",
        timestamp: new Date("2023-04-10"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s6",
        timestamp: new Date("2023-04-20"),
        oldStatus: "התקבל",
        newStatus: "הסתיים",
        oldDate: null,
        newDate: null,
        reason: "הסקר הסתיים מכיוון שהוחלט לדחות את הפרויקט"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "3",
    name: "סקר תשתיות רשת",
    description: "סקר אבטחת מידע לתשתיות הרשת",
    contacts: [
      { id: "c4", fullName: "רחל גולן", role: "מנהלת רשת", email: "rachel@example.com", phone: "054-9876543" }
    ],
    receivedDate: new Date("2023-06-01"),
    plannedMeetingDate: new Date("2023-06-15"),
    currentStatus: "נקבע",
    statusLog: [
      {
        id: "s7",
        timestamp: new Date("2023-06-01"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      },
      {
        id: "s8",
        timestamp: new Date("2023-06-02"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום"
      },
      {
        id: "s9",
        timestamp: new Date("2023-06-05"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-15"),
        reason: "התקבל אישור לפגישה"
      }
    ],
    ownerId: "moran@example.com"
  }
];

const Dashboard = () => {
  const { user, handleLogout } = useAuthManager();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(1);
  
  const { 
    filteredAudits,
    currentAudit,
    newlyCreatedAudit,
    formMode,
    setFormMode,
    setCurrentAudit,
    setNewlyCreatedAudit,
    handleCreateAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleAuditSubmit
  } = useAuditManager(sampleAudits, user);
  
  const { canDelete, canEdit } = useAuditPermissions(user);
  
  // Monitor stale audits
  useStaleAudits(sampleAudits);
  
  const handleAuditFormSubmit = (auditData: Partial<Audit>) => {
    const result = handleAuditSubmit(auditData, canEdit);
    
    if (formMode === "create") {
      setIsFormOpen(false);
      if (result) {
        setShowRecipientInput(true);
      }
    } else if (formMode === "edit") {
      setIsEditSheetOpen(false);
    }
  };

  const handleEmailClick = (audit: Audit) => {
    setNewlyCreatedAudit(audit);
    setShowRecipientInput(true);
  };

  const handleRecipientCountSubmitted = (count: number) => {
    setRecipientCount(count);
    setShowRecipientInput(false);
    setShowEmailTemplate(true);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <DashboardHeader user={user} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">סקרי אבטחת מידע</h2>
          {user.role === "בודק" && (
            <Button onClick={() => {
              handleCreateAudit();
              setIsFormOpen(true);
            }} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              הוסף סקר חדש
            </Button>
          )}
        </div>
        
        <StatusCards 
          audits={sampleAudits}
          userRole={user.role} 
          userEmail={user.email}
        />

        <Card>
          <CardHeader>
            <CardTitle>רשימת סקרים</CardTitle>
          </CardHeader>
          <CardContent>
            <AuditsTable 
              audits={filteredAudits}
              userRole={user.role}
              canEdit={canEdit}
              canDelete={canDelete}
              onEditAudit={(audit) => {
                handleEditAudit(audit);
                setIsEditSheetOpen(true);
              }}
              onDeleteAudit={(id) => handleDeleteAudit(id, canDelete)}
              onEmailClick={handleEmailClick}
            />
          </CardContent>
        </Card>
      </main>

      {/* חלון יצירת סקר חדש */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg md:max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>הוספת סקר חדש</DialogTitle>
          </DialogHeader>
          <AuditForm 
            mode="create"
            onSubmit={handleAuditFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* חלון עריכת סקר */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="left" className="w-full max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>עריכת סקר</SheetTitle>
          </SheetHeader>
          {currentAudit && (
            <AuditForm 
              mode="edit"
              audit={currentAudit}
              onSubmit={handleAuditFormSubmit}
              onCancel={() => setIsEditSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* חלון הזנת מספר נמענים */}
      {newlyCreatedAudit && (
        <RecipientCountInput
          audit={newlyCreatedAudit}
          open={showRecipientInput}
          onCancel={() => setShowRecipientInput(false)}
          onConfirm={handleRecipientCountSubmitted}
        />
      )}

      {/* חלון תבנית מייל */}
      {newlyCreatedAudit && (
        <EmailTemplatePopup
          audit={newlyCreatedAudit}
          recipientCount={recipientCount}
          open={showEmailTemplate}
          onClose={() => {
            setShowEmailTemplate(false);
            setNewlyCreatedAudit(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
