
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Archive, Shield } from "lucide-react";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/supabaseAuth";
import { Badge } from "@/components/ui/badge";
import NotificationsSidebar from "@/components/notifications/NotificationsSidebar";

interface DashboardHeaderProps {
  onNavigateToArchive: () => void;
  onNavigateToAdmin?: () => void;
  onNotificationClick?: (auditId: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onNavigateToArchive,
  onNavigateToAdmin,
  onNotificationClick
}) => {
  const { handleLogout } = useAuthManager();
  const user = getCurrentUser();

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">שלום,</span>
                <Badge variant="outline">{user.name}</Badge>
                <Badge variant={user.isAdmin ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notifications Sidebar */}
            <NotificationsSidebar onNotificationClick={onNotificationClick} />
            
            <Button
              variant="outline"
              onClick={onNavigateToArchive}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              ארכיון
            </Button>
            
            {user?.isAdmin && onNavigateToAdmin && (
              <Button
                variant="outline"
                onClick={onNavigateToAdmin}
                className="flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                ניהול מערכת
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
