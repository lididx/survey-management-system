
import { User } from "@/types/types";

export const useAuditPermissions = (user: User | null) => {
  // בדיקת הרשאות למחיקה
  const canDelete = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלות לא יכולות למחוק רשומות
    if (user.role === "מנהלת") return false;
    
    // בודקים יכולים למחוק רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  // בדיקת הרשאות לעריכה
  const canEdit = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלות יכולות לערוך כל רשומה
    if (user.role === "מנהלת") return true;
    
    // בודקים יכולים לערוך רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  return { canDelete, canEdit };
};
