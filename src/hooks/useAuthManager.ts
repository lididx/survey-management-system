
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logoutUser } from '@/utils/supabaseAuth';
import type { Session } from '@supabase/supabase-js';

export const useAuthManager = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Function to get user profile from session
  const getUserProfile = useCallback(async (authUser: any): Promise<User | null> => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error || !profileData) {
        console.error('[useAuthManager] Profile not found:', error);
        return null;
      }

      return {
        id: authUser.id,
        email: profileData.email,
        role: profileData.role,
        name: profileData.name,
        isAdmin: profileData.is_admin,
        lastLogin: new Date()
      };
    } catch (error) {
      console.error('[useAuthManager] Error getting user profile:', error);
      return null;
    }
  }, []);

  // Handle auth state changes
  const handleAuthStateChange = useCallback(async (event: string, session: Session | null) => {
    console.log('[useAuthManager] Auth state changed:', event, session?.user?.email);
    
    setSession(session);
    
    if (session?.user) {
      // User is logged in, get their profile
      setTimeout(async () => {
        const userProfile = await getUserProfile(session.user);
        if (userProfile) {
          setUser(userProfile);
          console.log(`[useAuthManager] User profile loaded: ${userProfile.email}`);
        } else {
          console.log('[useAuthManager] Could not load user profile');
          setUser(null);
          toast.error('שגיאה בטעינת פרטי המשתמש');
        }
        setIsLoading(false);
      }, 0);
    } else {
      // User is logged out
      setUser(null);
      setIsLoading(false);
      
      // Only navigate to login if we're not already on the login page
      if (window.location.pathname !== '/') {
        console.log("[useAuthManager] User logged out, navigating to login page");
        navigate("/", { replace: true });
      }
    }
  }, [getUserProfile, navigate]);

  useEffect(() => {
    console.log("[useAuthManager] Setting up auth state listener");
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[useAuthManager] Initial session check:", session?.user?.email);
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    return () => {
      console.log("[useAuthManager] Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const handleLogout = useCallback(async () => {
    try {
      console.log(`[useAuthManager] Logging out user: ${user?.email}`);
      
      await logoutUser();
      setUser(null);
      setSession(null);
      toast.success("התנתקת בהצלחה");
      
      console.log("[useAuthManager] Navigating to login page after logout");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("[useAuthManager] Error during logout:", error);
      toast.error("שגיאה בתהליך ההתנתקות");
      // Force navigation even if there's an error
      navigate("/", { replace: true });
    }
  }, [user?.email, navigate]);

  // Method to manually refresh user data
  const refreshUser = useCallback(async () => {
    if (session?.user) {
      const userProfile = await getUserProfile(session.user);
      console.log("[useAuthManager] Refreshing user data:", userProfile);
      setUser(userProfile);
    }
  }, [session, getUserProfile]);

  return { 
    user, 
    session,
    isLoading, 
    handleLogout,
    refreshUser 
  };
};
