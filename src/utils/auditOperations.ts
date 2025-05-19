import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { 
  saveAuditsToStorage, 
  getStoredAudits 
} from './auditStorage';
import { checkForStalledAudits, sendNotificationEmail } from './notificationUtils';

// Debug helper function
const debugStorage = (message: string, data?: any) => {
  console.log(`[DEBUG] ${message}`, data || '');
};

export const createAudit = (
  auditData: Partial<Audit>, 
  audits: Audit[], 
  user: User
): { newAudits: Audit[], newAudit: Audit } => {
  debugStorage("Creating new audit for user", user.email);
  
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
    ownerName: user.name
  } as Audit;

  // Add the new audit to the local state (current session)
  const newAudits = [...audits, newAudit];
  
  try {
    // 1. ALWAYS update global storage FIRST for data integrity
    const globalAudits = getStoredAudits(null);
    debugStorage(`Retrieved ${globalAudits.length} existing global audits`);
    
    // Filter out any potential outdated entries for this user in global storage
    const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
    debugStorage(`Filtered to ${otherUserAudits.length} audits from other users`);
    
    // Get this user's updated audits
    const thisUserAudits = newAudits.filter(audit => audit.ownerId === user.email);
    debugStorage(`User ${user.email} now has ${thisUserAudits.length} audits`);
    
    // Combine other users' audits with this user's updated audits
    const updatedGlobalAudits = [...otherUserAudits, ...thisUserAudits];
    debugStorage(`Saving ${updatedGlobalAudits.length} total audits to global storage`);
    
    // Save the combined list to global storage
    const globalSaveSuccess = saveAuditsToStorage(null, updatedGlobalAudits);
    
    if (!globalSaveSuccess) {
      debugStorage("Failed to save to global storage, retrying...");
      // One retry attempt
      saveAuditsToStorage(null, updatedGlobalAudits);
    }
    
    // 2. Then update user-specific storage if applicable
    if (user.email && user.role === "בודק") {
      debugStorage(`Saving ${thisUserAudits.length} audits to user-specific storage for ${user.email}`);
      saveAuditsToStorage(user.email, thisUserAudits);
    }
    
    debugStorage("Verifying saved data...");
    // Verification - check that global storage contains the new audit
    const verifiedGlobalAudits = getStoredAudits(null);
    const newAuditExists = verifiedGlobalAudits.some(audit => audit.id === newId);
    
    if (!newAuditExists) {
      console.error("CRITICAL: New audit not found in global storage after save!");
      toast.error("שגיאה באימות שמירת הנתונים");
    }
  } catch (error) {
    console.error("Error saving audit data:", error);
    toast.error("שגיאה בשמירת הנתונים");
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
  debugStorage(`Editing audit ${currentAudit.id}`);
  
  if (!canEdit(currentAudit.ownerId)) {
    toast.error("אין לך הרשאה לערוך את הסקר הזה");
    return { updatedAudits: audits, updatedAudit: null };
  }
  
  const updatedAudits = audits.map(audit => 
    audit.id === currentAudit.id ? { ...audit, ...auditData } : audit
  );
  
  try {
    if (user?.email) {
      // 1. Update user-specific storage first (if applicable)
      if (user.role === "בודק") {
        const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
        debugStorage(`Saving ${userAudits.length} updated audits to user-specific storage`);
        saveAuditsToStorage(user.email, userAudits);
      }
      
      // 2. ALWAYS update global storage
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const thisUserAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...thisUserAudits];
      
      debugStorage(`Saving ${updatedGlobalAudits.length} total audits to global storage after edit`);
      saveAuditsToStorage(null, updatedGlobalAudits);
    }
  } catch (error) {
    console.error("Error saving edited audit data:", error);
    toast.error("שגיאה בשמירת הנתונים המעודכנים");
  }
  
  toast.success("סקר עודכן בהצלחה");
  
  const updatedAudit = updatedAudits.find(audit => audit.id === currentAudit.id) || null;
  
  // Notification logic for status changes
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
  debugStorage(`Updating status of audit ${auditId} to ${newStatus}`);
  
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
  
  try {
    if (user?.email) {
      // 1. Update user-specific storage first (if applicable)
      if (user.role === "בודק") {
        const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
        debugStorage(`Saving ${userAudits.length} audits to user-specific storage after status update`);
        saveAuditsToStorage(user.email, userAudits);
      }
      
      // 2. ALWAYS update global storage
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
      const thisUserAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...thisUserAudits];
      
      debugStorage(`Saving ${updatedGlobalAudits.length} total audits to global storage after status update`);
      saveAuditsToStorage(null, updatedGlobalAudits);
    }
  } catch (error) {
    console.error("Error saving status update:", error);
    toast.error("שגיאה בשמירת עדכון הסטטוס");
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
  debugStorage(`Attempting to delete audit ${id}`);
  
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
  
  try {
    if (user?.email) {
      // 1. Update user-specific storage first (if applicable)
      if (user.role === "בודק") {
        const userAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
        debugStorage(`Saving ${userAudits.length} remaining audits to user-specific storage after delete`);
        saveAuditsToStorage(user.email, userAudits);
      }
      
      // 2. ALWAYS update global storage
      const globalAudits = getStoredAudits(null);
      const otherUserAudits = globalAudits.filter(audit => 
        audit.ownerId !== user.email || (audit.ownerId === user.email && audit.id !== id)
      );
      const thisUserAudits = updatedAudits.filter(audit => audit.ownerId === user.email);
      const updatedGlobalAudits = [...otherUserAudits, ...thisUserAudits];
      
      debugStorage(`Saving ${updatedGlobalAudits.length} total audits to global storage after delete`);
      saveAuditsToStorage(null, updatedGlobalAudits);
    }
  } catch (error) {
    console.error("Error saving after delete:", error);
    toast.error("שגיאה במחיקת הסקר");
  }
  
  toast.success(`סקר נמחק בהצלחה`);
  
  return updatedAudits;
};
