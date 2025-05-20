
import { User, AuditLogEntry, UserRole } from "@/types/types";
import CryptoJS from "crypto-js";

// Secret key for password encryption - in a real app, this would be stored in a secure environment variable
const ENCRYPTION_SECRET = "local-survey-management-system-secret";

// User storage key
const USERS_STORAGE_KEY = "local_users";
const CURRENT_USER_KEY = "current_user";
const AUDIT_LOG_KEY = "audit_log";

// User types with password
interface LocalUser extends User {
  password: string;
  active: boolean;
  lastLogin?: Date;
}

// Initialize users if not already present
const initializeUsers = (): void => {
  // Clear the existing users for testing to ensure we have the correct setup
  localStorage.removeItem(USERS_STORAGE_KEY);
  
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    const defaultUsers: LocalUser[] = [
      {
        id: "user_1",
        email: "lidor@example.com",
        password: encryptPassword("password123"),
        role: "בודק",
        name: "לידור",
        isAdmin: false,
        active: true,
        lastLogin: new Date()
      },
      {
        id: "user_2",
        email: "moran@example.com",
        password: encryptPassword("password123"),
        role: "בודק",
        name: "מורן",
        active: true
      },
      {
        id: "user_3",
        email: "chen@example.com",
        password: encryptPassword("password123"),
        role: "מנהלת",
        name: "חן",
        active: true
      },
      {
        id: "user_4",
        email: "admin@system.com",
        password: encryptPassword("Aa123456"),
        role: "מנהל מערכת",
        name: "לידור מנהל",
        isAdmin: true,
        active: true
      }
    ];
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    console.log("Default users initialized in local storage");
    
    // Initialize empty audit log
    if (!localStorage.getItem(AUDIT_LOG_KEY)) {
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([]));
    }
  }
};

// Add an entry to the audit log
export const addAuditLogEntry = (userId: string, userName: string, action: string, details?: string): void => {
  const auditLogJson = localStorage.getItem(AUDIT_LOG_KEY);
  const auditLog: AuditLogEntry[] = auditLogJson ? JSON.parse(auditLogJson) : [];
  
  const newEntry: AuditLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId,
    userName,
    action,
    details
  };
  
  auditLog.push(newEntry);
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(auditLog));
};

// Get audit log entries, with optional filtering
export const getAuditLog = (
  limit?: number, 
  userId?: string, 
  action?: string
): AuditLogEntry[] => {
  const auditLogJson = localStorage.getItem(AUDIT_LOG_KEY);
  let auditLog: AuditLogEntry[] = auditLogJson ? JSON.parse(auditLogJson) : [];
  
  // Apply filters if provided
  if (userId) {
    auditLog = auditLog.filter(entry => entry.userId === userId);
  }
  
  if (action) {
    auditLog = auditLog.filter(entry => entry.action.includes(action));
  }
  
  // Sort by timestamp, newest first
  auditLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  // Apply limit if provided
  if (limit && limit > 0) {
    auditLog = auditLog.slice(0, limit);
  }
  
  return auditLog;
};

// Helper function to encrypt password
const encryptPassword = (password: string): string => {
  return CryptoJS.AES.encrypt(password, ENCRYPTION_SECRET).toString();
};

// Helper function to decrypt and verify password
const verifyPassword = (encryptedPassword: string, inputPassword: string): boolean => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_SECRET).toString(CryptoJS.enc.Utf8);
    return decrypted === inputPassword;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
};

