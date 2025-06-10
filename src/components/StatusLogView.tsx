
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
      <div className="flex items-center justify-end gap-2">
        <Badge variant="outline" className="text-xs">{newStatus}</Badge>
        <ArrowLeft className="h-3 w-3" />
        <Badge variant="outline" className="text-xs">{oldStatus}</Badge>
        <span>השתנה מ</span>
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
        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="font-medium">{formatDate(newDate)}</span>
            <ArrowLeft className="h-3 w-3" />
            <span className="text-gray-500">{formatDate(oldDate)}</span>
            <span>תאריך השתנה מ</span>
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
        <div className="space-y-6">
          {sortedLog.map((log, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="space-y-3">
                {/* שורת תאריך */}
                <div className="flex items-center justify-end gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <span className="font-medium">{formatDate(log.timestamp)}</span>
                  <Calendar className="h-4 w-4" />
                </div>

                {/* שורת שינוי סטטוס */}
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-right text-sm font-medium text-blue-800 mb-2">
                    שינוי סטטוס:
                  </div>
                  <div className="text-right">
                    {formatStatusChange(log.oldStatus, log.newStatus)}
                  </div>
                </div>

                {/* שורת שינוי תאריך */}
                {(log.oldDate || log.newDate) && (
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-right text-sm font-medium text-green-800 mb-2">
                      שינוי תאריך פגישה:
                    </div>
                    <div className="text-right">
                      {formatDateChange(log.oldDate, log.newDate)}
                    </div>
                  </div>
                )}

                {/* שורת סיבה */}
                {log.reason && (
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="flex items-start justify-end gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-800 mb-1">סיבה:</div>
                        <div className="text-sm text-yellow-700">{log.reason}</div>
                      </div>
                      <MessageSquare className="h-4 w-4 mt-0.5 text-yellow-600" />
                    </div>
                  </div>
                )}

                {/* שורת בוצע על ידי */}
                <div className="bg-purple-50 p-3 rounded">
                  <div className="flex items-center justify-end gap-2 text-sm">
                    <span className="font-medium text-purple-700">{log.modifiedBy}</span>
                    <span className="text-purple-600">:בוצע על ידי</span>
                    <User className="h-4 w-4 text-purple-600" />
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
