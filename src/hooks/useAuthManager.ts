
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.email || !parsedUser.role) {
        throw new Error("נתוני משתמש חסרים");
      }
      
      setUser(parsedUser);
    } catch (error) {
      toast.error("שגיאה בטעינת נתוני משתמש");
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("התנתקת בהצלחה");
    navigate("/");
  };

  return { user, handleLogout };
};
