
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
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  Mail,
  Trash2,
  UserCircle 
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

interface AuditsTableProps {
  audits: Audit[];
  userRole: string;
  canEdit: (auditOwnerId: string) => boolean;
  canDelete: (auditOwnerId: string) => boolean;
  onEditAudit: (audit: Audit) => void;
  onDeleteAudit: (id: string) => void;
  onEmailClick: (audit: Audit) => void;
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

export const AuditsTable = ({ 
  audits, 
  userRole, 
  canEdit, 
  canDelete,
  onEditAudit, 
  onDeleteAudit,
  onEmailClick,
  onStatusChange
}: AuditsTableProps) => {
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  const handleExpandLog = (auditId: string) => {
    if (expandedAuditId === auditId) {
      setExpandedAuditId(null);
    } else {
      setExpandedAuditId(auditId);
    }
  };

  const formatDate = (date: Date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("he-IL");
  };
  
  const getStatusBadge = (status: StatusType, audit: Audit) => {
    let variant = "outline";
    
    switch (status) {
      case "התקבל":
        variant = "secondary";
        break;
      case "נקבע":
        variant = "default";
        break;
      case "בכתיבה":
        variant = "default";
        break;
      case "בבקרה":
        variant = "destructive";
        break;
      case "הסתיים":
        variant = "secondary";
        break;
      case "שאלות השלמה מול מנהל מערכת":
        variant = "warning";
        break;
      case "נשלח מייל תיאום למנהל מערכת":
        variant = "outline";
        break;
      default:
        variant = "outline";
    }

    // Management users can only update to specific statuses
    if (userRole === "מנהלת" && !canEdit(audit.ownerId)) {
      return (
        <Select 
          value={status}
          onValueChange={(value: StatusType) => {
            if (value === "הסתיים" || value === "בבקרה") {
              onStatusChange(audit, value);
            } else {
              toast.error("מנהלים יכולים לעדכן רק לסטטוס 'הסתיים' או 'בבקרה'");
            }
          }}
          disabled={!canEdit(audit.ownerId) && userRole !== "מנהלת"}
        >
          <SelectTrigger className={`w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100 ${variant}`}>
            <Badge variant={variant as any}>{status}</Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="בבקרה">בבקרה</SelectItem>
            <SelectItem value="הסתיים">הסתיים</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    // Regular users can update to any status if they have edit permissions
    return (
      <Select 
        value={status}
        onValueChange={(value: StatusType) => onStatusChange(audit, value)}
        disabled={!canEdit(audit.ownerId)}
      >
        <SelectTrigger className="w-full px-2 py-1 h-auto bg-transparent border-0 hover:bg-gray-100">
          <Badge variant={variant as any}>{status}</Badge>
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
    <div className="overflow-x-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader>
          <TableRow className="bg-gray-50 text-gray-700">
            <TableHead className="p-4 font-medium">שם הסקר</TableHead>
            <TableHead className="p-4 font-medium">סטטוס</TableHead>
            <TableHead className="p-4 font-medium">שם לקוח</TableHead>
            <TableHead className="p-4 font-medium">תאריך פגישה</TableHead>
            <TableHead className="p-4 font-medium">יוצר הסקר</TableHead>
            <TableHead className="p-4 font-medium">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.length > 0 ? (
            audits.map((audit) => (
              <React.Fragment key={audit.id}>
                <TableRow className="hover:bg-gray-100 transition-colors">
                  <TableCell className="p-4 font-medium">{audit.name}</TableCell>
                  <TableCell className="p-4">
                    {getStatusBadge(audit.currentStatus, audit)}
                  </TableCell>
                  <TableCell className="p-4">{audit.clientName || "לא צוין"}</TableCell>
                  <TableCell className="p-4">
                    {audit.plannedMeetingDate ? formatDate(audit.plannedMeetingDate) : "לא נקבע"}
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex items-center gap-1">
                      <UserCircle className="h-4 w-4 text-gray-400" />
                      <span>{audit.ownerName || "לא ידוע"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="p-4">
                    <div className="flex gap-2">
                      {canEdit(audit.ownerId) && (
                        <Button variant="outline" size="sm" onClick={() => onEditAudit(audit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEmailClick(audit)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
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
                      {canDelete(audit.ownerId) && (
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
                    <TableCell colSpan={6} className="p-4 bg-gray-50">
                      <StatusLogView statusLog={audit.statusLog} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                לא נמצאו סקרים
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
