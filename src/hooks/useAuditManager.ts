import { useState } from 'react';
import { toast } from 'sonner';
import { Audit, User } from '@/types/types';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Determine which audits the user can see
  const filteredAudits = user?.role === "מנהלת" 
    ? audits 
    : audits.filter(audit => audit.ownerId === user?.email);

  const handleCreateAudit = () => {
    setFormMode("create");
    setCurrentAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
  };

  const handleDeleteAudit = (id: string, canDelete: (auditOwnerId: string) => boolean) => {
    const auditToDelete = audits.find(a => a.id === id);
    if (!auditToDelete) {
      toast.error("לא נמצא סקר למחיקה");
      return;
    }
    
    if (!canDelete(auditToDelete.ownerId)) {
      toast.error("אין לך הרשאה למחוק סקר זה");
      return;
    }
    
    const updatedAudits = audits.filter(audit => audit.id !== id);
    setAudits(updatedAudits);
    toast.success(`סקר נמחק בהצלחה`);
  };

  const handleAuditSubmit = (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean) => {
    if (formMode === "create" && user) {
      const newId = Date.now().toString();
      const newAudit = {
        ...auditData,
        id: newId,
        receivedDate: new Date(),
        currentStatus: "התקבל",
        statusLog: [{
          id: `log-${newId}`,
          timestamp: new Date(),
          oldStatus: null,
          newStatus: "התקבל",
          oldDate: null,
          newDate: null,
          reason: "יצירת סקר",
          modifiedBy: user.name // Include user name who created the audit
        }],
        ownerId: user.email
      } as Audit;

      setAudits([...audits, newAudit]);
      toast.success("סקר חדש נוצר בהצלחה");
      
      // Return the new audit so we can use it in the email template
      return newAudit;
    } else if (formMode === "edit" && currentAudit) {
      // בדיקת הרשאות עריכה
      if (!canEdit(currentAudit.ownerId)) {
        toast.error("אין לך הרשאה לערוך את הסקר הזה");
        return null;
      }
      
      const updatedAudits = audits.map(audit => 
        audit.id === currentAudit.id ? { ...audit, ...auditData } : audit
      );
      setAudits(updatedAudits);
      toast.success("סקר עודכן בהצלחה");
      
      // אם הסטטוס שונה ל"בבקרה", שלח הודעה למנהלת
      const updatedAudit = updatedAudits.find(audit => audit.id === currentAudit.id);
      if (updatedAudit && auditData.currentStatus === "בבקרה" && currentAudit.currentStatus !== "בבקרה") {
        sendNotificationEmail(
          "chen@example.com", // החלף בכתובת האימייל האמיתית של חן
          `סקר חדש לבקרה: ${updatedAudit.name}`,
          `שלום חן,
          
הסקר "${updatedAudit.name}" עבר לסטטוס בקרה ומחכה לבדיקתך.

לצפייה בפרטי הסקר, אנא היכנס/י למערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
        );
        
        toast.info("נשלחה התראה למנהלת על סקר לבקרה", {
          description: `סקר "${auditData.name}" עבר לסטטוס בקרה`
        });
      }
      
      // Check for stalled audits that need reminders
      checkForStalledAudits(updatedAudits);
      
      return updatedAudits.find(audit => audit.id === currentAudit.id) || null;
    }
    return null;
  };
  
  // פונקציה לשליחת התראה למייל (דמה)
  const sendNotificationEmail = (to: string, subject: string, body: string) => {
    // ברירת מחדל: הצג בקונסולה (בסביבת פיתוח)
    console.log(`Email notification:
      To: ${to}
      Subject: ${subject}
      Body: ${body}
    `);
    
    // בסביבת ייצור, היינו משתמשים בשירות אימייל אמיתי
    // למשל SendGrid, AWS SES וכו'
  };

  // פונקציה לבדיקת סקרים שתקועים במשך זמן רב
  const checkForStalledAudits = (currentAudits: Audit[]) => {
    const stalledStatuses = [
      "נשלח מייל תיאום למנהל מערכת",
      "שאלות השלמה מול מנהל מערכת"
    ];
    
    // Get current date and date 7 days ago
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Filter audits by status and last update time
    const stalledAudits = currentAudits.filter(audit => {
      if (!stalledStatuses.includes(audit.currentStatus)) {
        return false;
      }
      
      // Find the latest status update
      const latestStatusUpdate = audit.statusLog
        .filter(log => log.newStatus === audit.currentStatus)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (!latestStatusUpdate) return false;
      
      // Check if the status has been unchanged for more than 7 days
      const logDate = new Date(latestStatusUpdate.timestamp);
      return logDate < sevenDaysAgo;
    });
    
    // Send reminder email for each stalled audit
    stalledAudits.forEach(audit => {
      // Send to audit owner
      sendNotificationEmail(
        audit.ownerId,
        `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
        `שלום,
        
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
אנא בדקו את מצב הסקר ועדכנו את הסטטוס במערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
      );
      
      // Send to manager as well
      sendNotificationEmail(
        "chen@example.com",
        `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
        `שלום חן,
        
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
הסקר שייך ל${audit.ownerId}.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
      );
      
      toast.info(`נשלחה תזכורת אוטומטית לסקר "${audit.name}"`, {
        description: `הסקר בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים`
      });
    });
  };

  return {
    audits,
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
    handleAuditSubmit,
    sendNotificationEmail
  };
};
