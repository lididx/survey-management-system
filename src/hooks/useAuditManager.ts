
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Audit, User } from '@/types/types';

// Sample audits as fallback data for new users
const sampleAudits: Audit[] = [
  {
    id: "1",
    name: "סקר אבטחה מערכת CRM",
    description: "סקר אבטחת מידע למערכת CRM של החברה",
    contacts: [
      { id: "c1", fullName: "יוסי כהן", role: "מנהל מערכת", email: "yossi@example.com", phone: "050-1234567" }
    ],
    receivedDate: new Date("2023-05-15"),
    plannedMeetingDate: new Date("2023-06-01"),
    currentStatus: "בכתיבה",
    statusLog: [
      {
        id: "s1",
        timestamp: new Date("2023-05-15"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר",
        modifiedBy: "לידור"
      },
      {
        id: "s2",
        timestamp: new Date("2023-05-16"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום",
        modifiedBy: "לידור"
      },
      {
        id: "s3",
        timestamp: new Date("2023-05-18"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-01"),
        reason: "התקבל אישור לפגישה",
        modifiedBy: "לידור"
      },
      {
        id: "s4",
        timestamp: new Date("2023-06-02"),
        oldStatus: "נקבע",
        newStatus: "בכתיבה",
        oldDate: null,
        newDate: null,
        reason: "הפגישה הסתיימה, התחלת כתיבת הסקר",
        modifiedBy: "לידור"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "2",
    name: "סקר אבטחה שרתי מידע",
    description: "סקר אבטחת מידע לשרתי המידע של החברה",
    contacts: [
      { id: "c2", fullName: "שרה לוי", role: "מנהלת תשתיות", email: "sarah@example.com", phone: "050-7654321" },
      { id: "c3", fullName: "דוד ישראלי", role: "מנהל אבטחת מידע", email: "david@example.com", phone: "052-1234567" }
    ],
    receivedDate: new Date("2023-04-10"),
    plannedMeetingDate: null,
    currentStatus: "הסתיים",
    statusLog: [
      {
        id: "s5",
        timestamp: new Date("2023-04-10"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר",
        modifiedBy: "לידור"
      },
      {
        id: "s6",
        timestamp: new Date("2023-04-20"),
        oldStatus: "התקבל",
        newStatus: "הסתיים",
        oldDate: null,
        newDate: null,
        reason: "הסקר הסתיים מכיוון שהוחלט לדחות את הפרויקט",
        modifiedBy: "לידור"
      }
    ],
    ownerId: "lidor@example.com"
  },
  {
    id: "3",
    name: "סקר תשתיות רשת",
    description: "סקר אבטחת מידע לתשתיות הרשת",
    contacts: [
      { id: "c4", fullName: "רחל גולן", role: "מנהלת רשת", email: "rachel@example.com", phone: "054-9876543" }
    ],
    receivedDate: new Date("2023-06-01"),
    plannedMeetingDate: new Date("2023-06-15"),
    currentStatus: "נקבע",
    statusLog: [
      {
        id: "s7",
        timestamp: new Date("2023-06-01"),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר",
        modifiedBy: "מורן"
      },
      {
        id: "s8",
        timestamp: new Date("2023-06-02"),
        oldStatus: "התקבל",
        newStatus: "נשלח מייל תיאום למנהל מערכת",
        oldDate: null,
        newDate: null,
        reason: "נשלח מייל לתיאום",
        modifiedBy: "מורן"
      },
      {
        id: "s9",
        timestamp: new Date("2023-06-05"),
        oldStatus: "נשלח מייל תיאום למנהל מערכת",
        newStatus: "נקבע",
        oldDate: null,
        newDate: new Date("2023-06-15"),
        reason: "התקבל אישור לפגישה",
        modifiedBy: "מורן"
      }
    ],
    ownerId: "moran@example.com"
  }
];

// Helper functions for localStorage
const getStorageKey = (userEmail: string) => `audits_${userEmail}`;

const getStoredAudits = (userEmail: string): Audit[] => {
  try {
    const storedData = localStorage.getItem(getStorageKey(userEmail));
    if (!storedData) return [];
    
    const parsedData = JSON.parse(storedData);
    
    // Convert string dates back to Date objects
    return parsedData.map((audit: any) => ({
      ...audit,
      receivedDate: audit.receivedDate ? new Date(audit.receivedDate) : null,
      plannedMeetingDate: audit.plannedMeetingDate ? new Date(audit.plannedMeetingDate) : null,
      statusLog: audit.statusLog?.map((log: any) => ({
        ...log,
        timestamp: log.timestamp ? new Date(log.timestamp) : null,
        oldDate: log.oldDate ? new Date(log.oldDate) : null,
        newDate: log.newDate ? new Date(log.newDate) : null,
      })) || [],
    }));
  } catch (error) {
    console.error("Error loading audits from localStorage:", error);
    return [];
  }
};

const saveAuditsToStorage = (userEmail: string, audits: Audit[]) => {
  try {
    localStorage.setItem(getStorageKey(userEmail), JSON.stringify(audits));
  } catch (error) {
    console.error("Error saving audits to localStorage:", error);
    toast.error("שגיאה בשמירת נתונים מקומית");
  }
};

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  // Initialize audits from localStorage or use sample data for new users
  const [audits, setAudits] = useState<Audit[]>(() => {
    if (!user?.email) return initialAudits;
    
    const storedAudits = getStoredAudits(user.email);
    return storedAudits.length > 0 ? storedAudits : initialAudits;
  });
  
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  // Save audits to localStorage whenever they change and user is logged in
  useEffect(() => {
    if (user?.email) {
      saveAuditsToStorage(user.email, audits);
    }
  }, [audits, user?.email]);

  // Determine which audits the user can see
  const filteredAudits = user?.role === "מנהלת" 
    ? audits 
    : audits.filter(audit => audit.ownerId === user?.email);

  const handleCreateAudit = () => {
    setFormMode("create");
    setCurrentAudit(null);
  };

  const handleEditAudit = (audit: Audit) => {
    setFormMode("edit");
    setCurrentAudit(audit);
  };

  const handleDeleteAudit = (id: string, canDelete: (auditOwnerId: string) => boolean) => {
    const auditToDelete = audits.find(a => a.id === id);
    if (!auditToDelete) {
      toast.error("לא נמצא סקר למחיקה");
      return;
    }
    
    if (!canDelete(auditToDelete.ownerId)) {
      toast.error("אין לך הרשאה למחוק סקר זה");
      return;
    }
    
    const updatedAudits = audits.filter(audit => audit.id !== id);
    setAudits(updatedAudits);
    
    if (user?.email) {
      saveAuditsToStorage(user.email, updatedAudits);
    }
    
    toast.success(`סקר נמחק בהצלחה`);
  };

  const handleAuditSubmit = (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean) => {
    if (formMode === "create" && user) {
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
        ownerId: user.email
      } as Audit;

      const newAudits = [...audits, newAudit];
      setAudits(newAudits);
      
      if (user.email) {
        saveAuditsToStorage(user.email, newAudits);
      }
      
      toast.success("סקר חדש נוצר בהצלחה");
      
      return newAudit;
    } else if (formMode === "edit" && currentAudit) {
      if (!canEdit(currentAudit.ownerId)) {
        toast.error("אין לך הרשאה לערוך את הסקר הזה");
        return null;
      }
      
      const updatedAudits = audits.map(audit => 
        audit.id === currentAudit.id ? { ...audit, ...auditData } : audit
      );
      setAudits(updatedAudits);
      
      if (user?.email) {
        saveAuditsToStorage(user.email, updatedAudits);
      }
      
      toast.success("סקר עודכן בהצלחה");
      
      const updatedAudit = updatedAudits.find(audit => audit.id === currentAudit.id);
      if (updatedAudit && auditData.currentStatus === "בבקרה" && currentAudit.currentStatus !== "בבקרה") {
        sendNotificationEmail(
          "chen@example.com",
          `סקר חדש לבקרה: ${updatedAudit.name}`,
          `שלום חן,
          
הסקר "${updatedAudit.name}" עבר לסטטוס בקרה ומחכה לבדיקתך.

לצפייה בפרטי הסקר, אנא היכנס/י למערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
        );
        
        toast.info("נשלחה התראה למנהלת על סקר לבקרה", {
          description: `סקר "${auditData.name}" עבר לסטטוס בקרה`
        });
      }
      
      checkForStalledAudits(updatedAudits);
      
      return updatedAudits.find(audit => audit.id === currentAudit.id) || null;
    }
    return null;
  };
  
  // פונקציה לשליחת התראה למייל (דמה)
  const sendNotificationEmail = (to: string, subject: string, body: string) => {
    console.log(`Email notification:
      To: ${to}
      Subject: ${subject}
      Body: ${body}
    `);
  };

  // פונקציה לבדיקת סקרים שתקועים במשך זמן רב
  const checkForStalledAudits = (currentAudits: Audit[]) => {
    const stalledStatuses = [
      "נשלח מייל תיאום למנהל מערכת",
      "שאלות השלמה מול מנהל מערכת"
    ];
    
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const stalledAudits = currentAudits.filter(audit => {
      if (!stalledStatuses.includes(audit.currentStatus)) {
        return false;
      }
      
      const latestStatusUpdate = audit.statusLog
        .filter(log => log.newStatus === audit.currentStatus)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      if (!latestStatusUpdate) return false;
      
      const logDate = new Date(latestStatusUpdate.timestamp);
      return logDate < sevenDaysAgo;
    });
    
    stalledAudits.forEach(audit => {
      sendNotificationEmail(
        audit.ownerId,
        `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
        `שלום,
        
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
אנא בדקו את מצב הסקר ועדכנו את הסטטוס במערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
      );
      
      sendNotificationEmail(
        "chen@example.com",
        `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
        `שלום חן,
        
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
הסקר שייך ל${audit.ownerId}.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
      );
      
      toast.info(`נשלחה תזכורת אוטומטית לסקר "${audit.name}"`, {
        description: `הסקר בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים`
      });
    });
  };

  return {
    audits,
    filteredAudits,
    currentAudit,
    newlyCreatedAudit,
    formMode,
    setFormMode,
    setCurrentAudit,
    setNewlyCreatedAudit,
    handleCreateAudit,
    handleEditAudit,
    handleDeleteAudit,
    handleAuditSubmit,
    sendNotificationEmail
  };
};
