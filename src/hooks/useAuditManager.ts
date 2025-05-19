
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
      console.log("No user provided, using initial audits");
      return initialAudits;
    }
    
    console.log(`Initializing audits for user: ${user.email}, role: ${user.role}`);
    
    try {
      // For managers, we need to load all audits
      if (user.role === "מנהלת") {
        console.log("Loading all audits for manager");
        const allAudits = getStoredAudits(null); // Pass null to get all audits
        console.log(`Loaded ${allAudits.length} audits from global storage for manager`);
        return allAudits;
      }
      
      if (!user.email) {
        console.log("No user email, using initial audits");
        return initialAudits;
      }
      
      // For regular users, load their specific audits
      console.log(`Loading audits for user email: ${user.email}`);
      const storedAudits = getStoredAudits(user.email);
      console.log(`Loaded ${storedAudits.length} audits for user ${user.email}`);
      
      // Only seed with sample data if:
      // 1. User is an auditor ("בודק")
      // 2. There are no stored audits for this user
      // 3. User has not been initialized before
      if (storedAudits.length === 0 && user.role === "בודק" && !isUserInitialized(user.email)) {
        console.log("Initializing user with sample data");
        
        // Update the sample audits to have the current user as owner
        const userSampleAudits = sampleAudits.map(audit => ({
          ...audit,
          ownerId: user.email,
          ownerName: user.name // Add owner name to sample audits
        }));
        
        // Mark user as initialized to prevent reloading sample data on next login
        markUserAsInitialized(user.email);
        
        // Save user-specific audits
        console.log(`Saving ${userSampleAudits.length} sample audits for user ${user.email}`);
        saveAuditsToStorage(user.email, userSampleAudits);
        
        // CRITICAL: Also save to global storage properly
        console.log("Updating global storage with sample audits");
        const globalAudits = getStoredAudits(null);
        const otherUserAudits = globalAudits.filter(audit => audit.ownerId !== user.email);
        const updatedGlobalAudits = [...otherUserAudits, ...userSampleAudits];
        console.log(`Saving ${updatedGlobalAudits.length} audits to global storage (initialization)`);
        saveAuditsToStorage(null, updatedGlobalAudits);
        
        return userSampleAudits;
      }
      
      return storedAudits;
    } catch (error) {
      console.error("Error initializing audits:", error);
      toast.error("שגיאה בטעינת נתונים");
      return initialAudits;
    }
  });
  
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
