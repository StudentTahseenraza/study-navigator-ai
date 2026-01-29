import { useState } from 'react';
import { Bell, Check, X, Clock, AlertTriangle, FileText, CheckSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification, NotificationType } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<NotificationType, typeof Bell> = {
  deadline: Clock,
  reminder: Bell,
  task: CheckSquare,
  document: FileText,
  info: Info,
  success: Check,
  warning: AlertTriangle,
};

const typeColors: Record<NotificationType, string> = {
  deadline: 'text-red-400',
  reminder: 'text-blue-400',
  task: 'text-green-400',
  document: 'text-purple-400',
  info: 'text-gray-400',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
};

const priorityStyles: Record<string, string> = {
  urgent: 'border-l-4 border-l-red-500 bg-red-500/5',
  high: 'border-l-4 border-l-orange-500 bg-orange-500/5',
  normal: '',
  low: 'opacity-75',
};

export const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    loadingNotifications,
    markAsRead, 
    markAllAsRead, 
    dismissNotification 
  } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read_at) {
      await markAsRead.mutateAsync(notification.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0 glass-card border-border" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-display font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead.mutateAsync()}
              disabled={markAllAsRead.isPending}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-[400px]">
          {loadingNotifications ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified about deadlines and updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type];
                const iconColor = typeColors[notification.type];
                const priorityStyle = priorityStyles[notification.priority];
                const isUnread = !notification.read_at;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-secondary/50 transition-colors cursor-pointer relative group ${priorityStyle} ${
                      isUnread ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-lg bg-secondary flex-shrink-0 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm ${isUnread ? 'font-medium' : ''}`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Dismiss button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification.mutateAsync(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
