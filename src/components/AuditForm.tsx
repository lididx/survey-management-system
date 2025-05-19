
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContactForm } from "@/components/ContactForm";
import { Audit, StatusType, Contact, StatusChange, User } from "@/types/types";
import { toast } from "sonner";
import { StatusSection } from "@/components/audit-form/StatusSection";
import { DateSection } from "@/components/audit-form/DateSection";
import { ClientNameSection } from "@/components/audit-form/ClientNameSection";

interface AuditFormProps {
  audit?: Audit;
  onSubmit: (audit: Partial<Audit>) => void;
  onCancel: () => void;
  mode: "create" | "edit";
  currentUser: User | null;
}

export const AuditForm = ({ audit, onSubmit, onCancel, mode, currentUser }: AuditFormProps) => {
  const [formData, setFormData] = useState<Partial<Audit>>({
    name: "",
    description: "",
    clientName: "",
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
    
    if (!formData.clientName) {
      toast.error("יש להזין שם לקוח");
      return;
    }
    
    if (formData.contacts && formData.contacts.length === 0) {
      toast.error("יש להוסיף לפחות איש קשר אחד");
      return;
    }

    if (!currentUser) {
      toast.error("משתמש לא מחובר");
      return;
    }
    
    if (mode === "edit") {
      // Check if status was changed - now reason is optional
      if (initialStatus !== formData.currentStatus) {
        // Add status change log with user who made the change
        const statusChange: StatusChange = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          oldStatus: initialStatus,
          newStatus: formData.currentStatus as StatusType,
          oldDate: null,
          newDate: null,
          reason: statusReason || "עדכון סטטוס", // Default reason if empty
          modifiedBy: currentUser.name
        };
        
        formData.statusLog = [...(formData.statusLog || []), statusChange];
      }
      
      // Check if date was changed - now reason is optional
      if ((initialDate !== formData.plannedMeetingDate) && (initialDate || formData.plannedMeetingDate)) {
        // Add date change log with user who made the change
        const dateChange: StatusChange = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          oldStatus: null,
          newStatus: null as any,
          oldDate: initialDate,
          newDate: formData.plannedMeetingDate,
          reason: dateReason || "עדכון תאריך", // Default reason if empty
          modifiedBy: currentUser.name
        };
        
        formData.statusLog = [...(formData.statusLog || []), dateChange];
      }
    }
    
    // For new audits, set receivedDate to now and create initial status log
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
        reason: "יצירת סקר",
        modifiedBy: currentUser.name
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
        
        <ClientNameSection 
          clientName={formData.clientName || ""}
          onClientNameChange={(name) => handleInputChange("clientName", name)}
        />
        
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatusSection
              currentStatus={formData.currentStatus as StatusType}
              initialStatus={initialStatus}
              onStatusChange={(status) => handleInputChange("currentStatus", status)}
              statusReason={statusReason}
              setStatusReason={setStatusReason}
            />

            <DateSection
              plannedMeetingDate={formData.plannedMeetingDate}
              initialDate={initialDate}
              onDateChange={(date) => handleInputChange("plannedMeetingDate", date)}
              dateReason={dateReason}
              setDateReason={setDateReason}
            />
          </div>
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
