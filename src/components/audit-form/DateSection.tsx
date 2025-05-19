
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface DateSectionProps {
  plannedMeetingDate: Date | null;
  initialDate: Date | null;
  onDateChange: (date: Date | null) => void;
  dateReason: string;
  setDateReason: (reason: string) => void;
}

export const DateSection = ({
  plannedMeetingDate,
  initialDate,
  onDateChange,
  dateReason,
  setDateReason
}: DateSectionProps) => {
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date instanceof Date ? 
      date.toISOString().split('T')[0] : 
      new Date(date).toISOString().split('T')[0];
  };

  const isDateChanged = () => {
    if (initialDate === null && plannedMeetingDate === null) return false;
    if (initialDate === null && plannedMeetingDate !== null) return true;
    if (initialDate !== null && plannedMeetingDate === null) return true;
    if (initialDate && plannedMeetingDate) {
      const initialTime = initialDate instanceof Date ? 
        initialDate.getTime() : new Date(initialDate).getTime();
      const currentTime = plannedMeetingDate instanceof Date ? 
        plannedMeetingDate.getTime() : new Date(plannedMeetingDate).getTime();
      return initialTime !== currentTime;
    }
    return false;
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="meetingDate">תאריך פגישה מתוכנן</Label>
      <Input
        id="meetingDate"
        type="date"
        value={formatDateForInput(plannedMeetingDate)}
        onChange={(e) => {
          const value = e.target.value;
          onDateChange(value ? new Date(value) : null);
        }}
      />
      
      {isDateChanged() && (
        <div className="mt-2 space-y-2">
          <Label htmlFor="dateReason">סיבת שינוי תאריך</Label>
          <Textarea
            id="dateReason"
            value={dateReason}
            onChange={(e) => setDateReason(e.target.value)}
            placeholder="הסבר סיבת השינוי (לא חובה)"
            rows={2}
          />
        </div>
      )}
    </div>
  );
};
