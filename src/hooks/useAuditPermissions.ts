
import { User } from "@/types/types";

export const useAuditPermissions = (user: User | null) => {
  // בדיקת הרשאות למחיקה
  const canDelete = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלי מערכת יכולים למחוק כל סקר
    if (user.isAdmin || user.role === "מנהל מערכת") return true;
    
    // מנהלות לא יכולות למחוק רשומות
    if (user.role === "מנהלת") return false;
    
    // בודקים יכולים למחוק רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  // בדיקת הרשאות לעריכה - מנהלת רואה הכל!
  const canEdit = (auditOwnerId: string) => {
    if (!user) return false;
    
    // מנהלי מערכת יכולים לערוך כל סקר
    if (user.isAdmin || user.role === "מנהל מערכת") return true;
    
    // מנהלות יכולות לערוך כל רשומה (לא רק את שלהן!)
    if (user.role === "מנהלת") return true;
    
    // בודקים יכולים לערוך רק את הסקרים שלהם
    return user.role === "בודק" && auditOwnerId === user.email;
  };

  // בדיקת הרשאות לצפייה במשתמשים
  const canViewUsers = () => {
    if (!user) return false;
    return user.isAdmin || user.role === "מנהל מערכת";
  };

  // בדיקת הרשאות לניהול משתמשים
  const canManageUsers = () => {
    if (!user) return false;
    return user.isAdmin || user.role === "מנהל מערכת";
  };

  return { canDelete, canEdit, canViewUsers, canManageUsers };
};
