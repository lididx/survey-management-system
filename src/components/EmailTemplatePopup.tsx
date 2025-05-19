
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Audit } from "@/types/types";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface EmailTemplatePopupProps {
  audit: Audit;
  open: boolean;
  onClose: () => void;
}

export const EmailTemplatePopup = ({
  audit,
  open,
  onClose
}: EmailTemplatePopupProps) => {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Generate email template based on contacts and their gender
  useEffect(() => {
    if (!audit) return;
    
    // Set email subject - new format as requested
    setEmailSubject(`תיאום סקר ${audit.clientName || audit.name}`);
    
    // Set email body based on contact gender and count
    if (audit.contacts && audit.contacts.length > 0) {
      const contacts = audit.contacts;
      
      // Gender count
      const males = contacts.filter(c => c.gender === "male");
      const females = contacts.filter(c => c.gender === "female");
      
      let greeting = "";
      if (contacts.length === 1) {
        // Single contact
        const contact = contacts[0];
        greeting = `היי ${contact.fullName}`;
        
        // Pronouns will be used later in the text based on gender
      } else {
        // Multiple contacts
        if (males.length > 0 && females.length > 0) {
          // Mixed gender
          greeting = `היי ${males[0].fullName} וכן ${females[0].fullName}`;
          if (contacts.length > 2) {
            greeting += " ושאר אנשי הקשר";
          }
        } else if (males.length > 0) {
          // All males
          greeting = `היי ${males[0].fullName}`;
          if (males.length > 1) {
            greeting += ` וכן ${males.length > 2 ? "שאר אנשי הקשר" : males[1].fullName}`;
          }
        } else {
          // All females
          greeting = `היי ${females[0].fullName}`;
          if (females.length > 1) {
            greeting += ` וכן ${females.length > 2 ? "שאר אנשות הקשר" : females[1].fullName}`;
          }
        }
      }
      
      // Determine second person pronouns for the email
      let secondPersonPronoun = "אתה";
      let secondPersonPlural = "אתם";
      let invitationText = "מוזמן";
      
      if (contacts.length === 1 && contacts[0].gender === "female") {
        secondPersonPronoun = "את";
        invitationText = "מוזמנת";
      } else if (contacts.length > 1) {
        if (females.length > 0 && males.length === 0) {
          secondPersonPlural = "אתן";
          invitationText = "מוזמנות";
        } else {
          invitationText = "מוזמנים";
        }
      }
      
      setEmailBody(`${greeting},
שמי לידור, סוקר אפליקציה מטעם חברת Citadel העובדת עם חברת ${audit.clientName || audit.name}.
קיבלתי את המייל של${contacts.length > 1 ? "כם" : "ך"} על מנת לתאם ${contacts.length > 1 ? "מולכם" : "מולך"} סקר אפליקציה למערכת ${audit.clientName || audit.name}.

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
3. במידה ו${contacts.length > 1 ? secondPersonPlural : secondPersonPronoun} חושב${contacts.length > 1 ? "ים" : ""} שיש גורמים נוספים שיכולים לעזור במהלך הפגישה ${contacts.length > 1 ? "אתם" : "אתה"} ${invitationText} להוסיף אותם להתכתבות.
4. אשמח ש${contacts.length > 1 ? "תשלחו" : "תשלח"} לי מספר תאריכים בהם ${contacts.length > 1 ? "אתם זמינים" : `${secondPersonPronoun} זמינ${contacts[0].gender === "female" ? "ה" : ""}`} לביצוע הפגישה.
תודה רבה!`);
    }
  }, [audit]);

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
