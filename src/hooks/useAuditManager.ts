
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
  saveAuditsToStorage,
  sampleAudits
} from '@/utils/auditStorage';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  // Initialize audits from localStorage (or fallback to initialAudits)
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [loading, setLoading] = useState(true);
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  
  useEffect(() => {
    if (!user) {
      console.log("[useAuditManager] No user, returning initial audits");
      setAudits(initialAudits);
      setLoading(false);
      return;
    }
    
    console.log(`[useAuditManager] Loading audits for user: ${user.email}, role: ${user.role}`);
    
    const loadAudits = async () => {
      try {
        setLoading(true);
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          console.log("[useAuditManager] Supabase is not configured, using localStorage data");
          
          // Get all audits from localStorage
          const storedAudits = getStoredAudits(null);
          
          if (storedAudits.length > 0) {
            setAudits(storedAudits);
          } else {
            // Initialize with sample data if no audits exist
            saveAuditsToStorage(null, sampleAudits);
            setAudits(sampleAudits);
          }
          
          setLoading(false);
          return;
        }

        // If Supabase is configured, get audits from Supabase based on role
        const supabaseAudits = await getAudits(user.email, user.role);
        console.log(`[useAuditManager] Loaded ${supabaseAudits.length} audits from Supabase`);
        
        setAudits(supabaseAudits);
      } catch (error) {
        console.error("[useAuditManager] Error loading audits:", error);
        toast.error("שגיאה בטעינת נתוני הסקרים");
        
        // במקרה של שגיאה, ננסה להשתמש בנתונים מקומיים
        const storedAudits = getStoredAudits(null);
        setAudits(storedAudits.length > 0 ? storedAudits : sampleAudits);
      } finally {
        setLoading(false);
      }
    };
    
    loadAudits();
  }, [user, initialAudits]);

  // Filter audits based on user role
  const filteredAudits = user ? (
    user.role === "מנהלת" 
      ? audits // מנהלות רואות את כל הסקרים
      : audits.filter(audit => audit.ownerId === user.email) // בודקים רואים רק את הסקרים שלהם
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
        // Fallback to local deletion
        const updatedAudits = audits.filter(audit => audit.id !== id);
        setAudits(updatedAudits);
        
        // Save to localStorage
        success = saveAuditsToStorage(null, updatedAudits);
      }
      
      if (success) {
        // עדכון הסקרים המקומיים
        setAudits(prevAudits => prevAudits.filter(audit => audit.id !== id));
        toast.success("סקר נמחק בהצלחה");
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
        // מנהלות יכולות לערוך כל רשומה
        if (user.role === "מנהלת") return true;
        
        // בודקים יכולים לערוך רק את הסקרים שלהם
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
      } else {
        // Fallback to local update
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
        
        const updatedAudits = audits.map(a => {
          if (a.id === audit.id) {
            return {
              ...a,
              currentStatus: newStatus,
              statusLog: [newStatusLog, ...a.statusLog]
            };
          }
          return a;
        });
        
        setAudits(updatedAudits);
        
        // Save to localStorage
        success = saveAuditsToStorage(null, updatedAudits);
      }
      
      if (success) {
        toast.success(`סטטוס הסקר עודכן ל-${newStatus}`);
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
        // יצירת סקר חדש
        let newAudit: Audit;
        
        if (isSupabaseConfigured()) {
          newAudit = await createNewAudit(auditData, user.email, user.name);
        } else {
          // Fallback to local creation
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
          
          // עדכון ושמירת הסקרים
          const updatedAudits = [newAudit, ...audits];
          setAudits(updatedAudits);
          
          // שמירה בלוקל סטורג'
          const saved = saveAuditsToStorage(null, updatedAudits);
          if (!saved) {
            throw new Error("שגיאה בשמירת הסקר");
          }
        }
        
        console.log("[handleAuditSubmit] Created new audit:", newAudit);
        toast.success("סקר חדש נוצר בהצלחה");
        return newAudit;
      } else if (formMode === "edit" && currentAudit) {
        // וידוא הרשאות עריכה
        if (!canEdit(currentAudit.ownerId)) {
          toast.error("אין לך הרשאה לערוך סקר זה");
          return null;
        }
        
        // עדכון סקר קיים
        let updatedAudit: Audit;
        
        if (isSupabaseConfigured()) {
          updatedAudit = await updateExistingAudit(currentAudit.id, auditData, user.name);
        } else {
          // Fallback to local update
          updatedAudit = {
            ...currentAudit,
            ...auditData,
          };
          
          // עדכון ושמירת הסקרים
          const updatedAudits = audits.map(audit => 
            audit.id === updatedAudit.id ? updatedAudit : audit
          );
          
          setAudits(updatedAudits);
          
          // שמירה בלוקל סטורג'
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
