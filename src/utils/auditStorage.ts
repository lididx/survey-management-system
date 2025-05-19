
import { Audit } from '@/types/types';
import { toast } from 'sonner';

// Sample audits as fallback data for new users
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
    ownerId: "lidor@example.com",
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
    ownerId: "lidor@example.com",
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
    ownerId: "moran@example.com",
    ownerName: "מורן"
  }
];

// Global storage key for all audits
const GLOBAL_AUDITS_KEY = 'all_audits';

// Helper functions for localStorage
export const getStorageKey = (userEmail: string | null) => {
  return userEmail ? `audits_${userEmail}` : GLOBAL_AUDITS_KEY;
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

export const getStoredAudits = (userEmail: string | null): Audit[] => {
  try {
    console.log(`[getStoredAudits] Fetching audits for ${userEmail || 'ALL USERS (global)'}`);
    
    // For managers (userEmail is null), get all audits
    const storageKey = getStorageKey(userEmail);
    
    // Test if localStorage is available and working
    try {
      localStorage.getItem("test-localstorage");
    } catch (e) {
      console.error("LocalStorage not available:", e);
      toast.error("שגיאה בגישה לאחסון מקומי");
      return [];
    }
    
    const storedData = localStorage.getItem(storageKey);
    
    if (!storedData) {
      console.log(`[getStoredAudits] No stored data found for key: ${storageKey}`);
      
      // If no global audits exist but we're requesting all, try to aggregate from user audits
      if (storageKey === GLOBAL_AUDITS_KEY) {
        console.log("[getStoredAudits] Attempting to rebuild global audits from user data");
        const allUserKeys = Object.keys(localStorage).filter(key => key.startsWith('audits_'));
        
        if (allUserKeys.length > 0) {
          const allAudits: Audit[] = [];
          allUserKeys.forEach(key => {
            const userData = localStorage.getItem(key);
            if (userData) {
              try {
                const parsedUserAudits = parseAuditsData(userData);
                console.log(`[getStoredAudits] Found ${parsedUserAudits.length} audits for key ${key}`);
                allAudits.push(...parsedUserAudits);
              } catch (e) {
                console.error(`[getStoredAudits] Error parsing user data for key ${key}:`, e);
              }
            }
          });
          
          console.log(`[getStoredAudits] Reconstructed ${allAudits.length} total audits from user data`);
          // Save this reconstructed data back to global storage for future use
          if (allAudits.length > 0) {
            saveAuditsToStorage(null, allAudits);
          }
          
          return allAudits;
        }
      }
      return [];
    }
    
    const parsedAudits = parseAuditsData(storedData);
    console.log(`[getStoredAudits] Retrieved ${parsedAudits.length} audits from ${storageKey}`);
    
    // Verify data integrity
    if (parsedAudits.length > 0) {
      const hasMissingFields = parsedAudits.some(audit => 
        !audit.id || !audit.name || !audit.ownerId
      );
      
      if (hasMissingFields) {
        console.warn("[getStoredAudits] Some audits have missing required fields");
      }
    }
    
    return parsedAudits;
  } catch (error) {
    console.error("[getStoredAudits] Error loading audits from localStorage:", error);
    toast.error("שגיאה בטעינת נתונים");
    return [];
  }
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
    
    const storageKey = getStorageKey(userEmail);
    console.log(`[saveAuditsToStorage] Saving ${filteredAudits.length} audits to ${storageKey}`);
    
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
  if (!userEmail) return;
  try {
    const storageKey = getStorageKey(userEmail);
    console.log(`[clearUserAudits] Clearing user data for ${userEmail}`);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error("[clearUserAudits] Error clearing user audits:", error);
  }
};

