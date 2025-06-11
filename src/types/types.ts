
export type StatusType = 
  | "התקבל"
  | "נשלח מייל תיאום למנהל מערכת"
  | "נקבע"
  | "בכתיבה"
  | "שאלות השלמה מול מנהל מערכת"
  | "בבקרה"
  | "הסתיים";

export type ContactGender = "male" | "female";

export interface Contact {
  id?: string;
  fullName: string;
  firstName?: string; // Added for first name
  lastName?: string;  // Added for last name
  role: string;
  email: string;
  phone: string;
  gender: ContactGender;
}

export interface StatusChange {
  id?: string;
  timestamp: Date;
  oldStatus: StatusType | null;
  newStatus: StatusType;
  oldDate: Date | null;
  newDate: Date | null;
  reason: string;
  modifiedBy: string;
}

export interface Audit {
  id: string;
  name: string;
  description: string;
  clientName: string;
  contacts: Contact[];
  receivedDate: Date;
  plannedMeetingDate: Date | null;
  existingMeetingDate?: Date | null; // Optional pre-existing meeting date
  scheduledDate?: Date | null; // Scheduled date for the audit
  currentStatus: StatusType;
  statusLog: StatusChange[];
  ownerId: string;
  ownerName?: string;
}

export type UserRole = "בודק" | "מנהלת" | "מנהל מערכת";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin?: boolean;
  lastLogin?: Date;
  active?: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details?: string;
}

// Client logos mapping - updated with new logos
export const CLIENT_LOGOS: Record<string, string> = {
  "בנק לאומי": "/lovable-uploads/630beae4-330b-4253-8bd2-54d9428cd66c.png",
  "לאומי": "/lovable-uploads/d05bd446-c405-4fc7-be6b-7f3e00ddd4f2.png",
  "בנק הפועלים": "/lovable-uploads/185e468c-81d7-4526-9bd9-fd9e837fc456.png",
  "הראל": "/lovable-uploads/9882bdb5-9500-4e09-ab1c-b7c481b2b99d.png",
  "מנורה": "/lovable-uploads/6845d5ea-cf06-4ad9-8d59-3fa2723ee5eb.png",
  "מנורה מבטחים": "/lovable-uploads/702d7f38-1871-4e2d-a397-261b8d4b3a2c.png",
  "בנק ישראל": "/lovable-uploads/2ac2670a-53eb-4768-9fa1-c37ad19cc7cf.png",
  "בנק ירושלים": "/lovable-uploads/1a51f6bd-5727-42e7-99b5-bdc4d7237784.png",
  "בזק בינלאומי": "/lovable-uploads/18796fec-96dc-4f3b-93e0-4bafb0348801.png",
  "הפניקס": "/lovable-uploads/f9068101-0e8a-4311-abc2-3f1cfc906c9d.png",
  "מגדל": "/lovable-uploads/38c9b313-8b39-49f6-beaf-27390869b87c.png",
  "מרכנתיל": "/lovable-uploads/8169f97b-24de-4d86-80b6-cfe0798cb787.png",
  "מכבי": "/lovable-uploads/91e9cc11-b0d2-44ac-b1eb-75f8055b487e.png",
  "הכשרה": "/lovable-uploads/21c5bf04-b87e-4932-8274-8490e4024271.png",
  "מת\"ף": "/lovable-uploads/cc32866e-be83-452d-b663-7246ce0cd3b6.png"
};
