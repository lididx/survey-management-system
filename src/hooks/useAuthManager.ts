
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';
import { useSupabaseClient, useUser as useSupabaseUser } from '@supabase/auth-helpers-react';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const supabaseUser = useSupabaseUser();

  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    console.log("[useAuthManager] Checking for logged in user");
    
    // אם יש משתמש Supabase מחובר
    if (supabaseUser) {
      console.log(`[useAuthManager] Supabase user logged in: ${supabaseUser.email}`);
      
      // הגדרת המשתמש לפי נתוני הפרופיל של Supabase
      const userMetadata = supabaseUser.user_metadata;
      
      setUser({
        email: supabaseUser.email || "",
        role: userMetadata?.role || "בודק",
        name: userMetadata?.name || supabaseUser.email?.split('@')[0] || "משתמש"
      });
      
      return;
    }
    
    // גיבוי - בדיקה אם יש משתמש באחסון מקומי (רק עבור סביבת פיתוח)
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
      
      console.log(`[useAuthManager] LocalStorage user logged in: ${parsedUser.email}, role: ${parsedUser.role}`);
      setUser(parsedUser);
    } catch (error) {
      console.error("[useAuthManager] Error parsing user data:", error);
      toast.error("שגיאה בטעינת נתוני משתמש");
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate, supabaseUser]);

  const handleLogout = async () => {
    if (user?.email) {
      console.log(`[useAuthManager] Logging out user: ${user.email}`);
      
      // התנתקות מ-Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("[useAuthManager] Error during logout:", error);
        toast.error("שגיאה בהתנתקות");
      } else {
        // ניקוי נתוני משתמש מקומיים (במידה והיו)
        localStorage.removeItem("user");
        toast.success("התנתקת בהצלחה");
        navigate("/");
      }
    } else {
      console.log("[useAuthManager] Logout called with no active user");
      localStorage.removeItem("user");
      navigate("/");
    }
  };

  return { user, handleLogout };
};
