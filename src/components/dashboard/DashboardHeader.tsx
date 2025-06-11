
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, Archive, Home } from 'lucide-react';
import { getCurrentUser, logoutUser } from '@/utils/supabaseAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationsSidebar } from '@/components/notifications/NotificationsSidebar';
import { getStoredAudits } from '@/utils/auditStorage';

interface DashboardHeaderProps {
  onNavigateToArchive: () => void;
  onNavigateToAdmin?: () => void;
  onNotificationClick: (auditId: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onNavigateToArchive,
  onNavigateToAdmin,
  onNotificationClick
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

  const handleNotificationSelect = (auditId: string) => {
    onNotificationClick(auditId);
    setShowNotifications(false);
  };

  // Get audits for notifications
  const audits = currentUser ? getStoredAudits(null) : [];

  return (
    <>
      <header className="bg-white shadow-sm border-b" dir="rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Right side - Home button and greeting */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                עמוד הבית
              </Button>
              
              {currentUser && (
                <div className="text-right">
                  <h1 className="text-lg font-semibold text-gray-900">
                    שלום, {currentUser.name}
                  </h1>
                  <p className="text-sm text-gray-600">{currentUser.role}</p>
                </div>
              )}
            </div>

            {/* Left side - Action buttons */}
            <div className="flex items-center space-x-4 space-x-reverse">
              
              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(true)}
                className="relative"
              >
                <Bell className="h-4 w-4" />
              </Button>

              {/* Archive button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToArchive}
              >
                <Archive className="h-4 w-4" />
                ארכיון
              </Button>

              {/* Admin button (only for admins) */}
              {onNavigateToAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToAdmin}
                >
                  <Settings className="h-4 w-4" />
                  ניהול
                </Button>
              )}

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Sidebar */}
      <NotificationsSidebar
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        audits={audits}
        onNotificationSelect={handleNotificationSelect}
        currentUser={currentUser}
      />
    </>
  );
};

export default DashboardHeader;
