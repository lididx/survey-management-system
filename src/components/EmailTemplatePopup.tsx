
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Audit } from "@/types/types";
import { toast } from "sonner";
import { Clipboard, Check } from "lucide-react";

interface EmailTemplatePopupProps {
  audit: Audit;
  open: boolean;
  onClose: () => void;
}

export const EmailTemplatePopup = ({ audit, open, onClose }: EmailTemplatePopupProps) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  
  const emailSubject = `תיאום סקר אבטחה: ${audit.name}`;
  
  const emailBody = `שלום ${audit.contacts?.[0]?.fullName || ""},

בהמשך לפנייתך, נדרש לבצע סקר אבטחת מידע למערכת ${audit.name}.

אשמח לתאם פגישה לצורך היכרות עם המערכת והבנת הצרכים. להלן מספר תאריכים אפשריים:
1. יום א', XX/XX בשעה HH:MM
2. יום ב', XX/XX בשעה HH:MM
3. יום ג', XX/XX בשעה HH:MM

אודה לבחירת מועד מתאים מהרשימה או הצעת מועד חלופי.

בנוסף, אשמח אם תוכל/י לספק:
1. שם מלא ותפקיד של אנשי קשר רלוונטיים שישתתפו בפגישה
2. תיאור קצר של המערכת והפונקציונליות שלה
3. מסמכים רלוונטיים (אם יש) שיעזרו להבין את המערכת טרם הפגישה

לכל שאלה או בקשה נוספת, אני זמין/ה.

בברכה,
${JSON.parse(localStorage.getItem("user") || "{}")?.name || "שם הבודק"}
יועץ/ת אבטחת מידע`;

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(emailSubject);
      setCopiedSubject(true);
      toast.success("נושא המייל הועתק בהצלחה");
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch (err) {
      toast.error("שגיאה בהעתקת נושא המייל");
    }
  };

  const handleCopyBody = async () => {
    try {
      await navigator.clipboard.writeText(emailBody);
      setCopiedBody(true);
      toast.success("תוכן המייל הועתק בהצלחה");
      setTimeout(() => setCopiedBody(false), 2000);
    } catch (err) {
      toast.error("שגיאה בהעתקת תוכן המייל");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl">תבנית מייל לתיאום פגישה</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">נושא:</h3>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={handleCopySubject}
              >
                {copiedSubject ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                העתק נושא
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md">{emailSubject}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">תוכן:</h3>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={handleCopyBody}
              >
                {copiedBody ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                העתק תוכן
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md whitespace-pre-line">{emailBody}</div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <Button onClick={onClose}>סגור</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
