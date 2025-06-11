
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, ChevronDown, ChevronUp, Mail, Trash2 } from "lucide-react";
import { Audit } from "@/types/types";
import { ArchiveActions } from "./ArchiveActions";

interface TableActionsProps {
  audit: Audit;
  isArchive: boolean;
  canEdit: (auditOwnerId: string) => boolean;
  canDelete: (auditOwnerId: string) => boolean;
  expandedAuditId: string | null;
  onEditAudit: (audit: Audit) => void;
  onEmailClick: (audit: Audit) => void;
  onDeleteAudit: (id: string) => void;
  onExpandLog: (auditId: string) => void;
  onDataChange?: () => void;
}

export const TableActions = ({ 
  audit, 
  isArchive, 
  canEdit, 
  canDelete,
  expandedAuditId,
  onEditAudit, 
  onEmailClick, 
  onDeleteAudit,
  onExpandLog,
  onDataChange
}: TableActionsProps) => {
  return (
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
        onClick={() => onExpandLog(audit.id)}
      >
        {expandedAuditId === audit.id ? 
          <ChevronUp className="h-4 w-4" /> : 
          <ChevronDown className="h-4 w-4" />
        }
      </Button>
      <ArchiveActions 
        audit={audit}
        isArchive={isArchive}
        canEdit={canEdit}
        onDataChange={onDataChange}
      />
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
  );
};
