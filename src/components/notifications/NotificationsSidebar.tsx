
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, AlertCircle, Bell, Trash2 } from "lucide-react";
import { NotificationControls } from "./NotificationControls";
import { Notification } from "@/hooks/useNotifications";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick: (auditId: string, notificationId: string) => void;
  onDeleteNotification: (notificationId: string) => void;
  onClearAll: () => void;
}

export const NotificationsSidebar = ({
  isOpen,
  onClose,
  notifications,
  onNotificationClick,
  onDeleteNotification,
  onClearAll
}: NotificationsSidebarProps) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'stalled':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'status_change':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      return "לפני פחות משעה";
    } else if (hours < 24) {
      return `לפני ${hours} שעות`;
    } else {
      const days = Math.floor(hours / 24);
      return `לפני ${days} ימים`;
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    onDeleteNotification(notificationId);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">התראות</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Controls */}
        <NotificationControls
          onClearAll={onClearAll}
          onDeleteNotification={onDeleteNotification}
          notificationCount={notifications.length}
        />

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              אין התראות חדשות
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer relative group ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div 
                    className="flex items-start gap-3"
                    onClick={() => onNotificationClick(notification.auditId, notification.id)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <Badge variant="secondary" className="h-2 w-2 rounded-full p-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                    onClick={(e) => handleDeleteClick(e, notification.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
