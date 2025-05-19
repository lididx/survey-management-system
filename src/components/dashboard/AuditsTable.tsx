
import { useState } from "react";
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
import { X, Edit, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Audit, StatusType } from "@/types/types";
import { StatusLogView } from "@/components/StatusLogView";

interface AuditsTableProps {
  audits: Audit[];
  userRole: string;
  canEdit: (auditOwnerId: string) => boolean;
  canDelete: (auditOwnerId: string) => boolean;
  onEditAudit: (audit: Audit) => void;
  onDeleteAudit: (id: string) => void;
  onEmailClick: (audit: Audit) => void;
}

export const AuditsTable = ({ 
  audits, 
  userRole, 
  canEdit, 
  canDelete,
  onEditAudit, 
  onDeleteAudit,
  onEmailClick
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
  
  const getStatusBadge = (status: StatusType) => {
    let variant = "outline";
    
    switch (status) {
      case "התקבל":
        variant = "secondary";
        break;
      case "בכתיבה":
      case "נקבע":
        variant = "default";
        break;
      case "בבקרה":
        variant = "destructive";
        break;
      case "הסתיים":
        variant = "secondary";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>שם הסקר</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>תאריך פגישה</TableHead>
          <TableHead>אנשי קשר</TableHead>
          <TableHead>תאריך קבלה</TableHead>
          {userRole === "מנהלת" && <TableHead>בעלים</TableHead>}
          <TableHead>פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audits.length > 0 ? (
          audits.map((audit) => (
            <>
              <TableRow key={audit.id}>
                <TableCell className="font-medium">{audit.name}</TableCell>
                <TableCell>
                  {getStatusBadge(audit.currentStatus)}
                </TableCell>
                <TableCell>
                  {audit.plannedMeetingDate ? formatDate(audit.plannedMeetingDate) : "לא נקבע"}
                </TableCell>
                <TableCell>{audit.contacts.length}</TableCell>
                <TableCell>{formatDate(audit.receivedDate)}</TableCell>
                {userRole === "מנהלת" && <TableCell>{audit.ownerId.split('@')[0]}</TableCell>}
                <TableCell>
                  <div className="flex gap-2">
                    {canEdit(audit.ownerId) && (
                      <Button variant="outline" size="sm" onClick={() => onEditAudit(audit)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onEmailClick(audit)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExpandLog(audit.id)}>
                      {expandedAuditId === audit.id ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    {canDelete(audit.ownerId) && (
                      <Button variant="destructive" size="sm" onClick={() => onDeleteAudit(audit.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              {expandedAuditId === audit.id && (
                <TableRow>
                  <TableCell colSpan={userRole === "מנהלת" ? 7 : 6} className="p-4 bg-gray-50">
                    <StatusLogView statusLog={audit.statusLog} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={userRole === "מנהלת" ? 7 : 6} className="text-center py-4">
              לא נמצאו סקרים
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
