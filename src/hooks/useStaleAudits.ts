
import { useState, useEffect } from 'react';
import { getAllAudits } from '@/utils/auditStorage';
import { Audit } from '@/types/types';

const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications';

export const useStaleAudits = () => {
  const [staleAudits, setStaleAudits] = useState<Audit[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed notifications from localStorage
    const dismissed = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    if (dismissed) {
      setDismissedNotifications(new Set(JSON.parse(dismissed)));
    }
  }, []);

  useEffect(() => {
    const checkStaleAudits = () => {
      const audits = getAllAudits();
      const now = new Date();
      const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      const stale = audits.filter(audit => {
        // Skip dismissed notifications
        if (dismissedNotifications.has(audit.id)) {
          return false;
        }

        // Check if audit is in a status that should trigger notifications
        const shouldNotify = ['בביצוע', 'ממתין לאישור', 'בתהליך'].includes(audit.status);
        if (!shouldNotify) return false;

        // Check if it's been too long since last update
        const lastUpdate = audit.lastUpdate ? new Date(audit.lastUpdate) : new Date(audit.auditDate);
        const timeDiff = now.getTime() - lastUpdate.getTime();
        
        return timeDiff > staleThreshold;
      });
      
      setStaleAudits(stale);
    };

    checkStaleAudits();
    // Check every hour
    const interval = setInterval(checkStaleAudits, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [dismissedNotifications]);

  const dismissNotification = (auditId: string) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(auditId);
    setDismissedNotifications(newDismissed);
    
    // Save to localStorage
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...newDismissed]));
    
    // Remove from stale audits
    setStaleAudits(prev => prev.filter(audit => audit.id !== auditId));
  };

  const clearAllNotifications = () => {
    const allAuditIds = staleAudits.map(audit => audit.id);
    const newDismissed = new Set([...dismissedNotifications, ...allAuditIds]);
    setDismissedNotifications(newDismissed);
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...newDismissed]));
    setStaleAudits([]);
  };

  return {
    staleAudits,
    dismissNotification,
    clearAllNotifications,
    hasStaleAudits: staleAudits.length > 0
  };
};
