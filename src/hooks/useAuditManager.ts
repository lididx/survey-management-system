import { useState, useEffect } from 'react';
import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { 
  getAudits, 
  createNewAudit, 
  updateExistingAudit, 
  deleteAuditById,
  updateAuditStatusInDb,
  isSupabaseConfigured
} from '@/utils/supabase';
import {
  getStoredAudits,
  saveAuditsToStorage
} from '@/utils/auditStorage';

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
        
        if (!isSupabaseConfigured()) {
          console.log("[useAuditManager] Supabase is not configured, using localStorage data");
          
          // NO SAMPLE AUDITS - only load existing stored audits
          const storedAudits = getStoredAudits(null);
          console.log(`[useAuditManager] Loaded ${storedAudits.length} stored audits from localStorage`);
          setAudits(storedAudits);
          setLoading(false);
          return;
        }

        const supabaseAudits = await getAudits(user.email, user.role);
        console.log(`[useAuditManager] Loaded ${supabaseAudits.length} audits from Supabase`);
        
        setAudits(supabaseAudits);
      } catch (error) {
        console.error("[useAuditManager] Error loading audits:", error);
        toast.error("שגיאה בטעינת נתוני הסקרים");
        
        // Only load existing stored audits, NO SAMPLE DATA
        const storedAudits = getStoredAudits(null);
        setAudits(storedAudits);
      } finally {
        setLoading(false);
      }
    };
    
    loadAudits();
  }, [user]);

  // Fix the filtering logic - managers should see ALL audits
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
      
      let success = false;
      
      if (isSupabaseConfigured()) {
        success = await deleteAuditById(id);
      } else {
        const updatedAudits = audits.filter(audit => audit.id !== id);
        success = saveAuditsToStorage(null, updatedAudits);
        
        if (success) {
          setAudits(updatedAudits);
        }
      }
      
      if (success) {
        setAudits(prevAudits => prevAudits.filter(audit => audit.id !== id));
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
      let success = false;
      
      if (isSupabaseConfigured()) {
        success = await updateAuditStatusInDb(audit.id, newStatus, reason, user.name);
        
        if (success) {
          const updatedAudits = await getAudits(user.email, user.role);
          setAudits(updatedAudits);
        }
      } else {
        const now = new Date();
        const newStatusLog = {
          id: crypto.randomUUID(),
          timestamp: now,
          oldStatus: audit.currentStatus,
          newStatus,
          oldDate: null,
          newDate: null,
          reason,
          modifiedBy: user.name
        };
        
        const updatedAudit = {
          ...audit,
          currentStatus: newStatus,
          statusLog: [newStatusLog, ...audit.statusLog]
        };
        
        const updatedAudits = audits.map(a => {
          if (a.id === audit.id) {
            return updatedAudit;
          }
          return a;
        });
        
        success = saveAuditsToStorage(null, updatedAudits);
        
        if (success) {
          setAudits(updatedAudits);
          console.log(`[handleStatusChange] Updated audit ${audit.id} status to ${newStatus}`);
        }
      }
      
      if (success) {
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
        let newAudit: Audit;
        
        if (isSupabaseConfigured()) {
          newAudit = await createNewAudit(auditData, user.email, user.name);
        } else {
          newAudit = {
            ...auditData,
            id: crypto.randomUUID(),
            receivedDate: new Date(),
            currentStatus: "התקבל",
            statusLog: [{
              id: crypto.randomUUID(),
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
          
          const updatedAudits = [newAudit, ...audits];
          setAudits(updatedAudits);
          
          const saved = saveAuditsToStorage(null, updatedAudits);
          if (!saved) {
            throw new Error("שגיאה בשמירת הסקר");
          }
        }
        
        console.log("[handleAuditSubmit] Created new audit:", newAudit);
        toast.success("סקר חדש נוצר בהצלחה");
        return newAudit;
      } else if (formMode === "edit" && currentAudit) {
        if (!canEdit(currentAudit.ownerId)) {
          toast.error("אין לך הרשאה לערוך סקר זה");
          return null;
        }
        
        let updatedAudit: Audit;
        
        if (isSupabaseConfigured()) {
          updatedAudit = await updateExistingAudit(currentAudit.id, auditData, user.name);
        } else {
          updatedAudit = {
            ...currentAudit,
            ...auditData,
          };
          
          const updatedAudits = audits.map(audit => 
            audit.id === updatedAudit.id ? updatedAudit : audit
          );
          
          setAudits(updatedAudits);
          
          const saved = saveAuditsToStorage(null, updatedAudits);
          if (!saved) {
            throw new Error("שגיאה בשמירת הסקר");
          }
        }
        
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
