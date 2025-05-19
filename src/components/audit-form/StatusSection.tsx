
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
          {statusOptions.map(status => (
            <SelectItem key={status} value={status}>{status}</SelectItem>
          ))}
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
