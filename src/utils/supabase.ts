
import { supabase } from '@/integrations/supabase/client';
import { Audit, User, StatusType, ContactGender } from '@/types/types';
import { toast } from 'sonner';

console.log("[Supabase] Using live Supabase connection with auth");

// Check if Supabase is properly configured - always return true now
export const isSupabaseConfigured = () => {
  return true;
};

// Helper function to transform database audit to app audit format
const transformDbAuditToAppAudit = (dbAudit: any): Audit => {
  return {
    id: dbAudit.id,
    name: dbAudit.name,
    description: dbAudit.description || '',
    clientName: dbAudit.client_name || '',
    contacts: [], // Will be loaded separately
    receivedDate: new Date(dbAudit.received_date),
    plannedMeetingDate: dbAudit.planned_meeting_date ? new Date(dbAudit.planned_meeting_date) : null,
    scheduledDate: dbAudit.scheduled_date ? new Date(dbAudit.scheduled_date) : null,
    currentStatus: dbAudit.current_status,
    statusLog: [], // Will be loaded separately
    ownerId: dbAudit.owner_id, // Keep for backward compatibility
    ownerName: dbAudit.owner_name,
    isArchived: dbAudit.is_archived || false
  };
};

// Get all audits with contacts and status log - RLS will handle filtering
export const getAudits = async (currentUser: User): Promise<Audit[]> => {
  console.log(`[getAudits] Getting audits - RLS will filter based on user permissions`);
  
  try {
    // Get audits - RLS will automatically filter based on user role and ownership
    const { data: auditsData, error: auditsError } = await supabase
      .from('audits')
      .select('*')
      .eq('is_archived', false)
      .order('received_date', { ascending: false });

    if (auditsError) {
      console.error("[getAudits] Error fetching audits:", auditsError);
      toast.error("שגיאה בטעינת נתוני הסקרים");
      throw auditsError;
    }

    if (!auditsData || auditsData.length === 0) {
      console.log("[getAudits] No audits found (filtered by RLS)");
      return [];
    }

    // Transform audits and load related data
    const audits: Audit[] = [];
    
    for (const dbAudit of auditsData) {
      const audit = transformDbAuditToAppAudit(dbAudit);
      
      // Load contacts - RLS will handle filtering
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('audit_id', audit.id);

      if (contactsData) {
        audit.contacts = contactsData.map(contact => ({
          id: contact.id,
          fullName: contact.full_name,
          role: contact.role || '',
          email: contact.email || '',
          phone: contact.phone || '',
          gender: (contact.gender as ContactGender) || 'other'
        }));
      }

      // Load status log - RLS will handle filtering
      const { data: statusLogData } = await supabase
        .from('status_log')
        .select('*')
        .eq('audit_id', audit.id)
        .order('timestamp', { ascending: false });

      if (statusLogData) {
        audit.statusLog = statusLogData.map(log => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          oldStatus: (log.old_status as StatusType) || null,
          newStatus: log.new_status as StatusType,
          oldDate: log.old_date ? new Date(log.old_date) : null,
          newDate: log.new_date ? new Date(log.new_date) : null,
          reason: log.reason || '',
          modifiedBy: log.modified_by
        }));
      }

      audits.push(audit);
    }
    
    console.log(`[getAudits] Retrieved ${audits.length} audits from Supabase (filtered by RLS)`);
    return audits;
  } catch (error) {
    console.error("[getAudits] Error:", error);
    toast.error("שגיאה בטעינת נתוני הסקרים");
    return [];
  }
};

