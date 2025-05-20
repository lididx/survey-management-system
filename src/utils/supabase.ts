
import { createClient } from '@supabase/supabase-js';
import { Audit, StatusLog, Contact } from '@/types/types';
import { toast } from 'sonner';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// פונקציות עזר לניהול הסקרים

// קבלת כל הסקרים המותרים לפי הרשאות משתמש
export const getAudits = async (userEmail: string, role: string) => {
  try {
    let query = supabase.from('audits').select(`
      *,
      contacts(*),
      statusLog:status_logs(*)
    `);
    
    // מנהל רואה את כל הסקרים, בודק רואה רק את הסקרים שלו
    if (role !== 'מנהלת') {
      query = query.eq('ownerId', userEmail);
    }
    
    const { data, error } = await query.order('receivedDate', { ascending: false });
    
    if (error) {
      console.error('Error fetching audits:', error);
      throw error;
    }
    
    // המרת הנתונים למבנה הנדרש באפליקציה
    return data.map((audit: any) => ({
      id: audit.id,
      name: audit.name,
      description: audit.description,
      clientName: audit.clientName,
      receivedDate: new Date(audit.receivedDate),
      plannedMeetingDate: audit.plannedMeetingDate ? new Date(audit.plannedMeetingDate) : null,
      currentStatus: audit.currentStatus,
      ownerId: audit.ownerId,
      ownerName: audit.ownerName,
      contacts: audit.contacts,
      statusLog: audit.statusLog.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        oldDate: log.oldDate ? new Date(log.oldDate) : null,
        newDate: log.newDate ? new Date(log.newDate) : null,
      }))
    }));
    
  } catch (error) {
    console.error('Error in getAudits:', error);
    toast.error('שגיאה בטעינת נתוני הסקרים');
    return [];
  }
};

// יצירת סקר חדש
export const createNewAudit = async (auditData: Partial<Audit>, userEmail: string, userName: string) => {
  try {
    // יצירת מזהה ייחודי (אם לא סופק)
    const auditId = auditData.id || crypto.randomUUID();
    
    // יצירת רשומת הסקר
    const { error: auditError } = await supabase.from('audits').insert({
      id: auditId,
      name: auditData.name,
      description: auditData.description || '',
      clientName: auditData.clientName || '',
      receivedDate: auditData.receivedDate?.toISOString() || new Date().toISOString(),
      plannedMeetingDate: auditData.plannedMeetingDate?.toISOString() || null,
      currentStatus: auditData.currentStatus || 'התקבל',
      ownerId: userEmail,
      ownerName: userName
    });
    
    if (auditError) throw auditError;
    
    // יצירת רשומת יומן סטטוסים ראשונית
    const initialStatusLog = {
      id: crypto.randomUUID(),
      auditId: auditId,
      timestamp: new Date().toISOString(),
      oldStatus: null,
      newStatus: auditData.currentStatus || 'התקבל',
      oldDate: null,
      newDate: null,
      reason: 'יצירת סקר',
      modifiedBy: userName
    };
    
    const { error: statusLogError } = await supabase.from('status_logs').insert(initialStatusLog);
    
    if (statusLogError) throw statusLogError;
    
    // יצירת אנשי קשר (אם קיימים)
    if (auditData.contacts && auditData.contacts.length > 0) {
      const contactsToInsert = auditData.contacts.map(contact => ({
        id: contact.id || crypto.randomUUID(),
        auditId: auditId,
        fullName: contact.fullName,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        gender: contact.gender
      }));
      
      const { error: contactsError } = await supabase.from('contacts').insert(contactsToInsert);
      
      if (contactsError) throw contactsError;
    }
    
    toast.success('הסקר נוצר בהצלחה');
    
    // קבלת הסקר החדש עם כל הנתונים הקשורים
    const { data: newAuditData, error: fetchError } = await supabase
      .from('audits')
      .select(`
        *,
        contacts(*),
        statusLog:status_logs(*)
      `)
      .eq('id', auditId)
      .single();
    
    if (fetchError) throw fetchError;
    
    return {
      ...newAuditData,
      receivedDate: new Date(newAuditData.receivedDate),
      plannedMeetingDate: newAuditData.plannedMeetingDate ? new Date(newAuditData.plannedMeetingDate) : null,
      statusLog: newAuditData.statusLog.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        oldDate: log.oldDate ? new Date(log.oldDate) : null,
        newDate: log.newDate ? new Date(log.newDate) : null,
      }))
    };
    
  } catch (error) {
    console.error('Error creating audit:', error);
    toast.error('שגיאה ביצירת הסקר');
    throw error;
  }
};

