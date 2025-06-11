
import { useState, useEffect } from 'react';
import { Audit } from '@/types/types';

export interface Notification {
  id: string;
  type: 'stalled' | 'status_change' | 'new_audit';
  title: string;
  message: string;
  auditId: string;
  auditName: string;
  timestamp: Date;
  read: boolean;
}

export const useNotifications = (audits: Audit[]) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Generate notifications based on audits
    const newNotifications: Notification[] = [];
    
    audits.forEach(audit => {
      // Check for stalled audits (same status for more than 7 days)
      if (audit.statusLog.length > 0) {
        const latestStatus = audit.statusLog[0];
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(latestStatus.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceUpdate > 7 && audit.currentStatus !== "הסתיים") {
          newNotifications.push({
            id: `stalled-${audit.id}`,
            type: 'stalled',
            title: 'סקר תקוע',
            message: `הסקר "${audit.name}" לא עודכן כבר ${daysSinceUpdate} ימים`,
            auditId: audit.id,
            auditName: audit.name,
            timestamp: new Date(),
            read: false
          });
        }
      }
      
      // Check for recent status changes (last 3 days)
      if (audit.statusLog.length > 1) {
        const recentChanges = audit.statusLog.filter(log => {
          const daysSince = Math.floor(
            (new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSince <= 3;
        });
        
        recentChanges.forEach(change => {
          if (change.newStatus) {
            newNotifications.push({
              id: `status-${audit.id}-${change.id}`,
              type: 'status_change',
              title: 'עדכון סטטוס',
              message: `הסקר "${audit.name}" עודכן לסטטוס "${change.newStatus}"`,
              auditId: audit.id,
              auditName: audit.name,
              timestamp: new Date(change.timestamp),
              read: false
            });
          }
        });
      }
    });
    
    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(newNotifications);
  }, [audits]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearAllNotifications
  };
};
