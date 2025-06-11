
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { toast } from "sonner";
import { Audit, StatusType } from "@/types/types";

interface StatusBadgeProps {
  audit: Audit;
  userRole: string;
  canEdit: (auditOwnerId: string) => boolean;
  onStatusChange: (audit: Audit, newStatus: StatusType) => void;
}

const statusOptions: StatusType[] = [
  "התקבל",
  "נשלח מייל תיאום למנהל מערכת",
  "נקבע",
  "בכתיבה",
  "שאלות השלמה מול מנהל מערכת",
  "בבקרה",
  "הסתיים"
];

const statusColorMap: Record<StatusType, { bg: string, text: string, border?: string }> = {
  "התקבל": { bg: "#cce5ff", text: "#004085", border: "#b8daff" },
  "נשלח מייל תיאום למנהל מערכת": { bg: "#fff3cd", text: "#856404", border: "#ffeeba" },
  "נקבע": { bg: "#d4edda", text: "#155724", border: "#c3e6cb" },
  "בכתיבה": { bg: "#ffeeba", text: "#856404", border: "#ffeeba" },
  "שאלות השלמה מול מנהל מערכת": { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" },
  "בבקרה": { bg: "#e2d6f3", text: "#5a2f93", border: "#d5c8ed" },
  "הסתיים": { bg: "#c3e6cb", text: "#155724", border: "#b1dfbb" }
};

export const StatusBadge = ({ audit, userRole, canEdit, onStatusChange }: StatusBadgeProps) => {
  const colors = statusColorMap[audit.currentStatus];
  
  const customBadgeStyle = {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border || colors.bg}`,
    padding: '0.25rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const handleStatusChangeLocal = (newStatus: StatusType) => {
    onStatusChange(audit, newStatus);
  };

  // Allow status changes for managers with limited options
  if (userRole === "מנהלת" && !canEdit(audit.ownerId)) {
    return (
      <Select 
        value={audit.currentStatus}
        onValueChange={(value: StatusType) => {
          if (value === "הסתיים" || value === "בבקרה") {
            handleStatusChangeLocal(value);
          } else {
            toast.error("מנהלים יכולים לעדכן רק לסטטוס 'הסתיים' או 'בבקרה'");
          }
        }}
      >
        <SelectTrigger className="w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100">
          <span style={customBadgeStyle}>{audit.currentStatus}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="בבקרה">בבקרה</SelectItem>
          <SelectItem value="הסתיים">הסתיים</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  
  // Allow full status changes for users who can edit
  return (
    <Select 
      value={audit.currentStatus}
      onValueChange={handleStatusChangeLocal}
      disabled={!canEdit(audit.ownerId) && userRole !== "מנהלת"}
    >
      <SelectTrigger className="w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100">
        <span style={customBadgeStyle}>{audit.currentStatus}</span>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map(option => (
          <SelectItem key={option} value={option}>{option}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
