
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Archive, Settings, LogOut } from "lucide-react";
import { NotificationsSidebar } from "@/components/notifications/NotificationsSidebar";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/supabaseAuth";
import { getStoredAudits } from "@/utils/auditStorage";
import { useNotifications } from "@/hooks/useNotifications";

interface DashboardHeaderProps {
  onNavigateToArchive: () => void;
  onNavigateToAdmin?: () => void;
  onNotificationClick: (auditId: string) => void;
}

const DashboardHeader = ({ 
  onNavigateToArchive, 
  onNavigateToAdmin,
  onNotificationClick 
}: DashboardHeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { handleLogout } = useAuthManager();
  const currentUser = getCurrentUser();
  
  // Get all audits for notifications (managers see all, auditors see their own)
  const allAudits = currentUser?.role === "מנהלת" 
    ? getStoredAudits(null) 
    : getStoredAudits(currentUser?.email || "");
    
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    deleteNotification, 
    clearAllNotifications 
  } = useNotifications(allAudits);

  const handleNotificationClick = (auditId: string, notificationId: string) => {
    markAsRead(notificationId);
    onNotificationClick(auditId);
    setShowNotifications(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                מערכת ניהול סקרי אבטחת מידע
              </h1>
              {currentUser && (
                <span className="text-sm text-gray-600">
                  שלום {currentUser.name} ({currentUser.role})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Archive */}
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToArchive}
                className="flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                ארכיון
              </Button>

              {/* Admin (only for admins) */}
              {onNavigateToAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToAdmin}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  ניהול
                </Button>
              )}

              {/* Logout */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onDeleteNotification={deleteNotification}
        onClearAll={clearAllNotifications}
      />
    </>
  );
};

export default DashboardHeader;
