
import React, { useState } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { UserCircle } from "lucide-react";
import { Audit, StatusType } from "@/types/types";
import { StatusLogView } from "@/components/StatusLogView";
import { AuditsTableHeader } from "./table/TableHeader";
import { ContactActions } from "./table/ContactActions";
import { StatusBadge } from "./table/StatusBadge";
import { TableActions } from "./table/TableActions";

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

  const getDisplayDate = (audit: Audit) => {
    if (audit.scheduledDate) {
      return formatDate(audit.scheduledDate);
    }
    if (audit.plannedMeetingDate) {
      return formatDate(audit.plannedMeetingDate);
    }
    return "לא נקבע";
  };

  return (
    <div className="overflow-x-auto" dir="rtl">
      <Table className="min-w-full divide-y divide-gray-200">
        <AuditsTableHeader />
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
                    <StatusBadge 
                      audit={audit}
                      userRole={userRole}
                      canEdit={canEdit}
                      onStatusChange={onStatusChange}
                    />
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
                    <ContactActions contacts={audit.contacts} />
                  </TableCell>
                  <TableCell className="p-4">
                    <TableActions 
                      audit={audit}
                      isArchive={isArchive}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      expandedAuditId={expandedAuditId}
                      onEditAudit={onEditAudit}
                      onEmailClick={onEmailClick}
                      onDeleteAudit={onDeleteAudit}
                      onExpandLog={handleExpandLog}
                      onDataChange={onDataChange}
                    />
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
