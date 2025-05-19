
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
  recipientCount?: number;
}

export const EmailTemplatePopup = ({ 
  audit, 
  open, 
  onClose, 
  recipientCount 
}: EmailTemplatePopupProps) => {
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  
  // Default to first contact's name or use the actual count of contacts
  const actualRecipientCount = recipientCount || 
    (audit.contacts && audit.contacts.length > 0 ? audit.contacts.length : 1);
  
  const emailSubject = `תיאום סקר אבטחה: ${audit.name}`;
  
  // Generate email body based on recipient count
  const generateEmailBody = () => {
    const contactName = audit.contacts?.[0]?.fullName || "";
    const secondContactName = audit.contacts?.[1]?.fullName || "";
    
    if (actualRecipientCount > 1) {
      return `היי ${contactName} וכן ${secondContactName},
שמי לידור, סוקר אפליקציה מטעם חברת Citadel העובדת עם חברת ${audit.name}.
קיבלתי את המייל שלכם על מנת לתאם מולכם סקר אפליקציה למערכת ${audit.name}.

להלן הנושאים עליהם נעבור במהלך סקר האפליקציה על המערכת:
 • תיאור המערכת (מידע כללי על המערכת הכולל גם גרסאות שפות תכנות)
 • הזדהות למערכת (דרך ההזדהות למערכת, מדיניות סיסמאות, אופן ומיקום שמירת סיסמאות ועוד..)
 • ממשקים מול מערכות אחרות (ממשקים העובדים מול המערכת / דרכי ההתממשקות \\ אופן ההתממשקות – ירידה לפרטים טכניים)
 • משתמשים והרשאות (מעבר על סוגי ההרשאות והקבוצות במערכת, אופן הוספת הרשאות, ניהול קבוצות ועוד..)
 • ארכיטקטורה אפליקטיבית (שרתים, שמות שרתים, גרסאות מערכות הפעלה וגרסאות שירותים – שירותי Web/ מסד נתונים וכו')
 • עבודה מול בסיס הנתונים (משתמשים אפליקטיביים, סוגי שאילתות בבסיס הנתונים, הרשאות המשתמש האפליקטיבי ואופן שמירת פרטי זיהוי)
 • לוגים וחיווים (סוגי חיווים, זמן שמירה, מיקום ועוד..)
 • בדיקת קלטים (בדיקה האם קיימת ולידציה על הקלטים המתקבלים למערכת, בדיקה של מנגנוני העלאת קבצים למערכת במידה וקיים)
 • סביבות עבודה
 • תווך הצפנה של המערכת

כמה דגשים:
1. הסקר הינו סקר תשאולי בלבד.
2. במהלך הפגישה אצטרך לקחת תצלומי מסך מתוך המערכת לכן יש צורך בגישה מלאה למערכת ושרתיה בזמן הפגישה.
3. במידה ויש גורמים נוספים שיכולים לעזור במהלך הפגישה אתם מוזמנים להוסיף אותם להתכתבות.
4. אשמח שתשלחו לי מספר תאריכים בהם אתם זמינים לביצוע הפגישה.
תודה רבה!`;
    } else {
      return `היי ${contactName},
שמי לידור, סוקר אפליקציה מטעם חברת Citadel העובדת עם חברת ${audit.name}.
קיבלתי את המייל שלך על מנת לתאם מולך סקר אפליקציה למערכת ${audit.name}.

להלן הנושאים עליהם נעבור במהלך סקר האפליקציה על המערכת:
 • תיאור המערכת (מידע כללי על המערכת הכולל גם גרסאות שפות תכנות)
 • הזדהות למערכת (דרך ההזדהות למערכת, מדיניות סיסמאות, אופן ומיקום שמירת סיסמאות ועוד..)
 • ממשקים מול מערכות אחרות (ממשקים העובדים מול המערכת / דרכי ההתממשקות \\ אופן ההתממשקות – ירידה לפרטים טכניים)
 • משתמשים והרשאות (מעבר על סוגי ההרשאות והקבוצות במערכת, אופן הוספת הרשאות, ניהול קבוצות ועוד..)
 • ארכיטקטורה אפליקטיבית (שרתים, שמות שרתים, גרסאות מערכות הפעלה וגרסאות שירותים – שירותי Web/ מסד נתונים וכו')
 • עבודה מול בסיס הנתונים (משתמשים אפליקטיביים, סוגי שאילתות בבסיס הנתונים, הרשאות המשתמש האפליקטיבי ואופן שמירת פרטי זיהוי)
 • לוגים וחיווים (סוגי חיווים, זמן שמירה, מיקום ועוד..)
 • בדיקת קלטים (בדיקה האם קיימת ולידציה על הקלטים המתקבלים למערכת, בדיקה של מנגנוני העלאת קבצים למערכת במידה וקיים)
 • סביבות עבודה
 • תווך הצפנה של המערכת

כמה דגשים:
1. הסקר הינו סקר תשאולי בלבד.
2. במהלך הפגישה אצטרך לקחת תצלומי מסך מתוך המערכת לכן יש צורך בגישה מלאה למערכת ושרתיה בזמן הפגישה.
3. במידה ואתה חושב שיש גורמים נוספים שיכולים לעזור במהלך הפגישה אתה מוזמן להוסיף אותם להתכתבות.
4. אשמח ששלח לי מספר תאריכים בהם אתה זמין לביצוע הפגישה.
תודה רבה!`;
    }
  };

  const emailBody = generateEmailBody();

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
