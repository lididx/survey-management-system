
import { useState, useEffect, useCallback } from 'react';
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

  // שמירת התראות ב-localStorage
  const saveNotificationsToStorage = useCallback((notifs: Notification[]) => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifs));
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }, []);

  // טעינת התראות מ-localStorage
  const loadNotificationsFromStorage = useCallback((): Notification[] => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
    }
    return [];
  }, []);

  useEffect(() => {
    // טעינת התראות קיימות
    const existingNotifications = loadNotificationsFromStorage();
    
    // יצירת התראות חדשות בהתבסס על הסקרים
    const newNotifications: Notification[] = [];
    
    audits.forEach(audit => {
      // בדיקת סקרים תקועים (יותר מ-7 ימים באותו סטטוס)
      if (audit.statusLog.length > 0) {
        const latestStatus = audit.statusLog[0];
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - new Date(latestStatus.timestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceUpdate > 7 && audit.currentStatus !== "הסתיים") {
          const stalledId = `stalled-${audit.id}`;
          const existingStalledNotification = existingNotifications.find(n => n.id === stalledId);
          
          if (!existingStalledNotification) {
            newNotifications.push({
              id: stalledId,
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
      }
      
      // בדיקת שינויי סטטוס אחרונים (3 ימים אחרונים)
      if (audit.statusLog.length > 1) {
        const recentChanges = audit.statusLog.filter(log => {
          const daysSince = Math.floor(
            (new Date().getTime() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSince <= 3;
        });
        
        recentChanges.forEach(change => {
          if (change.newStatus) {
            const statusChangeId = `status-${audit.id}-${change.id}`;
            const existingStatusNotification = existingNotifications.find(n => n.id === statusChangeId);
            
            if (!existingStatusNotification) {
              newNotifications.push({
                id: statusChangeId,
                type: 'status_change',
                title: 'עדכון סטטוס',
                message: `הסקר "${audit.name}" עודכן לסטטוס "${change.newStatus}"`,
                auditId: audit.id,
                auditName: audit.name,
                timestamp: new Date(change.timestamp),
                read: false
              });
            }
          }
        });
      }
    });
    
    // שילוב התראות קיימות עם חדשות
    const allNotifications = [...existingNotifications, ...newNotifications];
    
    // סורט לפי זמן (חדשות ראשון)
    allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(allNotifications);
    
    // שמירה ב-localStorage אם יש התראות חדשות
    if (newNotifications.length > 0) {
      saveNotificationsToStorage(allNotifications);
    }
  }, [audits, loadNotificationsFromStorage, saveNotificationsToStorage]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      saveNotificationsToStorage(updated);
      return updated;
    });
  }, [saveNotificationsToStorage]);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.filter(notification => notification.id !== notificationId);
      saveNotificationsToStorage(updated);
      return updated;
    });
  }, [saveNotificationsToStorage]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    saveNotificationsToStorage([]);
  }, [saveNotificationsToStorage]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    deleteNotification,
    clearAllNotifications
  };
};