// עדכון סקר קיים
export const updateExistingAudit = async (auditId: string, auditData: Partial<Audit>, userName: string) => {
  try {
    // עדכון רשומת הסקר
    const { error: auditError } = await supabase
      .from('audits')
      .update({
        name: auditData.name,
        description: auditData.description,
        clientName: auditData.clientName,
        plannedMeetingDate: auditData.plannedMeetingDate?.toISOString() || null,
      })
      .eq('id', auditId);
    
    if (auditError) throw auditError;
    
    // עדכון אנשי הקשר
    if (auditData.contacts && auditData.contacts.length > 0) {
      // מחיקת אנשי קשר קיימים
      await supabase.from('contacts').delete().eq('auditId', auditId);
      
      // הוספת אנשי הקשר החדשים
      const contactsToInsert = auditData.contacts.map(contact => ({
        id: contact.id || crypto.randomUUID(),
        auditId: auditId,
        fullName: contact.fullName,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        gender: contact.gender
      }));
      
      const { error: contactsError } = await supabase.from('contacts').insert(contactsToInsert);
      
      if (contactsError) throw contactsError;
    }
    
    toast.success('הסקר עודכן בהצלחה');
    
    // קבלת הסקר המעודכן עם כל הנתונים הקשורים
    const { data: updatedAuditData, error: fetchError } = await supabase
      .from('audits')
      .select(`
        *,
        contacts(*),
        statusLog:status_logs(*)
      `)
      .eq('id', auditId)
      .single();
    
    if (fetchError) throw fetchError;
    
    return {
      ...updatedAuditData,
      receivedDate: new Date(updatedAuditData.receivedDate),
      plannedMeetingDate: updatedAuditData.plannedMeetingDate ? new Date(updatedAuditData.plannedMeetingDate) : null,
      statusLog: updatedAuditData.statusLog.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
        oldDate: log.oldDate ? new Date(log.oldDate) : null,
        newDate: log.newDate ? new Date(log.newDate) : null,
      }))
    };
    
  } catch (error) {
    console.error('Error updating audit:', error);
    toast.error('שגיאה בעדכון הסקר');
    throw error;
  }
};

// מחיקת סקר
export const deleteAuditById = async (auditId: string) => {
  try {
    // מחיקת האנשי קשר (יימחקו אוטומטית בזכות CASCADE constraints)
    
    // מחיקת יומן הסטטוסים (יימחקו אוטומטית בזכות CASCADE constraints)
    
    // מחיקת הסקר עצמו
    const { error } = await supabase.from('audits').delete().eq('id', auditId);
    
    if (error) throw error;
    
    toast.success('הסקר נמחק בהצלחה');
    return true;
  } catch (error) {
    console.error('Error deleting audit:', error);
    toast.error('שגיאה במחיקת הסקר');
    return false;
  }
};

