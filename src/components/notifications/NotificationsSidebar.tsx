
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  const notificationCount = staleAudits.length;

  const getNotificationIcon = (status: string) => {
    switch (status) {
      case 'בכתיבה':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'בבקרה':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationText = (audit: any) => {
    const timeAgo = formatDistanceToNow(new Date(audit.lastUpdate || audit.receivedDate), {
      addSuffix: true,
      locale: he
    });
    
    return `סקר ${audit.clientName} בסטטוס "${audit.currentStatus}" כבר ${timeAgo}`;
  };

  const handleNotificationClick = (auditId: string) => {
    // Navigate to dashboard first
    navigate("/dashboard");
    
    // Use setTimeout to ensure the navigation completes first
    setTimeout(() => {
      if (onNotificationClick) {
        onNotificationClick(auditId);
      }
      
      // Try to scroll to the audit row
      const auditElement = document.querySelector(`[data-audit-id="${auditId}"]`);
      if (auditElement) {
        auditElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        auditElement.classList.add('bg-yellow-100', 'transition-colors', 'duration-3000');
        setTimeout(() => {
          auditElement.classList.remove('bg-yellow-100');
        }, 3000);
      }
    }, 100);
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
      <SheetContent side="right" className="w-80" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-right">
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
                    {getNotificationIcon(audit.currentStatus)}
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-foreground">
                        {audit.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getNotificationText(audit)}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {audit.currentStatus}
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
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-xs"
                  onClick={() => handleNotificationClick(audit.id)}
                >
                  עבור לסקר
                </Button>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSidebar;
