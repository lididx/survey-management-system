
import { useState, useEffect } from 'react';
import { Audit, User, StatusType } from '@/types/types';
import { 
  getStoredAudits, 
  sampleAudits, 
  saveAuditsToStorage, 
  isUserInitialized, 
  markUserAsInitialized 
} from '@/utils/auditStorage';
import { createAudit, editAudit, deleteAudit, updateAuditStatus } from '@/utils/auditOperations';
import { sendNotificationEmail } from '@/utils/notificationUtils';
import { toast } from 'sonner';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  // Initialize audits from localStorage
  const [audits, setAudits] = useState<Audit[]>(() => {
    if (!user) {
      console.log("[useAuditManager] No user provided, using initial audits");
      return initialAudits;
    }
    
    console.log(`[useAuditManager] Initializing audits for user: ${user.email}, role: ${user.role}`);
    
    try {
      let userAudits: Audit[] = [];
      
      // For managers, we need to load all audits from global storage
      if (user.role === "מנהלת") {
        console.log("[useAuditManager] Loading all audits for manager from global storage");
        const allAudits = getStoredAudits(null); // Pass null to get all audits
        console.log(`[useAuditManager] Loaded ${allAudits.length} audits from global storage for manager`);
        return allAudits;
      }
      
      if (!user.email) {
        console.log("[useAuditManager] No user email, using initial audits");
        return initialAudits;
      }
      
      // For regular users, load their specific audits
      console.log(`[useAuditManager] Loading user-specific audits for: ${user.email}`);
      userAudits = getStoredAudits(user.email);
      console.log(`[useAuditManager] Loaded ${userAudits.length} user-specific audits`);
      
      // If there are no user-specific audits, check global storage for this user's audits
      if (userAudits.length === 0) {
        console.log(`[useAuditManager] No user-specific audits found, checking global storage`);
        const globalAudits = getStoredAudits(null);
        const globalUserAudits = globalAudits.filter(audit => audit.ownerId === user.email);
        console.log(`[useAuditManager] Found ${globalUserAudits.length} audits for user in global storage`);
        
        // If audits exist in global storage but not in user-specific storage, save them to user-specific
        if (globalUserAudits.length > 0) {
          console.log(`[useAuditManager] Synchronizing global audits to user-specific storage`);
          saveAuditsToStorage(user.email, globalUserAudits);
          userAudits = globalUserAudits;
        }
      }
      
      // Only seed with sample data if:
      // 1. User is an auditor ("בודק")
      // 2. There are no stored audits for this user anywhere
      // 3. User has not been initialized before
      if (userAudits.length === 0 && user.role === "בודק" && !isUserInitialized(user.email)) {
        console.log("[useAuditManager] Initializing new user with sample data");
        
        // Update the sample audits to have the current user as owner
        const userSampleAudits = sampleAudits.map(audit => ({
          ...audit,
          ownerId: user.email,
          ownerName: user.name // Add owner name to sample audits
        }));
        
        // Mark user as initialized to prevent reloading sample data on next login
        markUserAsInitialized(user.email);
        
        // Save user-specific audits
        console.log(`[useAuditManager] Saving ${userSampleAudits.length} sample audits for user ${user.email}`);
        saveAuditsToStorage(user.email, userSampleAudits);
        
        // CRITICAL: Also save to global storage properly
        console.log("[useAuditManager] Updating global storage with sample audits");
        const globalAudits = getStoredAudits(null);
        const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
        const updatedGlobalAudits = [...otherUserAudits, ...userSampleAudits];
        console.log(`[useAuditManager] Saving ${updatedGlobalAudits.length} audits to global storage (initialization)`);
        saveAuditsToStorage(null, updatedGlobalAudits);
        
        return userSampleAudits;
      }
      
      return userAudits;
    } catch (error) {
      console.error("[useAuditManager] Error initializing audits:", error);
      toast.error("שגיאה בטעינת נתונים");
      return initialAudits;
    }
  });
  
  // Re-sync when user changes
  useEffect(() => {
    if (!user) return;
    
    console.log(`[useAuditManager] User changed, resyncing data for: ${user.email}`);
    
    try {
      // For managers, we always load from global storage
      if (user.role === "מנהלת") {
        const allAudits = getStoredAudits(null);
        console.log(`[useAuditManager] Resynced ${allAudits.length} audits from global storage for manager`);
        setAudits(allAudits);
        return;
      }
      
      if (!user.email) return;
      
      // For regular users, load their specific audits
      const userAudits = getStoredAudits(user.email);
      
      // If no user-specific audits, try global storage
      if (userAudits.length === 0) {
        const globalAudits = getStoredAudits(null);
        const globalUserAudits = globalAudits.filter(audit => audit.ownerId === user.email);
        
        // If found in global storage, sync to user-specific storage
        if (globalUserAudits.length > 0) {
          saveAuditsToStorage(user.email, globalUserAudits);
          console.log(`[useAuditManager] Resynced ${globalUserAudits.length} audits from global to user-specific storage`);
          setAudits(globalUserAudits);
          return;
        }
      }
      
      console.log(`[useAuditManager] Resynced ${userAudits.length} user-specific audits`);
      setAudits(userAudits);
    } catch (error) {
      console.error("[useAuditManager] Error resyncing audits:", error);
    }
  }, [user]);
  
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [newlyCreatedAudit, setNewlyCreatedAudit] = useState<Audit | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  
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
    const updatedAudits = deleteAudit(id, audits, user, canDelete);
    setAudits(updatedAudits);
  };
  
  const handleStatusChange = (audit: Audit, newStatus: StatusType) => {
    const canEdit = (auditOwnerId: string) => {
      if (!user) return false;
      
      // Managers can edit any record
      if (user.role === "מנהלת") return true;
      
      // Regular users can only edit their own records
      return user.role === "בודק" && auditOwnerId === user.email;
    };
    
    const updatedAudits = updateAuditStatus(audit.id, newStatus, audits, user, canEdit);
    setAudits(updatedAudits);
  };

  const handleAuditSubmit = (auditData: Partial<Audit>, canEdit: (auditOwnerId: string) => boolean) => {
    if (formMode === "create" && user) {
      const { newAudits, newAudit } = createAudit(auditData, audits, user);
      console.log(`[useAuditManager] Created new audit: ${newAudit.id}, updating state with ${newAudits.length} audits`);
      setAudits(newAudits);
      return newAudit;
    } else if (formMode === "edit" && currentAudit) {
      const { updatedAudits, updatedAudit } = editAudit(auditData, currentAudit, audits, user, canEdit);
      setAudits(updatedAudits);
      return updatedAudit;
    }
    return null;
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
    handleStatusChange,
    handleAuditSubmit,
    sendNotificationEmail
  };
};
