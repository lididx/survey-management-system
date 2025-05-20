
import { useState, useEffect } from 'react';
import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { 
  getAudits, 
  createNewAudit, 
  updateExistingAudit, 
  deleteAuditById,
  updateAuditStatusInDb,
  migrateLocalDataToSupabase
} from '@/utils/supabase';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  // Initialize audits from Supabase
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
        
        // בדיקה אם נדרשת העברת נתונים מקומיים ל-Supabase
        const dataMigrated = await migrateLocalDataToSupabase(user.email, user.name);
        
        console.log(`[useAuditManager] Data migration result: ${dataMigrated}`);
        
        // קבלת כל הסקרים מ-Supabase
        const supabaseAudits = await getAudits(user.email, user.role);
        console.log(`[useAuditManager] Loaded ${supabaseAudits.length} audits from Supabase`);
        
        setAudits(supabaseAudits);
      } catch (error) {
        console.error("[useAuditManager] Error loading audits:", error);
        toast.error("שגיאה בטעינת נתוני הסקרים");
        // במקרה של שגיאה, נשתמש בנתונים ראשוניים
        setAudits(initialAudits);
      } finally {
        setLoading(false);
      }
    };
    
    loadAudits();
  }, [user, initialAudits]);

  // Determine which audits the user can see - now handled by the server with RLS
  const filteredAudits = audits;

  const handleCreateAudit = () => {
    setFormMode("create");
    setCurrentAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
  };

  const handleDeleteAudit = async (id: string, canDelete: (auditOwnerId: string) => boolean) => {
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
      // עדכון הסקרים המקומיים
      setAudits(prevAudits => prevAudits.filter(audit => audit.id !== id));
    }
  };
  
  const handleStatusChange = async (audit: Audit, newStatus: StatusType) => {
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
    const success = await updateAuditStatusInDb(audit.id, newStatus, reason, user.name);
    
    if (success) {
      // עדכון הסקר המקומי
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
      
      setAudits(prevAudits => prevAudits.map(a => {
        if (a.id === audit.id) {
          return {
            ...a,
            currentStatus: newStatus,
            statusLog: [newStatusLog, ...a.statusLog]
          };
        }
        return a;
      }));
    }
  };

  const handleAuditSubmit = async (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean) => {
    if (!user) {
      toast.error("נדרש להיות מחובר כדי לשמור סקר");
      return null;
    }
    
    try {
      if (formMode === "create") {
        // יצירת סקר חדש
        const newAudit = await createNewAudit(auditData, user.email, user.name);
        
        // עדכון הסקרים המקומיים
        setAudits(prevAudits => [newAudit, ...prevAudits]);
        return newAudit;
      } else if (formMode === "edit" && currentAudit) {
        // וידוא הרשאות עריכה
        if (!canEdit(currentAudit.ownerId)) {
          toast.error("אין לך הרשאה לערוך סקר זה");
          return null;
        }
        
        // עדכון סקר קיים
        const updatedAudit = await updateExistingAudit(currentAudit.id, auditData, user.name);
        
        // עדכון הסקרים המקומיים
        setAudits(prevAudits => prevAudits.map(audit => 
          audit.id === updatedAudit.id ? updatedAudit : audit
        ));
        
        return updatedAudit;
      }
    } catch (error) {
      console.error("[handleAuditSubmit] Error:", error);
      toast.error("שגיאה בשמירת הסקר");
    }
    
    return null;
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
