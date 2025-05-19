
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusType } from "@/types/types";

interface StatusSectionProps {
  currentStatus: StatusType;
  initialStatus: StatusType | null;
  onStatusChange: (status: StatusType) => void;
  statusReason: string;
  setStatusReason: (reason: string) => void;
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

// Status color mapping
const statusColorMap: Record<StatusType, { bg: string, text: string, border?: string }> = {
  "התקבל": { bg: "#cce5ff", text: "#004085", border: "#b8daff" },
  "נשלח מייל תיאום למנהל מערכת": { bg: "#fff3cd", text: "#856404", border: "#ffeeba" },
  "נקבע": { bg: "#d4edda", text: "#155724", border: "#c3e6cb" },
  "בכתיבה": { bg: "#ffeeba", text: "#856404", border: "#ffeeba" },
  "שאלות השלמה מול מנהל מערכת": { bg: "#f8d7da", text: "#721c24", border: "#f5c6cb" },
  "בבקרה": { bg: "#e2d6f3", text: "#5a2f93", border: "#d5c8ed" },
  "הסתיים": { bg: "#c3e6cb", text: "#155724", border: "#b1dfbb" }
};

export const StatusSection = ({
  currentStatus,
  initialStatus,
  onStatusChange,
  statusReason,
  setStatusReason
}: StatusSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="status">סטטוס</Label>
      <Select
        value={currentStatus}
        onValueChange={onStatusChange}
      >
        <SelectTrigger id="status">
          <SelectValue placeholder="בחר סטטוס" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(status => {
            const colors = statusColorMap[status];
            return (
              <SelectItem 
                key={status} 
                value={status}
              >
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    border: `1px solid ${colors.border || colors.bg}`
                  }}
                >
                  {status}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {initialStatus !== currentStatus && (
        <div className="mt-2 space-y-2">
          <Label htmlFor="statusReason">סיבת שינוי סטטוס</Label>
          <Textarea
            id="statusReason"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="הסבר סיבת השינוי (לא חובה)"
            rows={2}
          />
        </div>
      )}
    </div>
  );
};
