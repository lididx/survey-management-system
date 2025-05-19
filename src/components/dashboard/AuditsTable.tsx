
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
  Trash2 
} from "lucide-react";
import { Audit, StatusType } from "@/types/types";
import { StatusLogView } from "@/components/StatusLogView";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    
    return <Badge variant={variant as any}>{status}</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader>
          <TableRow className="bg-gray-50 text-gray-700">
            <TableHead className="p-4 font-medium">שם הסקר</TableHead>
            <TableHead className="p-4 font-medium">סטטוס</TableHead>
            <TableHead className="p-4 font-medium">תאריך פגישה</TableHead>
            <TableHead className="p-4 font-medium">אנשי קשר</TableHead>
            <TableHead className="p-4 font-medium">תאריך קבלה</TableHead>
            {userRole === "מנהלת" && <TableHead className="p-4 font-medium">בעלים</TableHead>}
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
                    {getStatusBadge(audit.currentStatus)}
                  </TableCell>
                  <TableCell className="p-4">
                    {audit.plannedMeetingDate ? formatDate(audit.plannedMeetingDate) : "לא נקבע"}
                  </TableCell>
                  <TableCell className="p-4">{audit.contacts?.length || 0}</TableCell>
                  <TableCell className="p-4">{formatDate(audit.receivedDate)}</TableCell>
                  {userRole === "מנהלת" && <TableCell className="p-4">{audit.ownerId.split('@')[0]}</TableCell>}
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
                    <TableCell colSpan={userRole === "מנהלת" ? 7 : 6} className="p-4 bg-gray-50">
                      <StatusLogView statusLog={audit.statusLog} />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
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
    </div>
  );
};
