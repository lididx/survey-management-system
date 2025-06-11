
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/types';
import { toast } from 'sonner';

const CURRENT_USER_KEY = 'current_user';

// Login user with Supabase Auth
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  console.log(`[SupabaseAuth] Login attempt for email: ${email}`);
  
  try {
    // First check if user exists in profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profileError || !profileData) {
      console.log('[SupabaseAuth] User not found in profiles table');
      return { 
        success: false, 
        error: 'שגיאה בהתחברות - משתמש לא נמצא' 
      };
    }

    // For now, use simple password validation (in production, use proper auth)
    const expectedPasswords: { [key: string]: string } = {
      'lidorn@citadel.co.il': 'password123',
      'moran@citadel.co.il': 'password123',
      'chen@citadel.co.il': 'password123',
      'Citadministrator@system.co.il': 'Aa123456!'
    };

    if (expectedPasswords[email] !== password) {
      console.log('[SupabaseAuth] Invalid password');
      return { 
        success: false, 
        error: 'שגיאה בהתחברות - סיסמה שגויה' 
      };
    }

    const user: User = {
      id: profileData.id,
      email: profileData.email,
      role: profileData.role as UserRole,
      name: profileData.name,
      isAdmin: profileData.is_admin,
      lastLogin: new Date()
    };

    // Store current user in session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    console.log(`[SupabaseAuth] User logged in successfully: ${email}`, user);
    
    return { 
      success: true, 
      user 
    };
  } catch (error) {
    console.error('[SupabaseAuth] Login error:', error);
    return { 
      success: false, 
      error: 'שגיאה בהתחברות למערכת' 
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    console.log("[SupabaseAuth] getCurrentUser result:", user);
    return user;
  } catch (error) {
    console.error("[SupabaseAuth] Error getting current user:", error);
    return null;
  }
};

// Logout user
export const logoutUser = (): void => {
  console.log("[SupabaseAuth] Logging out user");
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get all users (admin only)
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseAuth] Get users error:', error);
      return [];
    }

    return data.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role as UserRole,
      isAdmin: profile.is_admin,
      lastLogin: new Date()
    }));
  } catch (error) {
    console.error('[SupabaseAuth] Get users error:', error);
    return [];
  }
};
