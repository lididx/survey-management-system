
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Audit } from "@/types/types";
import { Copy, Mail } from "lucide-react";
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
    
    // Get the current user details
    const userData = localStorage.getItem("user");
    const currentUser = userData ? JSON.parse(userData) : {};
    const surveyorName = currentUser.name || "";
    
    // Determine surveyor gender based on name - Lidor is male, Moran is female
    const surveyorGender = currentUser.name === "מורן" ? "female" : "male";
    
    // Set email subject - new format as requested
    setEmailSubject(`קביעת סקר אפליקציה למערכת ${audit.name} - ${audit.clientName}`);
    
    // Set email body based on contact gender and count
    if (audit.contacts && audit.contacts.length > 0) {
      const contacts = audit.contacts;
      
      // Gender count
      const males = contacts.filter(c => c.gender === "male");
      const females = contacts.filter(c => c.gender === "female");
      
      let greeting = "";
      let secondPersonPronoun = "אתה";
      let secondPersonPlural = "אתם";
      let invitationText = "מוזמן";
      let thinkText = "חושב";
      let sendText = "תשלח";
      let availableText = "זמין";
      
      if (contacts.length === 1) {
        // Single contact - get first name only
        const contact = contacts[0];
        const firstName = contact.firstName || contact.fullName.split(' ')[0];
        greeting = `היי ${firstName}`;
        
        if (contact.gender === "female") {
          secondPersonPronoun = "את";
          invitationText = "מוזמנת";
          thinkText = "חושבת";
          sendText = "תשלחי";
          availableText = "זמינה";
        }
      } else {
        // Multiple contacts
        const firstNames = contacts.map(c => {
          return c.firstName || c.fullName.split(' ')[0];
        });
        
        if (contacts.length === 2) {
          greeting = `היי ${firstNames.join(' ו')}`;
        } else {
          greeting = `היי ${firstNames[0]}, ${firstNames[1]} ושאר אנשי הקשר`;
        }
        
        // Plurals
        if (females.length > 0 && males.length === 0) {
          secondPersonPlural = "אתן";
          invitationText = "מוזמנות";
          thinkText = "חושבות";
          sendText = "תשלחו";
          availableText = "זמינות";
        } else {
          invitationText = "מוזמנים";
          thinkText = "חושבים";
          sendText = "תשלחו";
          availableText = "זמינים";
        }
      }
      
      // Determine surveyor text (male/female) - corrected for Lidor
      const surveyorText = surveyorGender === "female" ? "סוקרת" : "סוקר";
      
      setEmailBody(`${greeting},
שמי ${surveyorName}, ${surveyorText} אפליקציה מטעם חברת Citadel העובדת עם חברת ${audit.clientName}.
קיבלתי את המייל של${contacts.length > 1 ? "כם" : "ך"} על מנת לתאם ${contacts.length > 1 ? "מולכם" : "מולך"} סקר אפליקציה למערכת ${audit.name}.

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
3. במידה ו${contacts.length > 1 ? secondPersonPlural : secondPersonPronoun} ${thinkText} שיש גורמים נוספים שיכולים לעזור במהלך הפגישה ${contacts.length > 1 ? "אתם" : "אתה"} ${invitationText} להוסיף אותם להתכתבות.
4. אשמח ש${sendText} לי מספר תאריכים בהם ${contacts.length > 1 ? `${secondPersonPlural} ${availableText}` : `${secondPersonPronoun} ${availableText}`} לביצוע הפגישה.
תודה רבה!`);
    }
  }, [audit]);

  // Copy email content to clipboard
  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailSubject);
    toast.success("כותרת המייל הועתקה ללוח");
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailBody);
    toast.success("תוכן המייל הועתק ללוח");
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(`${emailSubject}\n\n${emailBody}`);
    toast.success("כל תוכן המייל הועתק ללוח");
  };

  // Send email via default email client (Outlook) - Fixed version
  const handleSendEmail = () => {
    if (!audit.contacts || audit.contacts.length === 0) {
      toast.error("לא נמצאו אנשי קשר לשליחת המייל");
      return;
    }

    console.log("Starting email send process...");
    
    // Get recipient email addresses
    const recipients = audit.contacts.map(contact => contact.email).filter(email => email).join(";");
    
    if (!recipients) {
      toast.error("לא נמצאו כתובות מייל תקינות");
      return;
    }

    console.log("Recipients:", recipients);

    try {
      // Try the direct mailto approach first
      const mailtoUrl = `mailto:${recipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      console.log("Mailto URL length:", mailtoUrl.length);
      
      // Check if URL is too long (most browsers limit around 2000 characters)
      if (mailtoUrl.length > 2000) {
        console.log("URL too long, using fallback method");
        // Fallback: copy everything to clipboard
        const fullContent = `נמענים: ${recipients}\nנושא: ${emailSubject}\n\n${emailBody}`;
        navigator.clipboard.writeText(fullContent);
        toast.success("המייל ארוך מדי לפתיחה אוטומטית - התוכן הועתק ללוח");
        return;
      }

      // Create a temporary link element
      const tempLink = document.createElement('a');
      tempLink.href = mailtoUrl;
      tempLink.style.display = 'none';
      document.body.appendChild(tempLink);
      
      console.log("Attempting to open email client...");
      tempLink.click();
      
      // Clean up
      document.body.removeChild(tempLink);
      
      toast.success("המייל נפתח ביישום המייל שלך");
      
    } catch (error) {
      console.error("Error opening email client:", error);
      // Fallback - copy to clipboard if mailto fails
      const fullContent = `נמענים: ${recipients}\nנושא: ${emailSubject}\n\n${emailBody}`;
      navigator.clipboard.writeText(fullContent);
      toast.error("לא ניתן לפתוח יישום מייל - התוכן הועתק ללוח");
    }
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
              <h3 className="font-semibold">כותרת המייל:</h3>
              <Button variant="outline" size="sm" onClick={handleCopySubject} className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                העתק כותרת
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
          
          <div className="flex justify-end gap-3 mt-6">
            <Button onClick={handleCopyAll} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              העתק הכל ללוח
            </Button>
            
            <Button 
              onClick={handleSendEmail}
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" />
              פתח ב-Outlook
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
