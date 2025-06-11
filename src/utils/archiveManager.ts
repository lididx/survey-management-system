
// Archive management utility - separate from audit status
const ARCHIVED_AUDITS_KEY = 'archived_audit_ids';

export const getArchivedAuditIds = (): string[] => {
  try {
    const stored = localStorage.getItem(ARCHIVED_AUDITS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading archived audit IDs:', error);
    return [];
  }
};

export const saveArchivedAuditIds = (ids: string[]): boolean => {
  try {
    localStorage.setItem(ARCHIVED_AUDITS_KEY, JSON.stringify(ids));
    return true;
  } catch (error) {
    console.error('Error saving archived audit IDs:', error);
    return false;
  }
};

export const addToArchive = (auditId: string): boolean => {
  const archivedIds = getArchivedAuditIds();
  if (!archivedIds.includes(auditId)) {
    archivedIds.push(auditId);
    return saveArchivedAuditIds(archivedIds);
  }
  return true;
};

export const removeFromArchive = (auditId: string): boolean => {
  const archivedIds = getArchivedAuditIds();
  const updatedIds = archivedIds.filter(id => id !== auditId);
  return saveArchivedAuditIds(updatedIds);
};

export const isAuditArchived = (auditId: string): boolean => {
  const archivedIds = getArchivedAuditIds();
  return archivedIds.includes(auditId);
};

export const isAuditInArchiveView = (auditId: string, auditStatus: string): boolean => {
  // An audit is in archive view if:
  // 1. It's manually archived, OR
  // 2. Its status is "הסתיים"
  return isAuditArchived(auditId) || auditStatus === "הסתיים";
};
