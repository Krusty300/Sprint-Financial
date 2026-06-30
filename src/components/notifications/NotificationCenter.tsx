'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const { notifications } = useNotifications();
  const { resolvedTheme } = useTheme();
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* Notification Bell with Badge - Count Only */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "relative h-8 w-8 p-0 cursor-default",
          "transition-all duration-200 hover:scale-110",
          resolvedTheme === 'dark'
            ? "hover:bg-gray-800"
            : "hover:bg-gray-100"
        )}
        title={`${unreadCount} unread notifications`}
      >
        <Bell className={cn(
          "h-4 w-4 transition-colors duration-200",
          resolvedTheme === 'dark'
            ? "text-gray-300"
            : "text-gray-700"
        )} />
        {unreadCount > 0 && (
          <Badge 
            className={cn(
              "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 animate-pulse",
              "transition-all duration-200",
              resolvedTheme === 'dark'
                ? "bg-white text-black border-white/30 shadow-white/20"
                : "bg-black text-white border-black/30 shadow-black/20"
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
}
