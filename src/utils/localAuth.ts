
import { User } from "@/types/types";
import CryptoJS from "crypto-js";

// Secret key for password encryption - in a real app, this would be stored in a secure environment variable
const ENCRYPTION_SECRET = "local-survey-management-system-secret";

// User storage key
const USERS_STORAGE_KEY = "local_users";
const CURRENT_USER_KEY = "current_user";

// User types with password
interface LocalUser extends User {
  password: string;
}

// Initialize users if not already present
const initializeUsers = (): void => {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    const defaultUsers: LocalUser[] = [
      {
        email: "lidor@example.com",
        password: encryptPassword("password123"),
        role: "בודק",
        name: "לידור",
        isAdmin: true // Lidor is an admin
      },
      {
        email: "moran@example.com",
        password: encryptPassword("password123"),
        role: "בודק",
        name: "מורן"
      },
      {
        email: "chen@example.com",
        password: encryptPassword("password123"),
        role: "מנהלת",
        name: "חן"
      }
    ];
    
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    console.log("Default users initialized in local storage");
  }
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
  role: "בודק" | "מנהלת" = "בודק", 
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
    isAdmin
  };
  
  // Add to users array
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  
  return { success: true };
};

// Login user
export const loginUser = (email: string, password: string): { success: boolean; user?: User; error?: string } => {
  console.log(`[localAuth] Login attempt for email: ${email}`);
  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log(`[localAuth] User not found: ${email}`);
    return { 
      success: false, 
      error: "משתמש לא נמצא" 
    };
  }
  
  const passwordValid = verifyPassword(user.password, password);
  console.log(`[localAuth] Password valid: ${passwordValid}`);
  
  if (!passwordValid) {
    return { 
      success: false, 
      error: "סיסמה שגויה" 
    };
  }
  
  // Store current user in session
  const currentUser: User = {
    email: user.email,
    role: user.role,
    name: user.name,
    isAdmin: user.isAdmin || false
  };
  
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
  console.log(`[localAuth] User logged in successfully: ${email}`);
  
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
      isAdmin: updates.isAdmin !== undefined ? updates.isAdmin : users[userIndex].isAdmin
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
  }
  
  return { success: true };
};

// Delete user (admin-only functionality)
export const deleteUser = (email: string): { success: boolean; error?: string } => {
  const users = getUsers();
  const filteredUsers = users.filter(user => user.email !== email);
  
  if (filteredUsers.length === users.length) {
    return {
      success: false,
      error: "משתמש לא נמצא"
    };
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
  
  return updateUser(email, { password: newPassword });
};

// Initialize on import
initializeUsers();
