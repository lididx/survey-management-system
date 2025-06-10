
import { createClient } from '@supabase/supabase-js';
import { User, AuditLogEntry, UserRole } from '@/types/types';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

const CURRENT_USER_KEY = 'current_user';

// User types
interface SupabaseUser extends User {
  mustChangePassword?: boolean;
  lastLogin?: Date;
}

// Initialize and migrate users on first load
export const initializeSupabaseAuth = async (): Promise<void> => {
  try {
    console.log('[SupabaseAuth] Initializing authentication system');
    
    // Call migration function
    const { data, error } = await supabase.functions.invoke('migrate-users');
    
    if (error) {
      console.error('[SupabaseAuth] Migration error:', error);
    } else {
      console.log('[SupabaseAuth] Migration result:', data);
    }
  } catch (error) {
    console.error('[SupabaseAuth] Initialization error:', error);
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  console.log(`[SupabaseAuth] Login attempt for email: ${email}`);
  
  try {
    const { data, error } = await supabase.functions.invoke('auth-login', {
      body: { email, password }
    });

    if (error || !data.success) {
      console.log(`[SupabaseAuth] Login failed for ${email}:`, data?.error || error);
      return { 
        success: false, 
        error: data?.error || 'שגיאה בהתחברות' 
      };
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      name: data.user.name,
      isAdmin: data.user.isAdmin,
      lastLogin: new Date(data.user.lastLogin)
    };

    // Store current user in session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    console.log(`[SupabaseAuth] User logged in successfully: ${email}`);
    
    // Check if user must change password
    if (data.user.mustChangePassword) {
      return { 
        success: true, 
        user,
        error: 'MUST_CHANGE_PASSWORD'
      };
    }
    
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
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  const user = userJson ? JSON.parse(userJson) : null;
  console.log("[SupabaseAuth] getCurrentUser:", user);
  return user;
};

// Logout user
export const logoutUser = (): void => {
  console.log("[SupabaseAuth] Logging out user");
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Create new user (admin only)
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole,
  currentUserId: string
): Promise<{ success: boolean; user?: any; temporaryPassword?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('user-management', {
      body: { 
        action: 'create_user',
        email,
        name,
        role,
        currentUserId
      }
    });

    if (error || !data.success) {
      return { 
        success: false, 
        error: data?.error || 'שגיאה ביצירת משתמש' 
      };
    }

    return { 
      success: true, 
      user: data.user,
      temporaryPassword: data.temporaryPassword
    };
  } catch (error) {
    console.error('[SupabaseAuth] Create user error:', error);
    return { 
      success: false, 
      error: 'שגיאה ביצירת משתמש' 
    };
  }
};

// Change password
export const changePassword = async (
  userId: string,
  newPassword: string,
  oldPassword?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('user-management', {
      body: { 
        action: 'change_password',
        userId,
        newPassword,
        oldPassword
      }
    });

    if (error || !data.success) {
      return { 
        success: false, 
        error: data?.error || 'שגיאה בשינוי סיסמה' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('[SupabaseAuth] Change password error:', error);
    return { 
      success: false, 
      error: 'שגיאה בשינוי סיסמה' 
    };
  }
};

// Get all users (admin only)
export const getUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_admin, active, created_at, last_login')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SupabaseAuth] Get users error:', error);
      return [];
    }

    return data.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.is_admin,
      lastLogin: user.last_login ? new Date(user.last_login) : undefined
    }));
  } catch (error) {
    console.error('[SupabaseAuth] Get users error:', error);
    return [];
  }
};

// Get audit log (admin only)
export const getAuditLog = async (limit?: number): Promise<AuditLogEntry[]> => {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SupabaseAuth] Get audit log error:', error);
      return [];
    }

    return data.map(entry => ({
      id: entry.id,
      timestamp: new Date(entry.timestamp),
      userId: entry.user_id,
      userName: entry.user_name,
      action: entry.action,
      details: entry.details
    }));
  } catch (error) {
    console.error('[SupabaseAuth] Get audit log error:', error);
    return [];
  }
};

// Initialize on import
initializeSupabaseAuth();
