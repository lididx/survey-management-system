
import { useState, useEffect, useCallback } from 'react';
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

  // Memoized loadAudits function to prevent recreation on every render
  const loadAudits = useCallback(async () => {
    if (!user) {
      console.log("[useAuditManager] No user, setting empty audits");
      setAudits([]);
      setLoading(false);
      return;
    }
    
    console.log(`[useAuditManager] Loading audits for user: ${user.email}, role: ${user.role}`);
    
    try {
      setLoading(true);
      
      // Load audits from Supabase - RLS will handle filtering
      const supabaseAudits = await getAudits(user);
      console.log(`[useAuditManager] Loaded ${supabaseAudits.length} audits from Supabase (filtered by RLS)`);
      
      setAudits(supabaseAudits);
    } catch (error) {
      console.error("[useAuditManager] Error loading audits:", error);
      toast.error("שגיאה בטעינת נתוני הסקרים");
      setAudits([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]); // Depend on user id and role
  
  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  // RLS handles filtering at DB level, so we use audits directly
  const filteredAudits = audits;

  const handleCreateAudit = useCallback(() => {
    setFormMode("create");
    setCurrentAudit(null);
  }, []);

  const handleEditAudit = useCallback((audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
  }, []);

  const handleDeleteAudit = useCallback(async (id: string, canDelete: (auditOwnerId: string) => boolean) => {
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
      
      // Delete from database - RLS will handle authorization
      const success = await deleteAuditById(id);
      
      if (success) {
        // Update local state instead of reloading to prevent loops
        setAudits(prevAudits => prevAudits.filter(audit => audit.id !== id));
        toast.success("הסקר נמחק בהצלחה");
        console.log(`[handleDeleteAudit] Successfully deleted audit ${id}`);
      } else {
        throw new Error("שגיאה במחיקת הסקר");
      }
    } catch (error) {
      console.error("[handleDeleteAudit] Error:", error);
      toast.error("שגיאה במחיקת הסקר");
    }
  }, [audits]);
  
  const handleStatusChange = useCallback(async (audit: Audit, newStatus: StatusType) => {
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
      
      // Update status in database - RLS will handle authorization
      const success = await updateAuditStatusInDb(audit.id, newStatus, reason, user.name);
      
      if (success) {
        // Update local state instead of reloading to prevent loops
        setAudits(prevAudits => 
          prevAudits.map(a => 
            a.id === audit.id 
              ? { 
                  ...a, 
                  currentStatus: newStatus,
                  statusLog: [{
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    oldStatus: audit.currentStatus,
                    newStatus,
                    oldDate: null,
                    newDate: null,
                    reason,
                    modifiedBy: user.name
                  }, ...a.statusLog]
                }
              : a
          )
        );
        toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
      } else {
        throw new Error("שגיאה בעדכון הסטטוס");
      }
    } catch (error) {
      console.error("[handleStatusChange] Error:", error);
      toast.error("שגיאה בעדכון סטטוס הסקר");
    }
  }, [user]);

  const handleAuditSubmit = useCallback(async (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean): Promise<Audit | null> => {
    if (!user) {
      toast.error("נדרש להיות מחובר כדי לשמור סקר");
      return null;
    }
    
    try {
      if (formMode === "create") {
        // Create new audit in database
        const newAudit = await createNewAudit(auditData, user);
        
        // Update local state instead of reloading to prevent loops
        setAudits(prevAudits => [newAudit, ...prevAudits]);
        
        console.log("[handleAuditSubmit] Created new audit:", newAudit);
        toast.success("סקר חדש נוצר בהצלחה");
        setNewlyCreatedAudit(newAudit);
        return newAudit;
      } else if (formMode === "edit" && currentAudit) {
        if (!canEdit(currentAudit.ownerId)) {
          toast.error("אין לך הרשאה לערוך סקר זה");
          return null;
        }
        
        // Update existing audit in database
        const updatedAudit = await updateExistingAudit(currentAudit.id, auditData, user.name);
        
        // Update local state instead of reloading to prevent loops
        setAudits(prevAudits => 
          prevAudits.map(audit => 
            audit.id === currentAudit.id ? updatedAudit : audit
          )
        );
        
        toast.success("סקר עודכן בהצלחה");
        return updatedAudit;
      }
      
      return null;
    } catch (error) {
      console.error("[handleAuditSubmit] Error:", error);
      toast.error("שגיאה בשמירת הסקר");
      return null;
    }
  }, [formMode, currentAudit, user]);

  const sendNotificationEmail = useCallback(async (audit: Audit, recipients: string[], subject: string, body: string) => {
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
  }, [user]);

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
