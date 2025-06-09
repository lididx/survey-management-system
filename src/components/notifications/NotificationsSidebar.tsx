
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, AlertTriangle, X } from 'lucide-react';
import { useStaleAudits } from '@/hooks/useStaleAudits';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface NotificationsSidebarProps {
  onNotificationClick?: (auditId: string) => void;
}

const NotificationsSidebar: React.FC<NotificationsSidebarProps> = ({ onNotificationClick }) => {
  const { staleAudits, dismissNotification } = useStaleAudits();
  
  const notificationCount = staleAudits.length;

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case 'בביצוע':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'ממתין לאישור':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationText = (audit: any) => {
    const timeAgo = formatDistanceToNow(new Date(audit.lastUpdate || audit.auditDate), {
      addSuffix: true,
      locale: he
    });
    
    return `סקר ${audit.clientName} בסטטוס "${audit.status}" כבר ${timeAgo}`;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            התראות ({notificationCount})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {staleAudits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>אין התראות חדשות</p>
            </div>
          ) : (
            staleAudits.map((audit) => (
              <div
                key={audit.id}
                className="border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    {getNotificationIcon(audit.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {audit.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getNotificationText(audit)}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {audit.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissNotification(audit.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {onNotificationClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-xs"
                    onClick={() => onNotificationClick(audit.id)}
                  >
                    עבור לסקר
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSidebar;
