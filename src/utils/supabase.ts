import { createClient } from '@supabase/supabase-js';
import { Audit, User, StatusType } from '@/types/types';
import { toast } from 'sonner';
import { getStoredAudits, saveAuditsToStorage } from './auditStorage';

// Mock Supabase credentials to avoid errors
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-public-anon-key';

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  try {
    return supabaseUrl !== 'https://your-project-url.supabase.co' && supabaseKey !== 'your-public-anon-key';
  } catch (error) {
    console.error("[Supabase] Configuration check error:", error);
    return false;
  }
};

let supabaseClient;
try {
  if (isSupabaseConfigured()) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  } else {
    console.log("[Supabase] Using fallback mode (no Supabase)");
  }
} catch (error) {
  console.error("[Supabase] Client creation error:", error);
}

// Get all audits (based on user role) - NO SAMPLE DATA ADDITION
export const getAudits = async (userEmail: string, userRole: string): Promise<Audit[]> => {
  console.log(`[getAudits] Getting audits for ${userEmail} with role ${userRole}`);
  
  // Fallback to localStorage if Supabase not configured - NO SAMPLE DATA
  if (!isSupabaseConfigured()) {
    console.log("[getAudits] Using local storage fallback - returning existing audits only");
    const storedAudits = getStoredAudits(null);
    console.log(`[getAudits] Found ${storedAudits.length} existing audits in localStorage`);
    return storedAudits; // Return only existing audits, NO SAMPLE DATA
  }
  
  try {
    // Managers see all audits, auditors see only their own
    let query = supabaseClient.from('audits').select('*');
    
    if (userRole === "בודק") {
      query = query.eq('ownerId', userEmail);
    }
    
    const { data, error } = await query.order('receivedDate', { ascending: false });
    
    if (error) {
      console.error("[getAudits] Error:", error);
      toast.error("שגיאה בטעינת נתוני הסקרים");
      throw error;
    }
    
    const parsedAudits = data.map(audit => ({
      ...audit,
      receivedDate: new Date(audit.receivedDate),
      plannedMeetingDate: audit.plannedMeetingDate ? new Date(audit.plannedMeetingDate) : null,
      statusLog: Array.isArray(audit.statusLog) ? audit.statusLog.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        oldDate: log.oldDate ? new Date(log.oldDate) : null,
        newDate: log.newDate ? new Date(log.newDate) : null,
      })) : [],
    }));
    
    console.log(`[getAudits] Retrieved ${parsedAudits.length} audits from Supabase`);
    
    return parsedAudits;
  } catch (error) {
    console.error("[getAudits] Error:", error);
    // In case of error - return only existing local audits, NO SAMPLE DATA
    const localAudits = getStoredAudits(null);
    console.log(`[getAudits] Fallback: returning ${localAudits.length} existing local audits`);
    return localAudits;
  }
};

// Create a new audit
export const createNewAudit = async (auditData: Partial<Audit>, userEmail: string, userName: string): Promise<Audit> => {
  console.log("[createNewAudit] Creating new audit");

  if (!isSupabaseConfigured()) {
    console.log("[createNewAudit] Using local storage fallback");
    const newAudit: Audit = {
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
        modifiedBy: userName
      }],
      ownerId: userEmail,
      ownerName: userName
    } as Audit;
    
    const allAudits = getStoredAudits(null);
    const updatedAudits = [newAudit, ...allAudits];
    saveAuditsToStorage(null, updatedAudits);
    
    return newAudit;
  }

  try {
    const newAuditId = crypto.randomUUID();
    
    const newAudit: Audit = {
      ...auditData,
      id: newAuditId,
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
        modifiedBy: userName
      }],
      ownerId: userEmail,
      ownerName: userName
    } as Audit;
    
    const { error } = await supabaseClient.from('audits').insert(newAudit);
    
    if (error) {
      console.error("[createNewAudit] Error:", error);
      toast.error("שגיאת תצורה: לא ניתן ליצור סקר חדש");
      throw error;
    }
    
    console.log("[createNewAudit] Audit created successfully with ID:", newAuditId);
    
    return newAudit;
  } catch (error) {
    console.error("[createNewAudit] Error:", error);
    toast.error("שגיאה ביצירת סקר חדש");
    throw error;
  }
};

// Update an existing audit
export const updateExistingAudit = async (auditId: string, auditData: Partial<Audit>, userName: string): Promise<Audit> => {
  console.log(`[updateExistingAudit] Updating audit: ${auditId}`);
  
  if (!isSupabaseConfigured()) {
    console.log("[updateExistingAudit] Using local storage fallback");
    const allAudits = getStoredAudits(null);
    const existingAudit = allAudits.find(audit => audit.id === auditId);
    
    if (!existingAudit) {
      throw new Error("Audit not found");
    }
    
    const updatedAudit = {
      ...existingAudit,
      ...auditData
    };
    
    const updatedAudits = allAudits.map(audit => audit.id === auditId ? updatedAudit : audit);
    saveAuditsToStorage(null, updatedAudits);
    
    return updatedAudit;
  }

  try {
    const { data: currentAudit, error: fetchError } = await supabaseClient
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single();
    
    if (fetchError) {
      console.error("[updateExistingAudit] Fetch error:", fetchError);
      toast.error("שגיאה באיתור הסקר");
      throw fetchError;
    }
    
    const updatedAudit = {
      ...currentAudit,
      ...auditData
    };
    
    const { error: updateError } = await supabaseClient
      .from('audits')
      .update(updatedAudit)
      .eq('id', auditId);
    
    if (updateError) {
      console.error("[updateExistingAudit] Update error:", updateError);
      toast.error("שגיאה בעדכון הסקר");
      throw updateError;
    }
    
    console.log(`[updateExistingAudit] Audit updated successfully: ${auditId}`);
    
    return updatedAudit;
  } catch (error) {
    console.error("[updateExistingAudit] Error:", error);
    toast.error("שגיאה בעדכון הסקר");
    throw error;
  }
};

