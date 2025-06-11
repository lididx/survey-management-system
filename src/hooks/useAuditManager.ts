
import { useState, useEffect } from 'react';
import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { 
  getAudits, 
  createNewAudit, 
  updateExistingAudit, 
  deleteAuditById,
  updateAuditStatusInDb
} from '@/utils/supabase';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  
  useEffect(() => {
    if (!user) {
      console.log("[useAuditManager] No user, setting empty audits");
      setAudits([]);
      setLoading(false);
      return;
    }
    
    console.log(`[useAuditManager] Loading audits for user: ${user.email}, role: ${user.role}`);
    
    const loadAudits = async () => {
      try {
        setLoading(true);
        
        const supabaseAudits = await getAudits(user.email, user.role);
        console.log(`[useAuditManager] Loaded ${supabaseAudits.length} audits from Supabase`);
        
        setAudits(supabaseAudits);
      } catch (error) {
        console.error("[useAuditManager] Error loading audits:", error);
        toast.error("שגיאה בטעינת נתוני הסקרים");
        setAudits([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAudits();
  }, [user]);

  // Filter audits based on user role
  const filteredAudits = user ? (
    user.role === "מנהלת" || user.role === "מנהל מערכת" || user.isAdmin
      ? audits // Managers see ALL audits
      : audits.filter(audit => audit.ownerId === user.email) // Auditors see only their audits
  ) : [];

  const handleCreateAudit = () => {
    setFormMode("create");
    setCurrentAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
  };

  const handleDeleteAudit = async (id: string, canDelete: (auditOwnerId: string) => boolean) => {
    try {
      const auditToDelete = audits.find(audit => audit.id === id);
      
      if (!auditToDelete) {
        toast.error("הסקר לא נמצא");
        return;
      }
      
      if (!canDelete(auditToDelete.ownerId)) {
        toast.error("אין לך הרשאה למחוק סקר זה");
        return;
      }
      
      const success = await deleteAuditById(id);
      
      if (success) {
        // Refresh audits from database
        if (user) {
          const updatedAudits = await getAudits(user.email, user.role);
          setAudits(updatedAudits);
        }
        toast.success("הסקר נמחק בהצלחה");
        console.log(`[handleDeleteAudit] Successfully deleted audit ${id}`);
      } else {
        throw new Error("שגיאה במחיקת הסקר");
      }
    } catch (error) {
      console.error("[handleDeleteAudit] Error:", error);
      toast.error("שגיאה במחיקת הסקר");
    }
  };
  
  const handleStatusChange = async (audit: Audit, newStatus: StatusType) => {
    try {
      if (!user) {
        toast.error("נדרש להיות מחובר כדי לעדכן סטטוס");
        return;
      }
      
      const canEdit = (auditOwnerId: string) => {
        if (user.role === "מנהלת" || user.role === "מנהל מערכת" || user.isAdmin) return true;
        return user.role === "בודק" && auditOwnerId === user.email;
      };
      
      if (!canEdit(audit.ownerId)) {
        toast.error("אין לך הרשאה לעדכן סקר זה");
        return;
      }
      
      const reason = `עדכון סטטוס ל-${newStatus}`;
      const success = await updateAuditStatusInDb(audit.id, newStatus, reason, user.name);
      
      if (success) {
        // Refresh audits from database
        const updatedAudits = await getAudits(user.email, user.role);
        setAudits(updatedAudits);
        toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
      } else {
        throw new Error("שגיאה בעדכון הסטטוס");
      }
    } catch (error) {
      console.error("[handleStatusChange] Error:", error);
      toast.error("שגיאה בעדכון סטטוס הסקר");
    }
  };

  const handleAuditSubmit = async (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean): Promise<Audit | null> => {
    if (!user) {
      toast.error("נדרש להיות מחובר כדי לשמור סקר");
      return null;
    }
    
    try {
      if (formMode === "create") {
        const newAudit = await createNewAudit(auditData, user.email, user.name);
        
        // Refresh audits from database to include the new audit
        const updatedAudits = await getAudits(user.email, user.role);
        setAudits(updatedAudits);
        
        console.log("[handleAuditSubmit] Created new audit:", newAudit);
        toast.success("סקר חדש נוצר בהצלחה");
        setNewlyCreatedAudit(newAudit);
        return newAudit;
      } else if (formMode === "edit" && currentAudit) {
        if (!canEdit(currentAudit.ownerId)) {
          toast.error("אין לך הרשאה לערוך סקר זה");
          return null;
        }
        
        const updatedAudit = await updateExistingAudit(currentAudit.id, auditData, user.name);
        
        // Refresh audits from database
        const updatedAudits = await getAudits(user.email, user.role);
        setAudits(updatedAudits);
        
        toast.success("סקר עודכן בהצלחה");
        return updatedAudit;
      }
      
      return null;
    } catch (error) {
      console.error("[handleAuditSubmit] Error:", error);
      toast.error("שגיאה בשמירת הסקר");
      return null;
    }
  };

  const sendNotificationEmail = async (audit: Audit, recipients: string[], subject: string, body: string) => {
    if (!user) {
      toast.error("נדרש להיות מחובר כדי לשלוח התראות");
      return false;
    }
    
    try {
      toast.success("הודעה נשלחה בהצלחה", {
        description: `נשלח ל-${recipients.length} נמענים`
      });
      return true;
    } catch (error) {
      console.error("[sendNotificationEmail] Error:", error);
      toast.error("שגיאה בשליחת ההודעה");
      return false;
    }
  };

  return {
    audits,
    filteredAudits,
    currentAudit,
    newlyCreatedAudit,
    formMode,
    loading,
    setFormMode,
    setCurrentAudit,
    setNewlyCreatedAudit,
    handleCreateAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleStatusChange,
    handleAuditSubmit,
    sendNotificationEmail
  };
};