// Get all users
export const getUsers = (): LocalUser[] => {
  initializeUsers();
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

// Register a new user
export const registerUser = (
  email: string, 
  password: string, 
  name: string, 
  role: UserRole = "בודק", 
  isAdmin: boolean = false
): { success: boolean; error?: string } => {
  const users = getUsers();
  
  // Check if email already exists
  if (users.some(user => user.email === email)) {
    return { 
      success: false, 
      error: "כתובת האימייל כבר קיימת במערכת" 
    };
  }
  
  // Password policy check (basic example)
  if (password.length < 6) {
    return { 
      success: false, 
      error: "סיסמה חייבת להכיל לפחות 6 תווים" 
    };
  }
  
  // Create new user
  const newUser: LocalUser = {
    email,
    password: encryptPassword(password),
    role,
    name,
    isAdmin,
    active: true
  };
  
  // Add to users array
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  
  // Add audit log entry if a current user exists (for the admin who created this user)
  const currentUser = getCurrentUser();
  if (currentUser) {
    addAuditLogEntry(
      currentUser.email,
      currentUser.name,
      "user_created",
      `Created new user: ${email} with role: ${role}`
    );
  }
  
  return { success: true };
};

// Login user
export const loginUser = (email: string, password: string): { success: boolean; user?: User; error?: string } => {
  console.log(`[localAuth] Login attempt for email: ${email}`);
  
  // Force initialization of users to ensure they exist
  initializeUsers();
  
  const users = getUsers();
  console.log("[localAuth] Available users:", users.map(u => ({ email: u.email, role: u.role, active: u.active })));
  
  const user = users.find(u => u.email === email && u.active !== false);
  
  if (!user) {
    console.log(`[localAuth] User not found or inactive: ${email}`);
    return { 
      success: false, 
      error: "משתמש לא נמצא או לא פעיל" 
    };
  }
  
  const passwordValid = verifyPassword(user.password, password);
  console.log(`[localAuth] Password valid for ${email}: ${passwordValid}`);
  
  if (!passwordValid) {
    // Log failed login attempt
    addAuditLogEntry(
      email,
      user.name,
      "login_failed",
      "Failed login attempt - invalid password"
    );
    
    return { 
      success: false, 
      error: "סיסמה שגויה" 
    };
  }
  
  // Update last login time
  const updatedUsers = users.map(u => {
    if (u.email === email) {
      return { ...u, lastLogin: new Date() };
    }
    return u;
  });
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  
  // Store current user in session
  const currentUser: User = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    isAdmin: user.isAdmin || false,
    lastLogin: new Date()
  };
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  console.log(`[localAuth] User logged in successfully: ${email}`);
  
  // Log successful login
  addAuditLogEntry(
    email,
    user.name,
    "login_success",
    "User logged in successfully"
  );
  
  return { 
    success: true, 
    user: currentUser 
  };
};

// Check if user is logged in
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  const user = userJson ? JSON.parse(userJson) : null;
  console.log("[localAuth] getCurrentUser:", user);
  return user;
};

// Logout user
export const logoutUser = (): void => {
  // Log logout action before removing user data
  const currentUser = getCurrentUser();
  if (currentUser) {
    addAuditLogEntry(
      currentUser.email,
      currentUser.name,
      "logout",
      "User logged out"
    );
  }
  
  console.log("[localAuth] Logging out user");
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get user by email
export const getUserByEmail = (email: string): LocalUser | null => {
  const users = getUsers();
  return users.find(user => user.email === email) || null;
};

// Update user
export const updateUser = (email: string, updates: Partial<Omit<LocalUser, "email">>): { success: boolean; error?: string } => {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex === -1) {
    return { 
      success: false, 
      error: "משתמש לא נמצא" 
    };
  }
  
  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    // If updating password, encrypt it
    ...(updates.password ? { password: encryptPassword(updates.password) } : {})
  };
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  
  // If this is the current logged in user, update current user as well
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.email === email) {
    const updatedCurrentUser: User = {
      email,
      name: updates.name || users[userIndex].name,
      role: updates.role || users[userIndex].role,
      isAdmin: updates.isAdmin !== undefined ? updates.isAdmin : users[userIndex].isAdmin,
      lastLogin: users[userIndex].lastLogin
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
  }
  
  // Log the update
  if (currentUser) {
    addAuditLogEntry(
      currentUser.email,
      currentUser.name,
      "user_updated",
      `Updated user: ${email}`
    );
  }
  
  return { success: true };
};

// Soft delete user (deactivate)
export const deactivateUser = (email: string): { success: boolean; error?: string } => {
  return updateUser(email, { active: false });
};

// Reactivate user
export const activateUser = (email: string): { success: boolean; error?: string } => {
  return updateUser(email, { active: true });
};

// Hard delete user (admin-only functionality)
export const deleteUser = (email: string): { success: boolean; error?: string } => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.email !== email);
  
  if (filteredUsers.length === users.length) {
    return {
      success: false,
      error: "משתמש לא נמצא"
    };
  }
  
  // Log deletion
  const currentUser = getCurrentUser();
  if (currentUser) {
    addAuditLogEntry(
      currentUser.email,
      currentUser.name,
      "user_deleted",
      `Deleted user: ${email}`
    );
  }
  
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
  return { success: true };
};

// Reset user password (admin-only functionality)
export const resetUserPassword = (email: string, newPassword: string): { success: boolean; error?: string } => {
  if (newPassword.length < 6) {
    return { 
      success: false, 
      error: "סיסמה חייבת להכיל לפחות 6 תווים" 
    };
  }
  
  // Log password reset
  const currentUser = getCurrentUser();
  if (currentUser) {
    addAuditLogEntry(
      currentUser.email,
      currentUser.name,
      "password_reset",
      `Reset password for user: ${email}`
    );
  }
  
  return updateUser(email, { password: newPassword });
};

// Generate a random secure password
export const generateRandomPassword = (length: number = 10): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Initialize on import
initializeUsers();
