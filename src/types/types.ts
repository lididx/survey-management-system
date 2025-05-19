
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
  currentStatus: StatusType;
  statusLog: StatusChange[];
  ownerId: string;
  ownerName?: string;
}

export type UserRole = "בודק" | "מנהלת";

export interface User {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
}
