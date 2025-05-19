
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
  role: string;
  email: string;
  phone: string;
  gender: ContactGender; // New field for contact gender
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
  clientName: string; // Added field for client name
  contacts: Contact[];
  receivedDate: Date;
  plannedMeetingDate: Date | null;
  currentStatus: StatusType;
  statusLog: StatusChange[];
  ownerId: string;
  ownerName?: string; // Add owner name to display who created the audit
}

export type UserRole = "בודק" | "מנהלת";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}
