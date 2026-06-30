'use client';

import { useState, useEffect } from 'react';
import { useNotifications, NotificationCategory, NotificationPriority } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Bell,
  Filter,
  Archive,
  Settings,
  Trash2,
  Clock,
  TrendingUp,
  CreditCard,
  Target,
  PiggyBank,
  AlertTriangle as AlertIcon,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const categoryIcons = {
  transaction: TrendingUp,
  budget: Target,
  account: CreditCard,
  goal: PiggyBank,
  system: Settings,
  reminder: Calendar,
  alert: AlertIcon,
};

const priorityColors = {
  low: 'border-l-muted',
  medium: 'border-l-info',
  high: 'border-l-warning',
  critical: 'border-l-destructive',
};

const notificationStyles = {
  success: 'bg-success/10 border-success/20 text-success dark:bg-success/5 dark:border-success/10 dark:text-success',
  error: 'bg-destructive/10 border-destructive/20 text-destructive dark:bg-destructive/5 dark:border-destructive/10 dark:text-destructive',
  warning: 'bg-warning/10 border-warning/20 text-warning dark:bg-warning/5 dark:border-warning/10 dark:text-warning',
  info: 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/5 dark:border-primary/10 dark:text-primary',
};

export function NotificationSystem() {
  const { resolvedTheme } = useTheme();
  const { notifications, removeNotification, markAsRead, markAllAsRead, clearAll, unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<NotificationPriority | 'all'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.notification-system')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotificationExpansion = (id: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.action?.onClick) {
      notification.action.onClick();
    }
    setShowDropdown(false);
  };

  const archiveNotification = (id: string) => {
    // This would need to be implemented in the useNotifications hook
    removeNotification(id);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
    if (selectedPriority !== 'all' && notification.priority !== selectedPriority) return false;
    if (!showArchived && notification.archived) return false;
    return true;
  });

  const visibleNotifications = filteredNotifications.slice(0, 10); // Show max 10 in dropdown

  return (
    <div className="notification-system relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-accent h-8 w-8 sm:h-8 sm:w-8"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] sm:text-xs p-0 min-w-[16px] sm:min-w-[20px]"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border rounded-lg shadow-lg z-50 max-h-[400px] sm:max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    markAllAsRead();
                  }}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearAll();
                  }}
                  className="text-xs"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {visibleNotifications.map((notification) => {
                  const Icon = notificationIcons[notification.type as NotificationType];
                  const isExpanded = expandedNotifications.has(notification.id);
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 transition-colors hover:bg-accent/50 cursor-pointer',
                        !notification.read && 'bg-accent/30',
                        notificationStyles[notification.type as NotificationType]
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-sm mt-1 opacity-90">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            
                            {notification.action && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.action?.onClick();
                                  setShowDropdown(false);
                                }}
                                className="text-xs h-6 px-2"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 10 && (
            <div className="p-3 border-t text-center">
              <p className="text-xs text-muted-foreground">
                Showing {visibleNotifications.length} of {notifications.length} notifications
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Disabled toast notifications - using notification system instead
export function ToastNotifications() {
  // Return null to disable toast popups
  return null;
}
