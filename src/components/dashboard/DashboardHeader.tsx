
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User } from "@/types/types";
import { Archive, Home, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
  isArchive?: boolean;
}

export const DashboardHeader = ({ user, onLogout, isArchive = false }: DashboardHeaderProps) => {
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("[DashboardHeader] Logout button clicked");
    onLogout();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">מערכת ניהול סקרי אבטחת מידע</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-4">
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${!isArchive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Home className="h-4 w-4" />
                דף הבית
              </Link>
              <Link 
                to="/archive" 
                className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium ${isArchive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Archive className="h-4 w-4" />
                ארכיון
              </Link>
              
              {/* Admin link for admin users only */}
              {user.isAdmin && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  <Shield className="h-4 w-4" />
                  ניהול מערכת
                </Link>
              )}
            </nav>
            
            <Separator orientation="vertical" className="h-8" />
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.role}{user.isAdmin ? ' (מנהל מערכת)' : ''}</span>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout} 
                className="text-gray-600 flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
