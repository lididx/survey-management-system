
import { useState, useEffect } from 'react';
import { Audit, User } from '@/types/types';
import { getStoredAudits, sampleAudits, saveAuditsToStorage } from '@/utils/auditStorage';
import { createAudit, editAudit, deleteAudit } from '@/utils/auditOperations';
import { sendNotificationEmail } from '@/utils/notificationUtils';

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
    const updatedAudits = deleteAudit(id, audits, user, canDelete);
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
    handleAuditSubmit,
    sendNotificationEmail
  };
};