// Create a new audit
export const createNewAudit = async (auditData: Partial<Audit>, currentUser: User): Promise<Audit> => {
  console.log("[createNewAudit] Creating new audit for user:", currentUser.email);

  try {
    const newAuditId = crypto.randomUUID();
    
    // Insert audit with proper user_id for RLS
    const { data: auditResult, error: auditError } = await supabase
      .from('audits')
      .insert({
        id: newAuditId,
        name: auditData.name!,
        description: auditData.description || '',
        client_name: auditData.clientName || '',
        received_date: new Date().toISOString(),
        planned_meeting_date: auditData.plannedMeetingDate?.toISOString() || null,
        scheduled_date: auditData.scheduledDate?.toISOString() || null,
        current_status: 'התקבל',
        owner_id: currentUser.email, // Keep for backward compatibility
        owner_name: currentUser.name,
        user_id: currentUser.id, // Critical for RLS
        is_archived: false
      })
      .select()
      .single();

    if (auditError) {
      console.error("[createNewAudit] Error creating audit:", auditError);
      toast.error("שגיאה ביצירת סקר חדש");
      throw auditError;
    }

    // Insert initial status log
    const { error: statusLogError } = await supabase
      .from('status_log')
      .insert({
        audit_id: newAuditId,
        timestamp: new Date().toISOString(),
        old_status: null,
        new_status: 'התקבל',
        reason: 'יצירת סקר',
        modified_by: currentUser.name
      });

    if (statusLogError) {
      console.error("[createNewAudit] Error creating status log:", statusLogError);
    }

    // Insert contacts if provided
    if (auditData.contacts && auditData.contacts.length > 0) {
      const contactsToInsert = auditData.contacts.map(contact => ({
        audit_id: newAuditId,
        full_name: contact.fullName,
        role: contact.role || '',
        email: contact.email || '',
        phone: contact.phone || '',
        gender: contact.gender || 'other'
      }));

      const { error: contactsError } = await supabase
        .from('contacts')
        .insert(contactsToInsert);

      if (contactsError) {
        console.error("[createNewAudit] Error creating contacts:", contactsError);
      }
    }

    console.log("[createNewAudit] Audit created successfully with ID:", newAuditId);
    
    // Return the created audit in the expected format
    const newAudit = transformDbAuditToAppAudit(auditResult);
    newAudit.contacts = auditData.contacts || [];
    newAudit.statusLog = [{
      id: crypto.randomUUID(),
      timestamp: new Date(),
      oldStatus: null,
      newStatus: 'התקבל',
      oldDate: null,
      newDate: null,
      reason: 'יצירת סקר',
      modifiedBy: currentUser.name
    }];
    
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
  
  try {
    // Update audit - RLS will ensure only authorized users can update
    const updateData: any = {};
    if (auditData.name !== undefined) updateData.name = auditData.name;
    if (auditData.description !== undefined) updateData.description = auditData.description;
    if (auditData.clientName !== undefined) updateData.client_name = auditData.clientName;
    if (auditData.plannedMeetingDate !== undefined) {
      updateData.planned_meeting_date = auditData.plannedMeetingDate?.toISOString() || null;
    }
    if (auditData.scheduledDate !== undefined) {
      updateData.scheduled_date = auditData.scheduledDate?.toISOString() || null;
    }
    updateData.updated_at = new Date().toISOString();

    const { data: updatedAudit, error: updateError } = await supabase
      .from('audits')
      .update(updateData)
      .eq('id', auditId)
      .select()
      .single();

    if (updateError) {
      console.error("[updateExistingAudit] Error:", updateError);
      toast.error("שגיאה בעדכון הסקר");
      throw updateError;
    }

    // Update contacts if provided - RLS will handle authorization
    if (auditData.contacts) {
      // Delete existing contacts
      await supabase
        .from('contacts')
        .delete()
        .eq('audit_id', auditId);

      // Insert new contacts
      if (auditData.contacts.length > 0) {
        const contactsToInsert = auditData.contacts.map(contact => ({
          audit_id: auditId,
          full_name: contact.fullName,
          role: contact.role || '',
          email: contact.email || '',
          phone: contact.phone || '',
          gender: contact.gender || 'other'
        }));

        await supabase
          .from('contacts')
          .insert(contactsToInsert);
      }
    }

    console.log(`[updateExistingAudit] Audit updated successfully: ${auditId}`);
    
    // Return updated audit
    const result = transformDbAuditToAppAudit(updatedAudit);
    if (auditData.contacts) {
      result.contacts = auditData.contacts;
    }
    
    return result;
  } catch (error) {
    console.error("[updateExistingAudit] Error:", error);
    toast.error("שגיאה בעדכון הסקר");
    throw error;
  }
};

// Delete an audit - RLS will handle authorization
export const deleteAuditById = async (auditId: string): Promise<boolean> => {
  console.log(`[deleteAuditById] Deleting audit: ${auditId}`);
  
  try {
    const { error } = await supabase
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

// Update audit status - RLS will handle authorization
export const updateAuditStatusInDb = async (
  auditId: string,
  newStatus: StatusType,
  reason: string,
  modifiedBy: string
): Promise<boolean> => {
  console.log(`[updateAuditStatusInDb] Updating status for audit ${auditId} to ${newStatus}`);
  
  try {
    // Get current status - RLS will ensure user can only see authorized audits
    const { data: currentAudit, error: fetchError } = await supabase
      .from('audits')
      .select('current_status')
      .eq('id', auditId)
      .single();
    
    if (fetchError) {
      console.error("[updateAuditStatusInDb] Fetch error:", fetchError);
      return false;
    }

    // Update audit status - RLS will handle authorization
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        current_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);
    
    if (updateError) {
      console.error("[updateAuditStatusInDb] Update error:", updateError);
      return false;
    }

    // Insert status log entry - RLS will handle authorization
    const { error: statusLogError } = await supabase
      .from('status_log')
      .insert({
        audit_id: auditId,
        timestamp: new Date().toISOString(),
        old_status: currentAudit.current_status,
        new_status: newStatus,
        reason: reason,
        modified_by: modifiedBy
      });
    
    if (statusLogError) {
      console.error("[updateAuditStatusInDb] Status log error:", statusLogError);
    }
    
    console.log(`[updateAuditStatusInDb] Status updated successfully for audit: ${auditId}`);
    return true;
  } catch (error) {
    console.error("[updateAuditStatusInDb] Error:", error);
    return false;
  }
};

// Archive/unarchive audit - RLS will handle authorization
export const updateAuditArchiveStatus = async (auditId: string, isArchived: boolean): Promise<boolean> => {
  console.log(`[updateAuditArchiveStatus] ${isArchived ? 'Archiving' : 'Unarchiving'} audit: ${auditId}`);
  
  try {
    const { error } = await supabase
      .from('audits')
      .update({
        is_archived: isArchived,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId);
    
    if (error) {
      console.error("[updateAuditArchiveStatus] Error:", error);
      return false;
    }
    
    console.log(`[updateAuditArchiveStatus] Audit ${isArchived ? 'archived' : 'unarchived'} successfully: ${auditId}`);
    return true;
  } catch (error) {
    console.error("[updateAuditArchiveStatus] Error:", error);
    return false;
  }
};

// Get archived audits - RLS will handle filtering
export const getArchivedAudits = async (currentUser: User): Promise<Audit[]> => {
  console.log(`[getArchivedAudits] Getting archived audits - RLS will filter based on user permissions`);
  
  try {
    // Get archived audits - RLS will automatically filter
    const { data: auditsData, error: auditsError } = await supabase
      .from('audits')
      .select('*')
      .eq('is_archived', true)
      .order('received_date', { ascending: false });

    if (auditsError) {
      console.error("[getArchivedAudits] Error:", auditsError);
      return [];
    }

    if (!auditsData || auditsData.length === 0) {
      return [];
    }

    // Transform audits and load related data
    const audits: Audit[] = [];
    
    for (const dbAudit of auditsData) {
      const audit = transformDbAuditToAppAudit(dbAudit);
      
      // Load contacts - RLS will handle filtering
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('*')
        .eq('audit_id', audit.id);

      if (contactsData) {
        audit.contacts = contactsData.map(contact => ({
          id: contact.id,
          fullName: contact.full_name,
          role: contact.role || '',
          email: contact.email || '',
          phone: contact.phone || '',
          gender: (contact.gender as ContactGender) || 'other'
        }));
      }

      // Load status log - RLS will handle filtering
      const { data: statusLogData } = await supabase
        .from('status_log')
        .select('*')
        .eq('audit_id', audit.id)
        .order('timestamp', { ascending: false });

      if (statusLogData) {
        audit.statusLog = statusLogData.map(log => ({
          id: log.id,
          timestamp: new Date(log.timestamp),
          oldStatus: (log.old_status as StatusType) || null,
          newStatus: log.new_status as StatusType,
          oldDate: log.old_date ? new Date(log.old_date) : null,
          newDate: log.new_date ? new Date(log.new_date) : null,
          reason: log.reason || '',
          modifiedBy: log.modified_by
        }));
      }

      audits.push(audit);
    }
    
    console.log(`[getArchivedAudits] Retrieved ${audits.length} archived audits from Supabase (filtered by RLS)`);
    return audits;
  } catch (error) {
    console.error("[getArchivedAudits] Error:", error);
    return [];
  }
};
