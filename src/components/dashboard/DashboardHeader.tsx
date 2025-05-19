
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, UserRole } from "@/types/types";

interface DashboardHeaderProps {
  user: User;
  onLogout: () => void;
}

export const DashboardHeader = ({ user, onLogout }: DashboardHeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">מערכת ניהול סקרי אבטחת מידע</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold">{user.name}</span>
            <span className="mx-1">|</span>
            <Badge variant={user.role === "מנהלת" ? "destructive" : "default"}>
              {user.role}
            </Badge>
          </div>
          <Button variant="outline" onClick={onLogout}>התנתק</Button>
        </div>
      </div>
    </header>
  );
};
