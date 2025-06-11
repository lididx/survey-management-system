
import React from "react";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Audit, StatusType } from "@/types/types";
import { addToArchive, removeFromArchive } from "@/utils/archiveManager";
import { updateExistingAudit } from "@/utils/supabase";
import { getCurrentUser } from "@/utils/supabaseAuth";

interface ArchiveActionsProps {
  audit: Audit;
  isArchive: boolean;
  canEdit: (auditOwnerId: string) => boolean;
  onDataChange?: () => void;
}

export const ArchiveActions = ({ audit, isArchive, canEdit, onDataChange }: ArchiveActionsProps) => {
  const handleArchiveAudit = async () => {
    if (!canEdit(audit.ownerId)) {
      toast.error("אין לך הרשאה לארכב סקר זה");
      return;
    }
    
    try {
      const success = addToArchive(audit.id);
      if (success) {
        toast.success("הסקר הועבר לארכיון");
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error("שגיאה בהעברת הסקר לארכיון");
      }
    } catch (error) {
      console.error("[ArchiveActions] Error archiving audit:", error);
      toast.error("שגיאה בהעברת הסקר לארכיון");
    }
  };

  const handleRestoreAudit = async () => {
    if (!canEdit(audit.ownerId)) {
      toast.error("אין לך הרשאה להחזיר סקר זה");
      return;
    }
    
    try {
      const archiveRemoved = removeFromArchive(audit.id);
      
      let statusUpdated = true;
      if (audit.currentStatus === "הסתיים") {
        const currentUser = getCurrentUser();
        if (currentUser) {
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
          
          await updateExistingAudit(audit.id, updatedAudit, currentUser.name);
        }
      }
      
      if (archiveRemoved && statusUpdated) {
        toast.success("הסקר הוחזר לרשימת הסקרים הפעילים");
        if (onDataChange) {
          onDataChange();
        }
      } else {
        toast.error("שגיאה בהחזרת הסקר");
      }
    } catch (error) {
      console.error("[ArchiveActions] Error restoring audit:", error);
      toast.error("שגיאה בהחזרת הסקר");
    }
  };

  if (isArchive) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleRestoreAudit}
        disabled={!canEdit(audit.ownerId)}
        title="החזר לרשימת הסקרים הפעילים"
      >
        <ArchiveRestore className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleArchiveAudit}
      disabled={!canEdit(audit.ownerId)}
      title="העבר לארכיון"
    >
      <Archive className="h-4 w-4" />
    </Button>
  );
};
