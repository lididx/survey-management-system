
import { createClient } from '@supabase/supabase-js';
import { User, AuditLogEntry, UserRole } from '@/types/types';
import { toast } from 'sonner';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key';

// Only create Supabase client if properly configured
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

const CURRENT_USER_KEY = 'current_user';

// User types
interface SupabaseUser extends User {
  mustChangePassword?: boolean;
  lastLogin?: Date;
}

// Mock users for development when Supabase is not configured
const mockUsers = [
  {
    id: '1',
    email: 'lidor@example.com',
    password: 'password123',
    name: 'לידור',
    role: 'בודק' as UserRole,
    isAdmin: false
  },
  {
    id: '2',
    email: 'moran@example.com',
    password: 'password123',
    name: 'מורן',
    role: 'בודק' as UserRole,
    isAdmin: false
  },
  {
    id: '3',
    email: 'chen@example.com',
    password: 'password123',
    name: 'חן',
    role: 'מנהל' as UserRole,
    isAdmin: true
  },
  {
    id: '4',
    email: 'admin@system.com',
    password: 'Aa123456!',
    name: 'מנהל מערכת',
    role: 'מנהל מערכת' as UserRole,
    isAdmin: true
  }
];

// Initialize and migrate users on first load
export const initializeSupabaseAuth = async (): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[SupabaseAuth] Supabase not configured, using mock authentication');
    return;
  }

  try {
    console.log('[SupabaseAuth] Initializing authentication system');
    
    // Call migration function
    const { data, error } = await supabase!.functions.invoke('migrate-users');
    
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
  
  // If Supabase is not configured, use mock authentication
  if (!isSupabaseConfigured) {
    console.log('[SupabaseAuth] Using mock authentication');
    
    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!mockUser) {
      return { 
        success: false, 
        error: 'שגיאה בהתחברות - פרטי התחברות שגויים' 
      };
    }

    const user: User = {
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role,
      name: mockUser.name,
      isAdmin: mockUser.isAdmin,
      lastLogin: new Date()
    };

    // Store current user in session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    console.log(`[SupabaseAuth] Mock user logged in successfully: ${email}`);
    
    return { 
      success: true, 
      user 
    };
  }
  
  try {
    const { data, error } = await supabase!.functions.invoke('auth-login', {
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
  if (!isSupabaseConfigured) {
    return { 
      success: false, 
      error: 'יצירת משתמשים זמינה רק עם Supabase' 
    };
  }

  try {
    const { data, error } = await supabase!.functions.invoke('user-management', {
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
  if (!isSupabaseConfigured) {
    return { 
      success: false, 
      error: 'שינוי סיסמה זמין רק עם Supabase' 
    };
  }

  try {
    const { data, error } = await supabase!.functions.invoke('user-management', {
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
  if (!isSupabaseConfigured) {
    // Return mock users for development
    return mockUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      lastLogin: new Date()
    }));
  }

  try {
    const { data, error } = await supabase!
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
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase!
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

// Initialize on import (only if configured)
if (isSupabaseConfigured) {
  initializeSupabaseAuth();
}
