
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScheduledDateSectionProps {
  scheduledDate: Date | null;
  onScheduledDateChange: (date: Date | null) => void;
}

export const ScheduledDateSection = ({
  scheduledDate,
  onScheduledDateChange
}: ScheduledDateSectionProps) => {
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date instanceof Date ? 
      date.toISOString().split('T')[0] : 
      new Date(date).toISOString().split('T')[0];
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="scheduledDate">תאריך קביעת הסקר</Label>
      <Input
        id="scheduledDate"
        type="date"
        value={formatDateForInput(scheduledDate)}
        onChange={(e) => {
          const value = e.target.value;
          onScheduledDateChange(value ? new Date(value) : null);
        }}
        placeholder="בחר תאריך קביעת הסקר (לא חובה)"
      />
    </div>
  );
};
