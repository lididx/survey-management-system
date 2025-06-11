
import React from "react";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Audit, StatusType } from "@/types/types";
import { addToArchive, removeFromArchive } from "@/utils/archiveManager";
import { updateAuditStatusInDb } from "@/utils/supabase";
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
      const currentUser = getCurrentUser();
      if (!currentUser) {
        toast.error("משתמש לא מחובר");
        return;
      }

      // Remove from archive first
      const archiveRemoved = removeFromArchive(audit.id);
      
      // If status is "הסתיים", change it to "בבקרה"
      let statusUpdated = true;
      if (audit.currentStatus === "הסתיים") {
        const reason = "החזרה מהארכיון";
        statusUpdated = await updateAuditStatusInDb(audit.id, "בבקרה" as StatusType, reason, currentUser.name);
      }
      
      if (archiveRemoved && statusUpdated) {
        toast.success("הסקר הוחזר לרשימת הסקרים הפעילים");
        // Call onDataChange to refresh the data
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
