
import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { 
  saveAuditsToStorage, 
  getStoredAudits 
} from './auditStorage';
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
    ownerId: user.email,
    ownerName: user.name // Ensure owner name is stored
  } as Audit;

  const newAudits = [...audits, newAudit];
  
  // Correctly update both user-specific and global storage
  if (user.email) {
    if (user.role === "בודק") {
      // Save to user-specific storage first
      saveAuditsToStorage(user.email, newAudits.filter(audit => audit.ownerId === user.email));
      
      // Get current global audits, filter out this user's old ones, and add the new ones
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const userAudits = newAudits.filter(audit => audit.ownerId === user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...userAudits];
      
      // Save updated global audits
      saveAuditsToStorage(null, updatedGlobalAudits);
    } 
    // For managers, simply save all audits globally
    else if (user.role === "מנהלת") {
      saveAuditsToStorage(null, newAudits);
    }
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
  
  // Correctly update both user-specific and global storage
  if (user?.email) {
    if (user.role === "בודק") {
      // Save to user-specific storage first
      const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      saveAuditsToStorage(user.email, userAudits);
      
      // Get current global audits, filter out this user's old ones, and add the updated ones
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...userAudits];
      
      // Save updated global audits
      saveAuditsToStorage(null, updatedGlobalAudits);
    } 
    // For managers, simply save all audits globally
    else if (user.role === "מנהלת") {
      saveAuditsToStorage(null, updatedAudits);
    }
  }
  
  toast.success("סקר עודכן בהצלחה");
  
  const updatedAudit = updatedAudits.find(audit => audit.id === currentAudit.id) || null;
  
  if (updatedAudit && auditData.currentStatus === "בבקרה" && currentAudit.currentStatus !== "בבקרה") {
    sendNotificationEmail(
      "chen@example.com",
      `סקר חדש לבקרה: ${updatedAudit.name}`,
      `שלום חן,
      
הסקר "${updatedAudit.name}" עבור הלקוח "${updatedAudit.clientName}" עבר לסטטוס בקרה ומחכה לבדיקתך.

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

export const updateAuditStatus = (
  auditId: string,
  newStatus: StatusType,
  audits: Audit[],
  user: User | null,
  canEdit: (auditOwnerId: string) => boolean
): Audit[] => {
  const auditToUpdate = audits.find(audit => audit.id === auditId);
  
  if (!auditToUpdate) {
    toast.error("הסקר לא נמצא");
    return audits;
  }
  
  // Special check for managers - they can only update to "בבקרה" or "הסתיים"
  if (user?.role === "מנהלת" && !canEdit(auditToUpdate.ownerId) && 
      newStatus !== "בבקרה" && newStatus !== "הסתיים") {
    toast.error("מנהלים יכולים לעדכן רק לסטטוס 'הסתיים' או 'בבקרה'");
    return audits;
  }
  
  // If not manager or it's the user's own audit
  if (user?.role !== "מנהלת" && !canEdit(auditToUpdate.ownerId)) {
    toast.error("אין לך הרשאה לעדכן את הסקר הזה");
    return audits;
  }
  
  if (auditToUpdate.currentStatus === newStatus) {
    return audits; // No change needed
  }
  
  const statusChange = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    oldStatus: auditToUpdate.currentStatus,
    newStatus: newStatus,
    oldDate: null,
    newDate: null,
    reason: "עדכון מהיר של סטטוס",
    modifiedBy: user?.name || "מערכת"
  };
  
  const updatedAudit = {
    ...auditToUpdate,
    currentStatus: newStatus,
    statusLog: [...auditToUpdate.statusLog, statusChange]
  };
  
  const updatedAudits = audits.map(audit => 
    audit.id === auditId ? updatedAudit : audit
  );
  
  // Correctly update both user-specific and global storage
  if (user?.email) {
    if (user.role === "בודק") {
      // Save to user-specific storage first
      const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      saveAuditsToStorage(user.email, userAudits);
      
      // Get current global audits, filter out this user's old ones, and add the updated ones
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...userAudits];
      
      // Save updated global audits
      saveAuditsToStorage(null, updatedGlobalAudits);
    } 
    // For managers, simply save all audits globally
    else if (user.role === "מנהלת") {
      saveAuditsToStorage(null, updatedAudits);
    }
  }
  
  toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
  
  // Notify manager if status changed to "בבקרה"
  if (newStatus === "בבקרה" && auditToUpdate.currentStatus !== "בבקרה") {
    sendNotificationEmail(
      "chen@example.com",
      `סקר חדש לבקרה: ${auditToUpdate.name}`,
      `שלום חן,
      
הסקר "${auditToUpdate.name}" עבור הלקוח "${auditToUpdate.clientName}" עבר לסטטוס בקרה ומחכה לבדיקתך.

לצפייה בפרטי הסקר, אנא היכנס/י למערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
    );
    
    toast.info("נשלחה התראה למנהלת על סקר לבקרה");
  }
  
  return updatedAudits;
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
  
  // Correctly update both user-specific and global storage
  if (user?.email) {
    if (user.role === "בודק") {
      // Save to user-specific storage first (possibly empty array)
      const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      saveAuditsToStorage(user.email, userAudits);
      
      // Get current global audits, filter out this user's old ones, and add the updated ones (if any)
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...userAudits];
      
      // Save updated global audits
      saveAuditsToStorage(null, updatedGlobalAudits);
    } 
    // For managers, simply save all audits globally
    else if (user.role === "מנהלת") {
      saveAuditsToStorage(null, updatedAudits);
    }
  }
  
  toast.success(`סקר נמחק בהצלחה`);
  
  return updatedAudits;
};
