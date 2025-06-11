
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  Mail,
  Trash2,
  UserCircle,
  MessageCircle,
  Archive,
  ArchiveRestore,
  Phone
} from "lucide-react";
import { Audit, StatusType } from "@/types/types";
import { StatusLogView } from "@/components/StatusLogView";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { addToArchive, removeFromArchive } from "@/utils/archiveManager";
import { updateExistingAudit } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/supabaseAuth";

interface AuditsTableProps {
  audits: Audit[];
  userRole: string;
  canEdit: (auditOwnerId: string) => boolean;
  canDelete: (auditOwnerId: string) => boolean;
  onEditAudit: (audit: Audit) => void;
  onDeleteAudit: (id: string) => void;
  onEmailClick: (audit: Audit) => void;
  onStatusChange: (audit: Audit, newStatus: StatusType) => void;
  isArchive?: boolean;
  onDataChange?: () => void;
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

export const AuditsTable = ({ 
  audits, 
  userRole, 
  canEdit, 
  canDelete,
  onEditAudit, 
  onDeleteAudit,
  onEmailClick,
  onStatusChange,
  isArchive = false,
  onDataChange
}: AuditsTableProps) => {
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const handleExpandLog = (auditId: string) => {
    if (expandedAuditId === auditId) {
      setExpandedAuditId(null);
    } else {
      setExpandedAuditId(auditId);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("he-IL");
  };

  // Get the appropriate date to display - prioritize scheduledDate, then plannedMeetingDate
  const getDisplayDate = (audit: Audit) => {
    if (audit.scheduledDate) {
      return formatDate(audit.scheduledDate);
    }
    if (audit.plannedMeetingDate) {
      return formatDate(audit.plannedMeetingDate);
    }
    return "לא נקבע";
  };

  const handleWhatsAppClick = (phone: string, contactName: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`נפתח WhatsApp עבור ${contactName}`);
  };

  const handlePhoneClick = (phone: string, contactName: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // הוספת קידומת ישראל אם אין
    let formattedPhone = cleanPhone;
    if (cleanPhone.startsWith('0')) {
      formattedPhone = '972' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('972')) {
      formattedPhone = '972' + cleanPhone;
    }
    
    const telUrl = `tel:+${formattedPhone}`;
    window.location.href = telUrl;
    
    toast.success(`נפתח חייגן עבור ${contactName}`);
  };

  const handleArchiveAudit = async (audit: Audit) => {
    if (!canEdit(audit.ownerId)) {
      toast.error("אין לך הרשאה לארכב סקר זה");
      return;
    }
    
    try {
      // Add to archive without changing status
      const success = addToArchive(audit.id);
      if (success) {
        toast.success("הסקר הועבר לארכיון");
        // Call parent refresh without page reload
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error("שגיאה בהעברת הסקר לארכיון");
      }
    } catch (error) {
      console.error("[AuditsTable] Error archiving audit:", error);
      toast.error("שגיאה בהעברת הסקר לארכיון");
    }
  };

  const handleRestoreAudit = async (audit: Audit) => {
    if (!canEdit(audit.ownerId)) {
      toast.error("אין לך הרשאה להחזיר סקר זה");
      return;
    }
    
    try {
      // Remove from archive list
      const archiveRemoved = removeFromArchive(audit.id);
      
      // If the audit status is "הסתיים", we need to change it to make it active
      let statusUpdated = true;
      if (audit.currentStatus === "הסתיים") {
        // Update status to "בבקרה" to make it active again
        const currentUser = getCurrentUser();
        if (currentUser) {
          // Create updated audit with new status
          const updatedAudit = {
            ...audit,
            currentStatus: "בבקרה" as StatusType,
            statusLog: [{
              id: crypto.randomUUID(),
              timestamp: new Date(),
              oldStatus: audit.currentStatus,
              newStatus: "בבקרה" as StatusType,
              oldDate: null,
              newDate: null,
              reason: "החזרה מהארכיון",
              modifiedBy: currentUser.name
            }, ...audit.statusLog]
          };
          
          // Update in database
          await updateExistingAudit(audit.id, updatedAudit, currentUser.name);
        }
      }
      
      if (archiveRemoved && statusUpdated) {
        toast.success("הסקר הוחזר לרשימת הסקרים הפעילים");
        // Call parent refresh without page reload
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error("שגיאה בהחזרת הסקר");
      }
    } catch (error) {
      console.error("[AuditsTable] Error restoring audit:", error);
      toast.error("שגיאה בהחזרת הסקר");
    }
  };

  const handleStatusChangeLocal = (audit: Audit, newStatus: StatusType) => {
    // Call the parent handler for status change
    onStatusChange(audit, newStatus);
  };
  
  const getStatusBadge = (status: StatusType, audit: Audit) => {
    const colors = statusColorMap[status];
    
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

    // Allow status changes for managers with limited options
    if (userRole === "מנהלת" && !canEdit(audit.ownerId)) {
      return (
        <Select 
          value={status}
          onValueChange={(value: StatusType) => {
            if (value === "הסתיים" || value === "בבקרה") {
              handleStatusChangeLocal(audit, value);
            } else {
              toast.error("מנהלים יכולים לעדכן רק לסטטוס 'הסתיים' או 'בבקרה'");
            }
          }}
        >
          <SelectTrigger className="w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100">
            <span style={customBadgeStyle}>{status}</span>
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
        value={status}
        onValueChange={(value: StatusType) => handleStatusChangeLocal(audit, value)}
        disabled={!canEdit(audit.ownerId) && userRole !== "מנהלת"}
      >
        <SelectTrigger className="w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100">
          <span style={customBadgeStyle}>{status}</span>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="overflow-x-auto" dir="rtl">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader>
          <TableRow className="bg-gray-50 text-gray-700">
            <TableHead className="p-4 font-medium text-center">שם הסקר</TableHead>
            <TableHead className="p-4 font-medium text-center">סטטוס</TableHead>
            <TableHead className="p-4 font-medium text-center">שם לקוח</TableHead>
            <TableHead className="p-4 font-medium text-center">תאריך פגישה</TableHead>
            <TableHead className="p-4 font-medium text-center">יוצר הסקר</TableHead>
            <TableHead className="p-4 font-medium text-center">אנשי קשר</TableHead>
            <TableHead className="p-4 font-medium text-center">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.length > 0 ? (
            audits.map((audit) => (
              <React.Fragment key={audit.id}>
                <TableRow 
                  className="hover:bg-gray-100 transition-colors"
                  data-audit-id={audit.id}
                >
                  <TableCell className="p-4 font-medium text-center">{audit.name}</TableCell>
                  <TableCell className="p-4 text-center">
                    {getStatusBadge(audit.currentStatus, audit)}
                  </TableCell>
                  <TableCell className="p-4 text-center">{audit.clientName || "לא צוין"}</TableCell>
                  <TableCell className="p-4 text-center">
                    {getDisplayDate(audit)}
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <UserCircle className="h-4 w-4 text-gray-400" />
                      <span>{audit.ownerName || "לא ידוע"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-4 text-center">
                    <div className="flex flex-col gap-1">
                      {audit.contacts && audit.contacts.length > 0 ? (
                        audit.contacts.map((contact, index) => (
                          <div key={index} className="flex items-center justify-center gap-2">
                            <span className="text-sm">{contact.fullName}</span>
                            {contact.phone && (
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePhoneClick(contact.phone, contact.fullName)}
                                  className="h-6 w-6 p-0"
                                  title="התקשר"
                                >
                                  <Phone className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleWhatsAppClick(contact.phone, contact.fullName)}
                                  className="h-6 w-6 p-0"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3 w-3 text-green-600" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">אין אנשי קשר</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex justify-center gap-2">
                      {!isArchive && canEdit(audit.ownerId) && (
                        <Button variant="outline" size="sm" onClick={() => onEditAudit(audit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {!isArchive && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEmailClick(audit)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExpandLog(audit.id)}
                      >
                        {expandedAuditId === audit.id ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                      {isArchive ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRestoreAudit(audit)}
                          disabled={!canEdit(audit.ownerId)}
                          title="החזר לרשימת הסקרים הפעילים"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleArchiveAudit(audit)}
                          disabled={!canEdit(audit.ownerId)}
                          title="העבר לארכיון"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      {(isArchive || canDelete(audit.ownerId)) && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => onDeleteAudit(audit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                {expandedAuditId === audit.id && (
                  <TableRow>
                    <TableCell colSpan={7} className="p-4 bg-gray-50">
                      <StatusLogView statusLog={audit.statusLog} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-4">
                {isArchive ? "אין סקרים בארכיון" : "לא נמצאו סקרים"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
