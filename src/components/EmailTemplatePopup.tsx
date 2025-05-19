
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Audit } from "@/types/types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplatePopupProps {
  audit: Audit;
  recipientCount: number;
  open: boolean;
  onClose: () => void;
}

export const EmailTemplatePopup = ({
  audit,
  recipientCount,
  open,
  onClose
}: EmailTemplatePopupProps) => {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Generate email template based on the number of recipients
  useEffect(() => {
    if (!audit) return;
    
    // Set email subject
    setEmailSubject(`תיאום סקר אבטחה: ${audit.name}`);
    
    // Set email body based on recipient count
    if (recipientCount === 1 && audit.contacts && audit.contacts.length > 0) {
      const contact = audit.contacts[0];
      setEmailBody(`היי ${contact.fullName},
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
תודה רבה!`);
    } else if (recipientCount >= 2 && audit.contacts && audit.contacts.length > 0) {
      // For multiple recipients
      const firstContact = audit.contacts[0].fullName;
      const secondContact = audit.contacts.length > 1 ? audit.contacts[1].fullName : "נוספים";
      
      setEmailBody(`היי ${firstContact} וכן ${secondContact},
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
תודה רבה!`);
    }
  }, [audit, recipientCount]);

  // Copy email content to clipboard
  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailSubject);
    toast.success("נושא המייל הועתק ללוח");
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    toast.success("תוכן המייל הועתק ללוח");
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
    toast.success("כל תוכן המייל הועתק ללוח");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>תבנית מייל לתיאום סקר</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">נושא המייל:</h3>
              <Button variant="outline" size="sm" onClick={handleCopySubject} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                העתק נושא
              </Button>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border">
              {emailSubject}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">תוכן המייל:</h3>
              <Button variant="outline" size="sm" onClick={handleCopyBody} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                העתק תוכן
              </Button>
            </div>
            <div className="bg-slate-50 p-3 rounded-md border whitespace-pre-wrap max-h-96 overflow-y-auto">
              {emailBody}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button onClick={handleCopyAll} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              העתק הכל ללוח
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
