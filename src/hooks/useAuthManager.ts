
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';
import { clearUserAudits } from '@/utils/auditStorage';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    console.log("[useAuthManager] Checking for logged in user");
    const userData = localStorage.getItem("user");
    if (!userData) {
      console.log("[useAuthManager] No user data found, navigating to login");
      navigate("/");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.email || !parsedUser.role) {
        throw new Error("נתוני משתמש חסרים");
      }
      
      console.log(`[useAuthManager] User logged in: ${parsedUser.email}, role: ${parsedUser.role}`);
      setUser(parsedUser);
    } catch (error) {
      console.error("[useAuthManager] Error parsing user data:", error);
      toast.error("שגיאה בטעינת נתוני משתמש");
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    if (user?.email) {
      console.log(`[useAuthManager] Logging out user: ${user.email}`);
      // We don't clear user data on logout to preserve it between sessions
      // But we do clear the authenticated state
      localStorage.removeItem("user");
      toast.success("התנתקת בהצלחה");
      navigate("/");
    } else {
      console.log("[useAuthManager] Logout called with no active user");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return { user, handleLogout };
};
