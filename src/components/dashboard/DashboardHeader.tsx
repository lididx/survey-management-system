
import { Button } from "@/components/ui/button";
import { Archive, Users, LogOut, BarChart3 } from "lucide-react";
import { useAuthManager } from "@/hooks/useAuthManager";

interface DashboardHeaderProps {
  onNavigateToArchive?: () => void;
  onNavigateToAdmin?: () => void;
}

const DashboardHeader = ({ onNavigateToArchive, onNavigateToAdmin }: DashboardHeaderProps) => {
  const { user, handleLogout } = useAuthManager();

  console.log("[DashboardHeader] Current user:", user);

  const handleLogoutClick = async () => {
    console.log("[DashboardHeader] Logging out user");
    try {
      await handleLogout();
    } catch (error) {
      console.error("[DashboardHeader] Logout error:", error);
    }
  };

  const handleArchiveClick = () => {
    console.log("[DashboardHeader] Navigate to archive clicked");
    if (onNavigateToArchive) {
      onNavigateToArchive();
    }
  };

  const handleAdminClick = () => {
    console.log("[DashboardHeader] Navigate to admin clicked");
    if (onNavigateToAdmin) {
      onNavigateToAdmin();
    }
  };

  if (!user) {
    console.log("[DashboardHeader] No user found");
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">מערכת ניהול סקרים</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-gray-600">
              שלום, {user.name} ({user.role})
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchiveClick}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              ארכיון
            </Button>
            
            {onNavigateToAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAdminClick}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                ניהול משתמשים
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogoutClick}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              התנתק
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
