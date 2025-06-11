
import React from "react";
import { Button } from "@/components/ui/button";
import { Archive, LogOut, Home } from "lucide-react";
import { useAuthManager } from "@/hooks/useAuthManager";
import { getCurrentUser } from "@/utils/supabaseAuth";
import { useNavigate, useLocation } from "react-router-dom";

interface DashboardHeaderProps {
  onNavigateToArchive: () => void;
  onNavigateToAdmin?: () => void;
}

const DashboardHeader = ({ 
  onNavigateToArchive, 
  onNavigateToAdmin
}: DashboardHeaderProps) => {
  const { handleLogout } = useAuthManager();
  const currentUser = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigateToHome = () => {
    navigate("/dashboard");
  };

  const isOnHomePage = location.pathname === "/dashboard";

  return (
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
            {/* Home button - show only when not on home page */}
            {!isOnHomePage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToHome}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                עמוד הבית
              </Button>
            )}

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
                <Archive className="h-4 w-4" />
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
  );
};

export default DashboardHeader;
