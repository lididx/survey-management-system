
import { Audit, StatusType } from "@/types/types";
import { toast } from "sonner";
import { 
  getAudits, 
  updateAuditArchiveStatus, 
  deleteAuditById, 
  updateAuditStatusInDb 
} from "./supabase";

// Check if audit is in archive view (helper function)
export const isAuditInArchiveView = (audit: Audit): boolean => {
  // This function can be used to determine if an audit should be shown in archive view
  // For now, we'll use a simple check based on status or archive flag
  return audit.currentStatus === "הסתיים";
};

// Add audit to archive (alias for moveToArchive)
export const addToArchive = async (auditId: string): Promise<boolean> => {
  return await moveToArchive(auditId);
};

// Remove audit from archive (alias for restoreFromArchive)
export const removeFromArchive = async (auditId: string): Promise<boolean> => {
  return await restoreFromArchive(auditId);
};

export const moveToArchive = async (auditId: string): Promise<boolean> => {
  console.log(`[moveToArchive] Moving audit ${auditId} to archive`);
  
  try {
    const success = await updateAuditArchiveStatus(auditId, true);
    
    if (success) {
      toast.success("הסקר הועבר לארכיון");
      return true;
    } else {
      toast.error("שגיאה בהעברת הסקר לארכיון");
      return false;
    }
  } catch (error) {
    console.error("[moveToArchive] Error:", error);
    toast.error("שגיאה בהעברת הסקר לארכיון");
    return false;
  }
};

export const restoreFromArchive = async (auditId: string): Promise<boolean> => {
  console.log(`[restoreFromArchive] Restoring audit ${auditId} from archive`);
  
  try {
    const success = await updateAuditArchiveStatus(auditId, false);
    
    if (success) {
      toast.success("הסקר הוחזר מהארכיון");
      return true;
    } else {
      toast.error("שגיאה בהחזרת הסקר מהארכיון");
      return false;
    }
  } catch (error) {
    console.error("[restoreFromArchive] Error:", error);
    toast.error("שגיאה בהחזרת הסקר מהארכיון");
    return false;
  }
};

export const deleteFromArchive = async (auditId: string): Promise<boolean> => {
  console.log(`[deleteFromArchive] Deleting audit ${auditId} from archive`);
  
  try {
    const success = await deleteAuditById(auditId);
    
    if (success) {
      toast.success("הסקר נמחק סופית מהארכיון");
      return true;
    } else {
      toast.error("שגיאה במחיקת הסקר מהארכיון");
      return false;
    }
  } catch (error) {
    console.error("[deleteFromArchive] Error:", error);
    toast.error("שגיאה במחיקת הסקר מהארכיון");
    return false;
  }
};

export const changeStatusInArchive = async (
  auditId: string, 
  newStatus: StatusType, 
  modifiedBy: string
): Promise<boolean> => {
  console.log(`[changeStatusInArchive] Changing status for audit ${auditId} to ${newStatus}`);
  
  try {
    const success = await updateAuditStatusInDb(
      auditId, 
      newStatus, 
      `עדכון סטטוס ל-${newStatus} מהארכיון`, 
      modifiedBy
    );
    
    if (success) {
      toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
      return true;
    } else {
      toast.error("שגיאה בעדכון סטטוס הסקר");
      return false;
    }
  } catch (error) {
    console.error("[changeStatusInArchive] Error:", error);
    toast.error("שגיאה בעדכון סטטוס הסקר");
    return false;
  }
};

export const loadArchivedAudits = async (): Promise<Audit[]> => {
  console.log(`[loadArchivedAudits] Loading archived audits from Supabase`);
  
  try {
    const audits = await getAudits();
    console.log(`[loadArchivedAudits] Loaded ${audits.length} audits`);
    return audits;
  } catch (error) {
    console.error("[loadArchivedAudits] Error:", error);
    toast.error("שגיאה בטעינת סקרים מהארכיון");
    return [];
  }
};
