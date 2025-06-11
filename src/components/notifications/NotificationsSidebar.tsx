
import React from 'react';
import { X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Audit, User } from '@/types/types';

interface NotificationsSidebarProps {
  open: boolean;
  onClose: () => void;
  audits: Audit[];
  onNotificationSelect: (auditId: string) => void;
  currentUser: User | null;
}

export const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({
  open,
  onClose,
  audits,
  onNotificationSelect,
  currentUser
}) => {
  // פילטר התראות רלוונטיות בלבד
  const getRelevantNotifications = () => {
    if (!currentUser) return [];

    const notifications: Array<{
      id: string;
      type: 'overdue' | 'pending_review' | 'status_change';
      title: string;
      description: string;
      auditId: string;
      priority: 'high' | 'medium' | 'low';
      timestamp: Date;
    }> = [];

    const now = new Date();

    audits.forEach(audit => {
      // התראות לפגישות שעברו
      if (audit.plannedMeetingDate && audit.plannedMeetingDate < now && audit.currentStatus === 'נקבע') {
        notifications.push({
          id: `overdue-${audit.id}`,
          type: 'overdue',
          title: 'פגישה שעברה',
          description: `הפגישה עבור סקר "${audit.name}" הייתה אמורה להתקיים ב-${audit.plannedMeetingDate.toLocaleDateString('he-IL')}`,
          auditId: audit.id,
          priority: 'high',
          timestamp: audit.plannedMeetingDate
        });
      }

      // התראות למנהלת על סקרים בבקרה
      if (currentUser.role === 'מנהלת' && audit.currentStatus === 'בבקרה') {
        notifications.push({
          id: `review-${audit.id}`,
          type: 'pending_review',
          title: 'סקר ממתין לבקרה',
          description: `הסקר "${audit.name}" ממתין לבקרה שלך`,
          auditId: audit.id,
          priority: 'medium',
          timestamp: new Date(audit.statusLog[0]?.timestamp || audit.receivedDate)
        });
      }

      // התראות על שינויי סטטוס חדשים (24 שעות אחרונות)
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentStatusChanges = audit.statusLog.filter(log => 
        log.timestamp > dayAgo && log.modifiedBy !== currentUser.name
      );

      recentStatusChanges.forEach(change => {
        notifications.push({
          id: `status-${audit.id}-${change.id}`,
          type: 'status_change',
          title: 'שינוי סטטוס',
          description: `הסקר "${audit.name}" עבר לסטטוס "${change.newStatus}" על ידי ${change.modifiedBy}`,
          auditId: audit.id,
          priority: 'low',
          timestamp: change.timestamp
        });
      });
    });

    // מיון לפי עדיפות וזמן
    return notifications.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  };

  const notifications = getRelevantNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'pending_review':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'status_change':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">התראות</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-full pb-20">
          <div className="p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>אין התראות חדשות</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onNotificationSelect(notification.auditId)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{notification.title}</h3>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(notification.priority)}`}
                        >
                          {notification.priority === 'high' ? 'גבוה' : 
                           notification.priority === 'medium' ? 'בינוני' : 'נמוך'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                      <p className="text-xs text-gray-400">
                        {notification.timestamp.toLocaleDateString('he-IL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
