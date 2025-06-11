import { Audit } from '@/types/types';
import { toast } from 'sonner';

// Sample audits as fallback data for new users - עם המיילים החדשים
export const sampleAudits: Audit[] = [
  {
    id: "1",
    name: "סקר אבטחה מערכת CRM",
    description: "סקר אבטחת מידע למערכת CRM של החברה",
    clientName: "SAP", 
    contacts: [
      { id: "c1", fullName: "יוסי כהן", role: "מנהל מערכת", email: "yossi@example.com", phone: "050-1234567", gender: "male" }
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
    ownerId: "lidorn@citadel.co.il",
    ownerName: "לידור"
  },
  {
    id: "2",
    name: "סקר אבטחה שרתי מידע",
    description: "סקר אבטחת מידע לשרתי המידע של החברה",
    clientName: "Microsoft",
    contacts: [
      { id: "c2", fullName: "שרה לוי", role: "מנהלת תשתיות", email: "sarah@example.com", phone: "050-7654321", gender: "female" },
      { id: "c3", fullName: "דוד ישראלי", role: "מנהל אבטחת מידע", email: "david@example.com", phone: "052-1234567", gender: "male" }
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
    ownerId: "lidorn@citadel.co.il",
    ownerName: "לידור"
  },
  {
    id: "3",
    name: "סקר תשתיות רשת",
    description: "סקר אבטחת מידע לתשתיות הרשת",
    clientName: "Oracle",
    contacts: [
      { id: "c4", fullName: "רחל גולן", role: "מנהלת רשת", email: "rachel@example.com", phone: "054-9876543", gender: "female" }
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
    ownerId: "moran@citadel.co.il",
    ownerName: "מורן"
  }
];

// תיקון מערכת האחסון להיות ספציפית למשתמש במקום גלובלית
const getUserStorageKey = (userEmail: string) => {
  return `user_audits_${userEmail}`;
};

const GLOBAL_AUDITS_KEY = 'all_audits';

// Helper functions for localStorage
export const getStorageKey = (userEmail: string | null) => {
  if (userEmail) {
    return getUserStorageKey(userEmail);
  }
  return GLOBAL_AUDITS_KEY;
};

// Key for tracking if a user has been initialized with sample data
export const getUserInitKey = (userEmail: string) => {
  return `user_initialized_${userEmail}`;
};

// Function to check if a user has been initialized
export const isUserInitialized = (userEmail: string): boolean => {
  try {
    return localStorage.getItem(getUserInitKey(userEmail)) === 'true';
  } catch (error) {
    console.error("Error checking if user is initialized:", error);
    return false;
  }
};

// Function to mark a user as initialized
export const markUserAsInitialized = (userEmail: string): void => {
  try {
    localStorage.getItem("test-localstorage"); // Test localStorage is working
    localStorage.setItem(getUserInitKey(userEmail), 'true');
    console.log(`User ${userEmail} marked as initialized`);
  } catch (error) {
    console.error("Error marking user as initialized:", error);
    toast.error("שגיאה בשמירת נתונים");
  }
};

// Helper function to parse audit data and convert dates
const parseAuditsData = (jsonData: string): Audit[] => {
  try {
    const parsedData = JSON.parse(jsonData);
    
    if (!Array.isArray(parsedData)) {
      console.error("Parsed data is not an array:", parsedData);
      return [];
    }
    
    // Convert string dates back to Date objects
    return parsedData.map((audit: any) => {
      if (!audit || typeof audit !== 'object') {
        console.error("Invalid audit object:", audit);
        return null;
      }

      try {
        return {
          ...audit,
          receivedDate: audit.receivedDate ? new Date(audit.receivedDate) : null,
          plannedMeetingDate: audit.plannedMeetingDate ? new Date(audit.plannedMeetingDate) : null,
          statusLog: Array.isArray(audit.statusLog) 
            ? audit.statusLog.map((log: any) => ({
                ...log,
                timestamp: log.timestamp ? new Date(log.timestamp) : null,
                oldDate: log.oldDate ? new Date(log.oldDate) : null,
                newDate: log.newDate ? new Date(log.newDate) : null,
              }))
            : [],
        };
      } catch (e) {
        console.error("Error parsing audit:", e, audit);
        return null;
      }
    }).filter(Boolean) as Audit[];
  } catch (e) {
    console.error("Error parsing JSON data:", e);
    return [];
  }
};

// תיקון מערכת הטעינה - כל משתמש יראה רק את הסקרים שלו
export const getStoredAudits = (userEmail: string | null): Audit[] => {
  try {
    console.log(`[getStoredAudits] Fetching audits for ${userEmail || 'ALL USERS'}`);
    
    // אם יש userEmail ספציפי, טען רק את הסקרים שלו
    if (userEmail) {
      const userStorageKey = getUserStorageKey(userEmail);
      const storedData = localStorage.getItem(userStorageKey);
      
      if (!storedData) {
        console.log(`[getStoredAudits] No stored data found for user: ${userEmail}`);
        // אתחול עם נתוני דוגמה רק לאותו משתמש
        const userSampleAudits = sampleAudits.filter(audit => audit.ownerId === userEmail);
        if (userSampleAudits.length > 0) {
          saveAuditsToStorage(userEmail, userSampleAudits);
          return userSampleAudits;
        }
        return [];
      }
      
      const parsedAudits = parseAuditsData(storedData);
      console.log(`[getStoredAudits] Retrieved ${parsedAudits.length} audits for user ${userEmail}`);
      return parsedAudits;
    }
    
    // למנהלת - טען את כל הסקרים
    const allUsersAudits: Audit[] = [];
    const allUsers = ['lidorn@citadel.co.il', 'moran@citadel.co.il'];
    
    allUsers.forEach(user => {
      const userAudits = getStoredAudits(user);
      allUsersAudits.push(...userAudits);
    });
    
    // אם אין סקרים, אתחל עם נתוני דוגמה
    if (allUsersAudits.length === 0) {
      sampleAudits.forEach(audit => {
        saveAuditsToStorage(audit.ownerId, [audit]);
      });
      return sampleAudits;
    }
    
    return allUsersAudits;
  } catch (error) {
    console.error("[getStoredAudits] Error loading audits from localStorage:", error);
    toast.error("שגיאה בטעינת נתונים");
    return [];
  }
};

// Export getAllAudits as an alias for getStoredAudits for backward compatibility
export const getAllAudits = (): Audit[] => {
  return getStoredAudits(null);
};

export const saveAuditsToStorage = (userEmail: string | null, audits: Audit[]) => {
  try {
    // Validate input data
    if (!Array.isArray(audits)) {
      console.error("[saveAuditsToStorage] Invalid audits data (not an array):", audits);
      return false;
    }
    
    const filteredAudits = audits.filter(audit => {
      if (!audit || !audit.id || !audit.name) {
        console.warn("[saveAuditsToStorage] Filtering out invalid audit:", audit);
        return false;
      }
      return true;
    });
    
    // שימוש ב key ספציפי למשתמש או גלובלי
    const storageKey = getStorageKey(userEmail);
    console.log(`[saveAuditsToStorage] Saving ${filteredAudits.length} audits to storage with key: ${storageKey}`);
    
    // Verify localStorage is working
    try {
      localStorage.setItem("test-localstorage", "test");
      localStorage.removeItem("test-localstorage");
    } catch (e) {
      console.error("[saveAuditsToStorage] LocalStorage not available:", e);
      toast.error("שגיאה בגישה לאחסון מקומי");
      return false;
    }
    
    // Ensure we're writing valid JSON
    const jsonData = JSON.stringify(filteredAudits);
    
    // Verify the data is valid before saving
    try {
      JSON.parse(jsonData);
    } catch (e) {
      console.error("[saveAuditsToStorage] Generated invalid JSON:", e);
      toast.error("שגיאה בשמירת נתונים");
      return false;
    }
    
    localStorage.setItem(storageKey, jsonData);
    console.log(`[saveAuditsToStorage] Successfully saved data to ${storageKey}`);
    
    // Verify data was saved correctly
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) {
      console.error(`[saveAuditsToStorage] Data verification failed - no data found in ${storageKey} after save`);
      toast.error("שגיאה באימות שמירת נתונים");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("[saveAuditsToStorage] Error saving audits to localStorage:", error);
    toast.error("שגיאה בשמירת נתונים מקומית");
    return false;
  }
};

// Clear user-specific audit data
export const clearUserAudits = (userEmail: string | null) => {
  if (userEmail) {
    const storageKey = getUserStorageKey(userEmail);
    localStorage.removeItem(storageKey);
    console.log(`[clearUserAudits] Cleared audits for user: ${userEmail}`);
  }
};
