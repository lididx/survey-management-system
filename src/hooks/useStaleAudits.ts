
import { useState, useEffect } from 'react';
import { Audit } from '@/types/types';
import { toast } from 'sonner';

export const useStaleAudits = (audits: Audit[]) => {
  useEffect(() => {
    const checkStaleAudits = () => {
      const staleDays = 7; // סף של 7 ימים
      const now = new Date();
      const staleThreshold = new Date(now.setDate(now.getDate() - staleDays));
      
      audits.forEach(audit => {
        const statusLog = audit.statusLog;
        if (!statusLog || statusLog.length === 0) return;
        
        // שליפת השינוי האחרון בסטטוס
        const latestChange = [...statusLog].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];
        
        const lastChangeDate = new Date(latestChange.timestamp);
        
        // בדיקה אם הסטטוס הוא אחד מאלה שצריך לנטר ונשאר קפוא
        if (
          (audit.currentStatus === "נשלח מייל תיאום למנהל מערכת" || 
           audit.currentStatus === "שאלות השלמה מול מנהל מערכת") && 
          lastChangeDate < staleThreshold
        ) {
          // באפליקציה אמיתית, היינו שולחים כאן מייל
          // בינתיים, נציג הודעת toast
          toast.info(
            `תזכורת: סטטוס סקר '${audit.name}' לא השתנה`,
            { 
              description: `הסטטוס של הסקר '${audit.name}' עדיין ב-${audit.currentStatus} מעל 7 ימים. אנא עדכן/י בהקדם.`,
              duration: 10000
            }
          );
        }
      });
    };
    
    // בדיקה פעם אחת בטעינה ואז הגדרת בדיקה יומית
    // באפליקציה אמיתית, זה יהיה תהליך מתוזמן בצד השרת
    checkStaleAudits();
    const interval = setInterval(checkStaleAudits, 24 * 60 * 60 * 1000); // פעם ביום
    
    return () => clearInterval(interval);
  }, [audits]);
};
