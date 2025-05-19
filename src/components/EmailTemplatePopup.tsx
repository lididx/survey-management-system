
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Audit } from "@/types/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { Copy } from "lucide-react";

interface EmailTemplatePopupProps {
  audit: Audit;
  open: boolean;
  onClose: () => void;
}

export const EmailTemplatePopup = ({ audit, open, onClose }: EmailTemplatePopupProps) => {
  const [recipientCount, setRecipientCount] = useState(audit.contacts.length);
  
  const emailSubject = `תיאום סקר אבטחה: ${audit.name}`;
  const emailBody = `שלום,

במסגרת עבודתנו על סקר אבטחת מידע למערכת "${audit.name}", אנו צריכים לתאם פגישה עם מנהל המערכת ובעלי תפקידים רלוונטיים.

הסקר כולל:
1. הצגת המערכת ותהליכים עסקיים עיקריים
2. ממשקים חיצוניים
3. תהליכי עבודה מרכזיים
4. אמצעי אבטחה קיימים
5. הדגמת המערכת

הפגישה צפויה להימשך כשעה.
נשמח לתיאום בהקדם.

בברכה,
${JSON.parse(localStorage.getItem("user") || '{"name":""}').name}
צוות אבטחת מידע`;

  const copyToClipboard = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    toast.success(`ה${type === 'subject' ? 'נושא' : 'תוכן'} הועתק ללוח`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>תבנית מייל לתיאום סקר</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipients">מספר נמענים</Label>
              <div className="text-sm text-gray-500">
                {recipientCount} {recipientCount === 1 ? "נמען" : "נמענים"}
              </div>
            </div>
            <Input
              id="recipients"
              type="number"
              min="1"
              value={recipientCount}
              onChange={(e) => setRecipientCount(parseInt(e.target.value) || 1)}
            />
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">נושא</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => copyToClipboard(emailSubject, 'subject')}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                העתק
              </Button>
            </div>
            <Input id="subject" value={emailSubject} readOnly />
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">תוכן המייל</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => copyToClipboard(emailBody, 'body')}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                העתק
              </Button>
            </div>
            <Textarea
              id="body"
              value={emailBody}
              readOnly
              rows={12}
              className="font-mono text-sm"
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button type="button" onClick={onClose}>
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
