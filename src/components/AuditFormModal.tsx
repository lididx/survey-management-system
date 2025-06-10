
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuditForm } from '@/components/AuditForm';
import { Audit, User } from '@/types/types';

interface AuditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit?: Audit;
  onSubmit: (audit: Partial<Audit>) => void;
  mode: "create" | "edit";
  currentUser: User | null;
}

export const AuditFormModal: React.FC<AuditFormModalProps> = ({
  isOpen,
  onClose,
  audit,
  onSubmit,
  mode,
  currentUser,
}) => {
  const handleSubmit = (auditData: Partial<Audit>) => {
    onSubmit(auditData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">
            {mode === "create" ? "צור סקר חדש" : "ערוך סקר"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <AuditForm
            audit={audit}
            onSubmit={handleSubmit}
            onCancel={onClose}
            mode={mode}
            currentUser={currentUser}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
