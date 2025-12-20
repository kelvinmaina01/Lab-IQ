import { useState, useEffect } from 'react';
import { Bell, Check, MessageSquare, AtSign, Heart, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useServices } from '@/core/ServiceProvider';
import { Notification as NotificationType } from '@/core/interfaces';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const NotificationBell = () => {
  const { collaboration, auth } = useServices();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      subscribeToNotifications();
    }
  }, [currentUser]);

  const loadUser = async () => {
    const user = await auth.getUser();
    setCurrentUser(user);
  };

  const loadNotifications = async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await collaboration.getNotifications(currentUser.id);
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const subscribeToNotifications = () => {
    if (!currentUser) return;

    const channel = collaboration.subscribeToNotifications(
      currentUser.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.content,
            icon: '/logo.png',
            badge: '/logo.png'
          });
        }
      }
    );

    return () => channel?.unsubscribe();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await collaboration.markNotificationAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    await collaboration.markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDismiss = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: NotificationType['type']) => {
    switch (type) {
      case 'mention':
        return <AtSign className="h-4 w-4 text-blue-500" />;
      case 'reply':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'reaction':
        return <Heart className="h-4 w-4 text-pink-500" />;
      case 'dm':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return format(date, 'MMM d');
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <Bell className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified about mentions, replies, and updates
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors cursor-pointer group relative",
                    !notification.is_read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!notification.is_read) handleMarkAsRead(notification.id);
                    if (notification.link) window.location.href = notification.link;
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium",
                          !notification.is_read && "font-semibold"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                      </p>
                      {!notification.is_read && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-xs text-primary font-medium">Unread</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