// עדכון סטטוס סקר
export const updateAuditStatusInDb = async (auditId: string, newStatus: string, reason: string, userName: string, oldDate?: Date | null, newDate?: Date | null) => {
  try {
    // קבלת הסטטוס הנוכחי
    const { data: currentAuditData, error: fetchError } = await supabase
      .from('audits')
      .select('currentStatus, plannedMeetingDate')
      .eq('id', auditId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // עדכון הסטטוס בטבלת הסקרים
    const updateData: any = { currentStatus: newStatus };
    
    // עדכון תאריך פגישה אם נדרש
    if (newDate) {
      updateData.plannedMeetingDate = newDate.toISOString();
    }
    
    const { error: updateError } = await supabase
      .from('audits')
      .update(updateData)
      .eq('id', auditId);
    
    if (updateError) throw updateError;
    
    // הוספת רשומה חדשה ליומן סטטוסים
    const statusLogEntry = {
      id: crypto.randomUUID(),
      auditId: auditId,
      timestamp: new Date().toISOString(),
      oldStatus: currentAuditData.currentStatus,
      newStatus: newStatus,
      oldDate: currentAuditData.plannedMeetingDate,
      newDate: newDate ? newDate.toISOString() : null,
      reason: reason || `עדכון סטטוס ל-${newStatus}`,
      modifiedBy: userName
    };
    
    const { error: logError } = await supabase
      .from('status_logs')
      .insert(statusLogEntry);
    
    if (logError) throw logError;
    
    toast.success('הסטטוס עודכן בהצלחה');
    return true;
  } catch (error) {
    console.error('Error updating audit status:', error);
    toast.error('שגיאה בעדכון סטטוס הסקר');
    return false;
  }
};

// העברת נתונים מאחסון מקומי ל-Supabase
export const migrateLocalDataToSupabase = async (userEmail: string, userName: string) => {
  try {
    console.log(`[migrateLocalDataToSupabase] Starting migration for user: ${userEmail}`);
    
    // בדיקה אם יש נתונים מקומיים לשמירה
    const userKey = `audits_${userEmail}`;
    const localData = localStorage.getItem(userKey);
    
    if (!localData) {
      console.log(`[migrateLocalDataToSupabase] No local data found for user: ${userEmail}`);
      return false;
    }
    
    // המרת הנתונים המקומיים למבנה הנכון
    const localAudits = JSON.parse(localData);
    
    if (!Array.isArray(localAudits) || localAudits.length === 0) {
      console.log(`[migrateLocalDataToSupabase] No valid audits to migrate for user: ${userEmail}`);
      return false;
    }
    
    console.log(`[migrateLocalDataToSupabase] Found ${localAudits.length} audits to migrate`);
    
    // בדיקה אם כבר יש סקרים עבור המשתמש ב-Supabase
    const { data: existingAudits, error: checkError } = await supabase
      .from('audits')
      .select('id')
      .eq('ownerId', userEmail);
    
    if (checkError) {
      console.error('[migrateLocalDataToSupabase] Error checking existing audits:', checkError);
      return false;
    }
    
    if (existingAudits && existingAudits.length > 0) {
      console.log(`[migrateLocalDataToSupabase] User already has ${existingAudits.length} audits in Supabase, skipping migration`);
      return false;
    }
    
    // העברת כל הסקרים המקומיים ל-Supabase
    let migratedCount = 0;
    
    for (const audit of localAudits) {
      try {
        // יצירת הסקר
        const { error: auditError } = await supabase.from('audits').insert({
          id: audit.id,
          name: audit.name,
          description: audit.description || '',
          clientName: audit.clientName || '',
          receivedDate: audit.receivedDate ? new Date(audit.receivedDate).toISOString() : new Date().toISOString(),
          plannedMeetingDate: audit.plannedMeetingDate ? new Date(audit.plannedMeetingDate).toISOString() : null,
          currentStatus: audit.currentStatus || 'התקבל',
          ownerId: userEmail,
          ownerName: userName
        });
        
        if (auditError) {
          console.error(`[migrateLocalDataToSupabase] Error migrating audit ${audit.id}:`, auditError);
          continue;
        }
        
        // העברת יומן הסטטוסים
        if (audit.statusLog && Array.isArray(audit.statusLog)) {
          const statusLogs = audit.statusLog.map((log: any) => ({
            id: log.id || crypto.randomUUID(),
            auditId: audit.id,
            timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
            oldStatus: log.oldStatus,
            newStatus: log.newStatus,
            oldDate: log.oldDate ? new Date(log.oldDate).toISOString() : null,
            newDate: log.newDate ? new Date(log.newDate).toISOString() : null,
            reason: log.reason || 'עדכון סטטוס',
            modifiedBy: log.modifiedBy || userName
          }));
          
          const { error: logsError } = await supabase.from('status_logs').insert(statusLogs);
          
          if (logsError) {
            console.error(`[migrateLocalDataToSupabase] Error migrating status logs for audit ${audit.id}:`, logsError);
          }
        }
        
        // העברת אנשי הקשר
        if (audit.contacts && Array.isArray(audit.contacts)) {
          const contacts = audit.contacts.map((contact: any) => ({
            id: contact.id || crypto.randomUUID(),
            auditId: audit.id,
            fullName: contact.fullName,
            role: contact.role || '',
            email: contact.email || '',
            phone: contact.phone || '',
            gender: contact.gender || 'other'
          }));
          
          const { error: contactsError } = await supabase.from('contacts').insert(contacts);
          
          if (contactsError) {
            console.error(`[migrateLocalDataToSupabase] Error migrating contacts for audit ${audit.id}:`, contactsError);
          }
        }
        
        migratedCount++;
        
      } catch (auditError) {
        console.error(`[migrateLocalDataToSupabase] Error processing audit ${audit.id}:`, auditError);
      }
    }
    
    console.log(`[migrateLocalDataToSupabase] Successfully migrated ${migratedCount} of ${localAudits.length} audits`);
    
    if (migratedCount > 0) {
      toast.success(`הנתונים הועברו בהצלחה ל-Supabase (${migratedCount} סקרים)`);
      return true;
    } else {
      return false;
    }
    
  } catch (error) {
    console.error('[migrateLocalDataToSupabase] Migration error:', error);
    toast.error('שגיאה בהעברת נתונים ל-Supabase');
    return false;
  }
};
