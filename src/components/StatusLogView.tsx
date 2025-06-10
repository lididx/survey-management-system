
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft, Calendar, User, MessageSquare } from 'lucide-react';
import { StatusChange } from '@/types/types';

interface StatusLogViewProps {
  statusLog: StatusChange[];
}

export const StatusLogView: React.FC<StatusLogViewProps> = ({ statusLog }) => {
  const formatDate = (date: Date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("he-IL", {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStatusChange = (oldStatus: string | null, newStatus: string) => {
    if (!oldStatus) {
      return `נוצר בסטטוס: ${newStatus}`;
    }
    return `השתנה מ ${oldStatus} ← ${newStatus}`;
  };

  const formatDateChange = (oldDate: Date | null, newDate: Date | null) => {
    if (!oldDate && !newDate) return null;
    
    if (!oldDate && newDate) {
      return `נקבע תאריך: ${formatDate(newDate)}`;
    }
    
    if (oldDate && !newDate) {
      return `בוטל תאריך: ${formatDate(oldDate)}`;
    }
    
    if (oldDate && newDate) {
      return `תאריך השתנה מ ${formatDate(oldDate)} ← ${formatDate(newDate)}`;
    }
    
    return null;
  };

  const formatFullChangeDescription = (log: StatusChange) => {
    const parts = [];
    
    // שינוי סטטוס
    parts.push(formatStatusChange(log.oldStatus, log.newStatus));
    
    // שינוי תאריך אם קיים
    const dateChange = formatDateChange(log.oldDate, log.newDate);
    if (dateChange) {
      parts.push(dateChange);
    }
    
    // סיבה אם קיימת
    if (log.reason) {
      parts.push(`סיבה: ${log.reason}`);
    }
    
    // מי ביצע
    parts.push(`בוצע על ידי: ${log.modifiedBy}`);
    
    // תאריך השינוי
    parts.push(`בתאריך: ${formatDate(log.timestamp)}`);
    
    return parts.join(' • ');
  };

  if (!statusLog || statusLog.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        אין היסטוריית שינויים
      </div>
    );
  }

  const sortedLog = [...statusLog].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Clock className="h-4 w-4" />
          היסטוריית שינויים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedLog.map((log, index) => (
            <div 
              key={index} 
              className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-right text-sm leading-relaxed">
                {formatFullChangeDescription(log)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
