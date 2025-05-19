
import { useState, useEffect } from 'react';
import { Audit, User, StatusType } from '@/types/types';
import { getStoredAudits, sampleAudits, saveAuditsToStorage } from '@/utils/auditStorage';
import { createAudit, editAudit, deleteAudit, updateAuditStatus } from '@/utils/auditOperations';
import { sendNotificationEmail } from '@/utils/notificationUtils';

export const useAuditManager = (initialAudits: Audit[], user: User | null) => {
  // Initialize audits from localStorage based on user
  const [audits, setAudits] = useState<Audit[]>(() => {
    if (!user?.email) return initialAudits;
    
    const storedAudits = getStoredAudits(user.email);
    
    // For first time users, seed with sample data
    if (storedAudits.length === 0 && user.role === "בודק") {
      // Update the sample audits to have the current user as owner
      const userSampleAudits = sampleAudits.map(audit => ({
        ...audit,
        ownerId: user.email
      }));
      
      // Save these to localStorage
      saveAuditsToStorage(user.email, userSampleAudits);
      return userSampleAudits;
    }
    
    return storedAudits;
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
