
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface NotificationControlsProps {
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
  notificationCount: number;
}

export const NotificationControls = ({ 
  onClearAll, 
  onDeleteNotification, 
  notificationCount 
}: NotificationControlsProps) => {
  const handleClearAll = () => {
    if (notificationCount === 0) {
      toast.info("אין התראות למחיקה");
      return;
    }
    
    onClearAll();
    toast.success("כל ההתראות נמחקו");
  };

  return (
    <div className="p-4 border-b">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">התראות ({notificationCount})</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={notificationCount === 0}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          נקה הכל
        </Button>
      </div>
    </div>
  );
};
