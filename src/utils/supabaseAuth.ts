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
const MOCK_USERS_KEY = 'mock_users';

// User types
interface SupabaseUser extends User {
  mustChangePassword?: boolean;
  lastLogin?: Date;
}

// Mock users for development when Supabase is not configured
const defaultMockUsers = [
  {
    id: '1',
    email: 'lidorn@citadel.co.il',
    password: 'password123',
    name: 'לידור',
    role: 'בודק' as UserRole,
    isAdmin: false
  },
  {
    id: '2',
    email: 'moran@citadel.co.il',
    password: 'password123',
    name: 'מורן',
    role: 'בודק' as UserRole,
    isAdmin: false
  },
  {
    id: '3',
    email: 'chen@citadel.co.il',
    password: 'password123',
    name: 'חן',
    role: 'מנהלת' as UserRole,
    isAdmin: true
  },
  {
    id: '4',
    email: 'Citadministrator@system.co.il',
    password: 'Aa123456!',
    name: 'מנהל מערכת',
    role: 'מנהל מערכת' as UserRole,
    isAdmin: true
  }
];

// Get mock users from localStorage or use defaults
const getMockUsers = () => {
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading mock users:', error);
  }
  return defaultMockUsers;
};

// Save mock users to localStorage
const saveMockUsers = (users: any[]) => {
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving mock users:', error);
  }
};

// Initialize mock users in localStorage if not exists
const initializeMockUsers = () => {
  const stored = localStorage.getItem(MOCK_USERS_KEY);
  if (!stored) {
    saveMockUsers(defaultMockUsers);
  }
};

// Initialize and migrate users on first load
export const initializeSupabaseAuth = async (): Promise<void> => {
  if (!isSupabaseConfigured) {
    console.log('[SupabaseAuth] Supabase not configured, using mock authentication');
    initializeMockUsers();
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
    
    const mockUsers = getMockUsers();
    const mockUser = mockUsers.find((u: any) => u.email === email && u.password === password);
    console.log('[SupabaseAuth] Found mock user:', mockUser ? 'YES' : 'NO');
    
    if (!mockUser) {
      console.log('[SupabaseAuth] Mock login failed - credentials not found');
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
    console.log(`[SupabaseAuth] Mock user logged in successfully: ${email}`, user);
    
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

// Generate a random password
const generateRandomPassword = (): string => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special
  
  // Fill the rest
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Create new user (admin only)
export const createUser = async (
  email: string, 
  name: string, 
  role: UserRole,
  currentUserId: string
): Promise<{ success: boolean; user?: any; temporaryPassword?: string; error?: string }> => {
  if (!isSupabaseConfigured) {
    // Mock user creation
    console.log('[SupabaseAuth] Creating mock user:', { email, name, role });
    
    const mockUsers = getMockUsers();
    
    // Check if user already exists
    const existingUser = mockUsers.find((u: any) => u.email === email);
    if (existingUser) {
      return { 
        success: false, 
        error: 'משתמש עם כתובת מייל זו כבר קיים' 
      };
    }
    
    // Generate new user ID
    const newId = String(mockUsers.length + 1);
    const temporaryPassword = generateRandomPassword();
    
    const newUser = {
      id: newId,
      email,
      password: temporaryPassword,
      name,
      role,
      isAdmin: role === 'מנהל מערכת'
    };
    
    // Add to mock users
    const updatedUsers = [...mockUsers, newUser];
    saveMockUsers(updatedUsers);
    
    console.log('[SupabaseAuth] Mock user created successfully:', newUser);
    
    return { 
      success: true, 
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isAdmin: newUser.isAdmin
      },
      temporaryPassword
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
    const mockUsers = getMockUsers();
    return mockUsers.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isAdmin: user.isAdmin,
      lastLogin: new Date(),
      active: true
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
} else {
  initializeMockUsers();
}
