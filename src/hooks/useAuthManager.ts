
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';
import { getCurrentUser, logoutUser } from '@/utils/supabaseAuth';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("[useAuthManager] Checking for logged in user");
        
        // Check for current user
        const currentUser = getCurrentUser();
        console.log("[useAuthManager] User check result:", currentUser);
        
        if (currentUser) {
          console.log(`[useAuthManager] User logged in: ${currentUser.email}`);
          setUser(currentUser);
          setIsLoading(false);
          return;
        }
        
        console.log("[useAuthManager] No user data found");
        setUser(null);
        setIsLoading(false);
        
        // Only navigate to login if we're not already on the login page
        if (window.location.pathname !== '/') {
          console.log("[useAuthManager] Navigating to login page");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("[useAuthManager] Error while checking authentication:", error);
        setUser(null);
        setIsLoading(false);
        toast.error("שגיאה באימות המשתמש");
        
        if (window.location.pathname !== '/') {
          navigate("/", { replace: true });
        }
      }
    };

    checkAuthStatus();
    
    // Listen for storage changes to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_user') {
        console.log("[useAuthManager] Storage change detected for current_user");
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      console.log(`[useAuthManager] Logging out user: ${user?.email}`);
      
      // Logout from the system
      logoutUser();
      setUser(null);
      toast.success("התנתקת בהצלחה");
      
      // Navigate to login page
      console.log("[useAuthManager] Navigating to login page after logout");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[useAuthManager] Error during logout:", error);
      toast.error("שגיאה בתהליך ההתנתקות");
      // Force navigation even if there's an error
      navigate("/", { replace: true });
    }
  };

  // Method to manually refresh user data
  const refreshUser = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  };

  return { 
    user, 
    isLoading, 
    handleLogout,
    refreshUser 
  };
};
