
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContactForm } from "@/components/ContactForm";
import { Audit, StatusType, Contact, StatusChange } from "@/types/types";
import { toast } from "sonner";

interface AuditFormProps {
  audit?: Audit;
  onSubmit: (audit: Partial<Audit>) => void;
  onCancel: () => void;
  mode: "create" | "edit";
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

export const AuditForm = ({ audit, onSubmit, onCancel, mode }: AuditFormProps) => {
  const [formData, setFormData] = useState<Partial<Audit>>({
    name: "",
    description: "",
    contacts: [],
    receivedDate: new Date(),
    plannedMeetingDate: null,
    currentStatus: "התקבל",
    statusLog: [],
    ownerId: JSON.parse(localStorage.getItem("user") || "{}").id || ""
  });
  
  const [statusReason, setStatusReason] = useState("");
  const [dateReason, setDateReason] = useState("");
  const [initialStatus, setInitialStatus] = useState<StatusType | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  useEffect(() => {
    if (audit && mode === "edit") {
      setFormData({
        ...audit
      });
      setInitialStatus(audit.currentStatus);
      setInitialDate(audit.plannedMeetingDate);
    }
  }, [audit, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      toast.error("יש להזין שם סקר");
      return;
    }
    
    if (mode === "edit") {
      // Check if status was changed
      if (initialStatus !== formData.currentStatus) {
        if (!statusReason) {
          toast.error("יש להזין סיבה לשינוי סטטוס");
          return;
        }
        
        // Add status change log
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          oldStatus: initialStatus,
          newStatus: formData.currentStatus as StatusType,
          oldDate: null,
          newDate: null,
          reason: statusReason
        };
        
        formData.statusLog = [...(formData.statusLog || []), statusChange];
      }
      
      // Check if date was changed
      if (
        (initialDate !== null && formData.plannedMeetingDate === null) || 
        (initialDate === null && formData.plannedMeetingDate !== null) ||
        (initialDate && formData.plannedMeetingDate && 
          initialDate.getTime() !== new Date(formData.plannedMeetingDate).getTime())
      ) {
        if (!dateReason) {
          toast.error("יש להזין סיבה לשינוי תאריך");
          return;
        }
        
        // Add date change log
        const dateChange: StatusChange = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          oldStatus: null,
          newStatus: null as any,
          oldDate: initialDate,
          newDate: formData.plannedMeetingDate,
          reason: dateReason
        };
        
        formData.statusLog = [...(formData.statusLog || []), dateChange];
      }
    }
    
    // For new audits, set receivedDate to now
    if (mode === "create") {
      formData.id = crypto.randomUUID();
      formData.receivedDate = new Date();
      formData.statusLog = [{
        id: crypto.randomUUID(),
        timestamp: new Date(),
        oldStatus: null,
        newStatus: "התקבל",
        oldDate: null,
        newDate: null,
        reason: "יצירת סקר"
      }];
    }
    
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof Audit, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  const handleContactsChange = (contacts: Contact[]) => {
    setFormData({
      ...formData,
      contacts
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">שם הסקר *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="הזן את שם הסקר"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">תיאור</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="הזן תיאור קצר"
            rows={3}
          />
        </div>

        {mode === "edit" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">סטטוס</Label>
                <Select
                  value={formData.currentStatus}
                  onValueChange={(value) => handleInputChange("currentStatus", value)}
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
                
                {initialStatus !== formData.currentStatus && (
                  <div className="mt-2 space-y-2">
                    <Label htmlFor="statusReason">סיבת שינוי סטטוס *</Label>
                    <Textarea
                      id="statusReason"
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="הסבר סיבת השינוי"
                      rows={2}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetingDate">תאריך פגישה מתוכנן</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  value={formData.plannedMeetingDate ? new Date(formData.plannedMeetingDate).toISOString().split('T')[0] : ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange("plannedMeetingDate", value ? new Date(value) : null);
                  }}
                />
                
                {((initialDate !== formData.plannedMeetingDate) && 
                  (initialDate || formData.plannedMeetingDate)) && (
                  <div className="mt-2 space-y-2">
                    <Label htmlFor="dateReason">סיבת שינוי תאריך *</Label>
                    <Textarea
                      id="dateReason"
                      value={dateReason}
                      onChange={(e) => setDateReason(e.target.value)}
                      placeholder="הסבר סיבת השינוי"
                      rows={2}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        <ContactForm
          contacts={formData.contacts || []}
          setContacts={handleContactsChange}
        />
      </div>

      <div className="flex justify-end space-x-2 space-x-reverse">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit">
          {mode === "create" ? "צור סקר" : "שמור שינויים"}
        </Button>
      </div>
    </form>
  );
};
