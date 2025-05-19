
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Audit } from "@/types/types";

interface RecipientCountInputProps {
  audit: Audit;
  open: boolean;
  onCancel: () => void;
  onConfirm: (count: number) => void;
}

export const RecipientCountInput = ({ 
  audit, 
  open, 
  onCancel,
  onConfirm
}: RecipientCountInputProps) => {
  const [recipientCount, setRecipientCount] = useState<number>(
    audit.contacts?.length || 1
  );

  const handleConfirm = () => {
    onConfirm(recipientCount);
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>כמה אנשי קשר?</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientCount">מספר אנשי קשר שיקבלו את המייל</Label>
              <Input
                id="recipientCount"
                type="number"
                min={1}
                value={recipientCount}
                onChange={(e) => setRecipientCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center"
              />
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={onCancel}>
                ביטול
              </Button>
              <Button onClick={handleConfirm}>
                המשך
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
