
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';
import { getCurrentUser, logoutUser } from '@/utils/localAuth';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // בדיקה אם המשתמש מחובר
      console.log("[useAuthManager] Checking for logged in user");
      
      // בדיקת משתמש מקומי
      const localUser = getCurrentUser();
      
      if (localUser) {
        console.log(`[useAuthManager] Local user logged in: ${localUser.email}`);
        setUser(localUser);
        return;
      }
      
      console.log("[useAuthManager] No user data found, navigating to login");
      navigate("/");
    } catch (error) {
      console.error("[useAuthManager] Error while checking authentication:", error);
      toast.error("שגיאה באימות המשתמש");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      if (user?.email) {
        console.log(`[useAuthManager] Logging out user: ${user.email}`);
        
        // התנתקות מהמערכת
        logoutUser();
        setUser(null);
        toast.success("התנתקת בהצלחה");
        navigate("/");
      } else {
        console.log("[useAuthManager] Logout called with no active user");
        navigate("/");
      }
    } catch (error) {
      console.error("[useAuthManager] Error during logout:", error);
      toast.error("שגיאה בתהליך ההתנתקות");
      navigate("/");
    }
  };

  return { user, handleLogout };
};