// Delete an audit
export const deleteAuditById = async (auditId: string): Promise<boolean> => {
  console.log(`[deleteAuditById] Deleting audit: ${auditId}`);
  
  if (!isSupabaseConfigured()) {
    console.log("[deleteAuditById] Using local storage fallback");
    const allAudits = getStoredAudits(null);
    const filteredAudits = allAudits.filter(audit => audit.id !== auditId);
    saveAuditsToStorage(null, filteredAudits);
    return true;
  }

  try {
    const { error } = await supabaseClient
      .from('audits')
      .delete()
      .eq('id', auditId);
    
    if (error) {
      console.error("[deleteAuditById] Error:", error);
      toast.error("שגיאה במחיקת הסקר");
      return false;
    }
    
    console.log(`[deleteAuditById] Audit deleted successfully: ${auditId}`);
    
    return true;
  } catch (error) {
    console.error("[deleteAuditById] Error:", error);
    toast.error("שגיאה במחיקת הסקר");
    return false;
  }
};

// Update audit status
export const updateAuditStatusInDb = async (
  auditId: string,
  newStatus: StatusType,
  reason: string,
  modifiedBy: string
): Promise<boolean> => {
  console.log(`[updateAuditStatusInDb] Updating status for audit ${auditId} to ${newStatus}`);
  
  if (!isSupabaseConfigured()) {
    console.log("[updateAuditStatusInDb] Using local storage fallback");
    const allAudits = getStoredAudits(null);
    const existingAudit = allAudits.find(audit => audit.id === auditId);
    
    if (!existingAudit) {
      toast.error("הסקר לא נמצא");
      return false;
    }
    
    const statusChange = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      oldStatus: existingAudit.currentStatus,
      newStatus: newStatus,
      oldDate: null,
      newDate: null,
      reason: reason,
      modifiedBy: modifiedBy
    };
    
    const updatedAudit = {
      ...existingAudit,
      currentStatus: newStatus,
      statusLog: [...existingAudit.statusLog, statusChange]
    };
    
    const updatedAudits = allAudits.map(audit => audit.id === auditId ? updatedAudit : audit);
    saveAuditsToStorage(null, updatedAudits);
    
    return true;
  }

  try {
    const { data: currentAudit, error: fetchError } = await supabaseClient
      .from('audits')
      .select('currentStatus, statusLog')
      .eq('id', auditId)
      .single();
    
    if (fetchError) {
      console.error("[updateAuditStatusInDb] Fetch error:", fetchError);
      toast.error("שגיאה באיתור הסקר");
      return false;
    }
    
    const statusChange = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      oldStatus: currentAudit.currentStatus,
      newStatus: newStatus,
      oldDate: null,
      newDate: null,
      reason: reason,
      modifiedBy: modifiedBy
    };
    
    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({
        currentStatus: newStatus,
        statusLog: [...currentAudit.statusLog, statusChange]
      })
      .eq('id', auditId);
    
    if (updateError) {
      console.error("[updateAuditStatusInDb] Update error:", updateError);
      toast.error("שגיאה בעדכון סטטוס הסקר");
      return false;
    }
    
    console.log(`[updateAuditStatusInDb] Status updated successfully for audit: ${auditId}`);
    
    return true;
  } catch (error) {
    console.error("[updateAuditStatusInDb] Error:", error);
    toast.error("שגיאה בעדכון סטטוס הסקר");
    return false;
  }
};

// Migrate local data to Supabase if needed
export const migrateLocalDataToSupabase = async (userEmail: string, userName: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  console.log(`[migrateLocalDataToSupabase] Checking if migration needed for user: ${userEmail}`);
  
  try {
    const KEY_MIGRATED = `migrated_${userEmail}`;
    const alreadyMigrated = localStorage.getItem(KEY_MIGRATED) === 'true';
    
    if (alreadyMigrated) {
      console.log(`[migrateLocalDataToSupabase] Data already migrated for user: ${userEmail}`);
      return false;
    }
    
    const localAudits = getStoredAudits(userEmail);
    
    if (!localAudits || localAudits.length === 0) {
      console.log(`[migrateLocalDataToSupabase] No local audits found for user: ${userEmail}`);
      localStorage.setItem(KEY_MIGRATED, 'true');
      return false;
    }
    
    console.log(`[migrateLocalDataToSupabase] Found ${localAudits.length} local audits to migrate`);
    
    const { error } = await supabaseClient.from('audits').insert(localAudits);
    
    if (error) {
      console.error("[migrateLocalDataToSupabase] Migration error:", error);
      return false;
    }
    
    localStorage.setItem(KEY_MIGRATED, 'true');
    console.log(`[migrateLocalDataToSupabase] Successfully migrated ${localAudits.length} audits for user: ${userEmail}`);
    
    return true;
  } catch (error) {
    console.error("[migrateLocalDataToSupabase] Error:", error);
    return false;
  }
};
