
import { Audit } from '@/types/types';
import { toast } from 'sonner';

// פונקציה לשליחת התראה למייל (דמה)
export const sendNotificationEmail = (to: string, subject: string, body: string) => {
  console.log(`Email notification:
    To: ${to}
    Subject: ${subject}
    Body: ${body}
  `);
};

// פונקציה לבדיקת סקרים שתקועים במשך זמן רב
export const checkForStalledAudits = (currentAudits: Audit[]) => {
  const stalledStatuses = [
    "נשלח מייל תיאום למנהל מערכת",
    "שאלות השלמה מול מנהל מערכת"
  ];
  
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const stalledAudits = currentAudits.filter(audit => {
    if (!stalledStatuses.includes(audit.currentStatus)) {
      return false;
    }
    
    const latestStatusUpdate = audit.statusLog
      .filter(log => log.newStatus === audit.currentStatus)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (!latestStatusUpdate) return false;
    
    const logDate = new Date(latestStatusUpdate.timestamp);
    return logDate < sevenDaysAgo;
  });
  
  stalledAudits.forEach(audit => {
    sendNotificationEmail(
      audit.ownerId,
      `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
      `שלום,
      
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
אנא בדקו את מצב הסקר ועדכנו את הסטטוס במערכת.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
    );
    
    sendNotificationEmail(
      "chen@example.com",
      `תזכורת: סקר ${audit.name} בסטטוס ${audit.currentStatus}`,
      `שלום חן,
      
זוהי תזכורת אוטומטית לגבי הסקר "${audit.name}" שנמצא בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים.
הסקר שייך ל${audit.ownerId}.

בברכה,
מערכת ניהול סקרי אבטחת מידע`
    );
    
    toast.info(`נשלחה תזכורת אוטומטית לסקר "${audit.name}"`, {
      description: `הסקר בסטטוס "${audit.currentStatus}" כבר למעלה מ-7 ימים`
    });
  });
};
