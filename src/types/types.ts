
export type StatusType = 
  | "התקבל"
  | "נשלח מייל תיאום למנהל מערכת"
  | "נקבע"
  | "בכתיבה"
  | "שאלות השלמה מול מנהל מערכת"
  | "בבקרה"
  | "הסתיים";

export interface Contact {
  id?: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
}

export interface StatusChange {
  id?: string;
  timestamp: Date;
  oldStatus: StatusType | null;
  newStatus: StatusType;
  oldDate: Date | null;
  newDate: Date | null;
  reason: string;
}

export interface Audit {
  id: string;
  name: string;
  description: string;
  contacts: Contact[];
  receivedDate: Date;
  plannedMeetingDate: Date | null;
  currentStatus: StatusType;
  statusLog: StatusChange[];
  ownerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "בודק" | "מנהלת";
}
