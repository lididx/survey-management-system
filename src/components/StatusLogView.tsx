
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
    return (
      <div className="flex items-center gap-2 text-right">
        <span>השתנה מ</span>
        <Badge variant="outline" className="text-xs">{oldStatus}</Badge>
        <ArrowLeft className="h-3 w-3" />
        <Badge variant="outline" className="text-xs">{newStatus}</Badge>
      </div>
    );
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
      return (
        <div className="text-right text-sm">
          <div>תאריך השתנה:</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">{formatDate(oldDate)}</span>
            <ArrowLeft className="h-3 w-3" />
            <span className="font-medium">{formatDate(newDate)}</span>
          </div>
        </div>
      );
    }
    
    return null;
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
        <div className="space-y-4">
          {sortedLog.map((log, index) => (
            <div key={index} className="border-r-2 border-blue-200 pr-4 pb-4">
              <div className="grid grid-cols-1 gap-3">
                {/* תאריך */}
                <div className="flex items-center gap-2 text-right text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(log.timestamp)}</span>
                </div>

                {/* שינוי סטטוס */}
                <div className="text-right">
                  <div className="font-medium text-sm mb-1">שינוי סטטוס:</div>
                  {formatStatusChange(log.oldStatus, log.newStatus)}
                </div>

                {/* שינוי תאריך */}
                {(log.oldDate || log.newDate) && (
                  <div className="text-right">
                    <div className="font-medium text-sm mb-1">שינוי תאריך פגישה:</div>
                    {formatDateChange(log.oldDate, log.newDate)}
                  </div>
                )}

                {/* סיבה */}
                {log.reason && (
                  <div className="text-right">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">סיבה:</div>
                        <div className="text-sm text-gray-700 mt-1">{log.reason}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* בוצע על ידי */}
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>בוצע על ידי: <span className="font-medium">{log.modifiedBy}</span></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
