
import { Audit, User } from '@/types/types';
import { toast } from 'sonner';
import { saveAuditsToStorage } from './auditStorage';
import { checkForStalledAudits, sendNotificationEmail } from './notificationUtils';

export const createAudit = (
  auditData: Partial<Audit>, 
  audits: Audit[], 
  user: User
): { newAudits: Audit[], newAudit: Audit } => {
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
      modifiedBy: user.name 
    }],
    ownerId: user.email
  } as Audit;

  const newAudits = [...audits, newAudit];
  
  if (user.email) {
    saveAuditsToStorage(user.email, newAudits);
  }
  
  toast.success("סקר חדש נוצר בהצלחה");
  
  return { newAudits, newAudit };
};

export const editAudit = (
  auditData: Partial<Audit>,
  currentAudit: Audit,
  audits: Audit[],
  user: User | null,
  canEdit: (auditOwnerId: string) => boolean
): { updatedAudits: Audit[], updatedAudit: Audit | null } => {
  if (!canEdit(currentAudit.ownerId)) {
    toast.error("אין לך הרשאה לערוך את הסקר הזה");
    return { updatedAudits: audits, updatedAudit: null };
  }
  
  const updatedAudits = audits.map(audit => 
    audit.id === currentAudit.id ? { ...audit, ...auditData } : audit
  );
  
  if (user?.email) {
    saveAuditsToStorage(user.email, updatedAudits);
  }
  
  toast.success("סקר עודכן בהצלחה");
  
  const updatedAudit = updatedAudits.find(audit => audit.id === currentAudit.id) || null;
  
  if (updatedAudit && auditData.currentStatus === "בבקרה" && currentAudit.currentStatus !== "בבקרה") {
    sendNotificationEmail(
      "chen@example.com",
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
  
  checkForStalledAudits(updatedAudits);
  
  return { updatedAudits, updatedAudit };
};

export const deleteAudit = (
  id: string, 
  audits: Audit[], 
  user: User | null,
  canDelete: (auditOwnerId: string) => boolean
): Audit[] => {
  const auditToDelete = audits.find(a => a.id === id);
  if (!auditToDelete) {
    toast.error("לא נמצא סקר למחיקה");
    return audits;
  }
  
  if (!canDelete(auditToDelete.ownerId)) {
    toast.error("אין לך הרשאה למחוק סקר זה");
    return audits;
  }
  
  const updatedAudits = audits.filter(audit => audit.id !== id);
  
  if (user?.email) {
    saveAuditsToStorage(user.email, updatedAudits);
  }
  
  toast.success(`סקר נמחק בהצלחה`);
  
  return updatedAudits;
};
