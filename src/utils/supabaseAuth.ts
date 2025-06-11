
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/types';
import { toast } from 'sonner';

// Login user with Supabase Auth
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  console.log(`[SupabaseAuth] Login attempt for email: ${email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[SupabaseAuth] Login error:', error.message);
      return { 
        success: false, 
        error: error.message === 'Invalid login credentials' ? 
          'שגיאה בהתחברות - אימייל או סיסמה אינם נכונים' : 
          'שגיאה בהתחברות למערכת'
      };
    }

    if (!data.user) {
      return { 
        success: false, 
        error: 'שגיאה בהתחברות למערכת' 
      };
    }

    // Get user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError || !profileData) {
      console.log('[SupabaseAuth] Profile not found:', profileError);
      return { 
        success: false, 
        error: 'פרופיל המשתמש לא נמצא במערכת' 
      };
    }

    const user: User = {
      id: data.user.id,
      email: profileData.email,
      role: profileData.role as UserRole,
      name: profileData.name,
      isAdmin: profileData.is_admin,
      lastLogin: new Date()
    };

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

// Create a new user
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole, 
  createdByUserId: string
): Promise<{ success: boolean; user?: User; temporaryPassword?: string; error?: string }> => {
  console.log(`[SupabaseAuth] Creating new user: ${email}`);
  
  try {
    // Generate temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password: temporaryPassword,
      options: {
        data: {
          name,
          role,
          is_admin: role === 'מנהל מערכת'
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('[SupabaseAuth] Error creating user:', error);
      return { 
        success: false, 
        error: error.message.includes('already registered') ? 
          'משתמש עם כתובת אימייל זו כבר קיים במערכת' : 
          'שגיאה ביצירת המשתמש'
      };
    }

    if (!data.user) {
      return { 
        success: false, 
        error: 'שגיאה ביצירת המשתמש' 
      };
    }

    const user: User = {
      id: data.user.id,
      email,
      role,
      name,
      isAdmin: role === 'מנהל מערכת'
    };

    console.log(`[SupabaseAuth] User created successfully: ${email}`);
    
    return { 
      success: true, 
      user,
      temporaryPassword 
    };
  } catch (error) {
    console.error('[SupabaseAuth] Create user error:', error);
    return { 
      success: false, 
      error: 'שגיאה ביצירת המשתמש' 
    };
  }
};

// Change password
export const changePassword = async (
  newPassword: string
): Promise<{ success: boolean; error?: string }> => {
  console.log(`[SupabaseAuth] Changing password for current user`);
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('[SupabaseAuth] Change password error:', error);
      return { 
        success: false, 
        error: 'שגיאה בשינוי הסיסמה' 
      };
    }

    console.log(`[SupabaseAuth] Password changed successfully`);
    
    return { 
      success: true 
    };
  } catch (error) {
    console.error('[SupabaseAuth] Change password error:', error);
    return { 
      success: false, 
      error: 'שגיאה בשינוי הסיסמה' 
    };
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  // This will be replaced by the session-based approach in useAuthManager
  return null;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  console.log("[SupabaseAuth] Logging out user");
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[SupabaseAuth] Logout error:", error);
  }
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
      id: profile.user_id || profile.id,
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
