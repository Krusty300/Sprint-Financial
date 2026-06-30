import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from './useRealtime';

export type NotificationCategory = 'transaction' | 'budget' | 'account' | 'goal' | 'system' | 'reminder' | 'alert';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type Notification = {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  archived: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
  }>;
  autoHide?: boolean;
  duration?: number;
  persistent?: boolean;
  metadata?: Record<string, any>;
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { subscribe, emit } = useRealtime();
  
  // Track recent events to prevent duplicates
  const [recentEvents, setRecentEvents] = useState<Map<string, number>>(new Map());

  // Check if an event is a recent duplicate
  const isRecentDuplicate = useCallback((eventType: string, action: string, data?: any) => {
    const eventKey = `${eventType}-${action}-${JSON.stringify(data || {})}`;
    const now = Date.now();
    const lastEventTime = recentEvents.get(eventKey);
    
    // If same event occurred within 1 second, it's a duplicate
    if (lastEventTime && (now - lastEventTime) < 1000) {
      console.log('Recent duplicate event detected:', eventKey);
      return true;
    }
    
    // Update the recent events map
    setRecentEvents(prev => {
      const updated = new Map(prev);
      updated.set(eventKey, now);
      
      // Clean up old events (older than 5 seconds)
      const cutoff = now - 5000;
      for (const [key, timestamp] of updated.entries()) {
        if (timestamp < cutoff) {
          updated.delete(key);
        }
      }
      
      return updated;
    });
    
    return false;
  }, [recentEvents]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        // Convert timestamp strings back to numbers if needed
        const normalized = parsed.map((n: any) => ({
          ...n,
          timestamp: typeof n.timestamp === 'string' ? parseInt(n.timestamp) : n.timestamp
        }));
        
        // Remove duplicates based on title, message, and type
        const deduplicated = normalized.filter((notification: Notification, index: number, self: Notification[]) => 
          index === self.findIndex((n: Notification) => 
            n.title === notification.title && 
            n.message === notification.message && 
            n.type === notification.type
          )
        );
        
        // Ensure all IDs are unique by regenerating any duplicates
        const uniqueIds = new Set();
        const withUniqueIds = deduplicated.map((notification: Notification) => {
          let newId = notification.id;
          let counter = 1;
          while (uniqueIds.has(newId)) {
            newId = `${notification.id}-${counter}`;
            counter++;
          }
          uniqueIds.add(newId);
          return { ...notification, id: newId };
        });
        
        setNotifications(withUniqueIds);
      } else {
        // Clear any existing sample flags and start fresh
        localStorage.removeItem('finance-tracker-samples-added');
        
        // Add some sample notifications for testing with unique IDs
        const sampleNotifications: Notification[] = [
          {
            id: 'sample-1-welcome',
            type: 'info',
            category: 'system',
            priority: 'low',
            title: 'Welcome to Finance Tracker',
            message: 'Start managing your finances efficiently',
            timestamp: Date.now() - 3600000, // 1 hour ago
            read: false,
            archived: false,
            autoHide: false,
            duration: 5000
          },
          {
            id: 'sample-2-transaction',
            type: 'success',
            category: 'transaction',
            priority: 'medium',
            title: 'Sample Transaction',
            message: 'A sample transaction was added',
            timestamp: Date.now() - 7200000, // 2 hours ago
            read: false,
            archived: false,
            autoHide: false,
            duration: 5000
          },
          {
            id: 'sample-3-budget',
            type: 'warning',
            category: 'budget',
            priority: 'high',
            title: 'Budget Reminder',
            message: 'Check your budget spending',
            timestamp: Date.now() - 86400000, // 1 day ago
            read: true,
            archived: false,
            autoHide: false,
            duration: 6000
          }
        ];
        setNotifications(sampleNotifications);
        // Save sample notifications to localStorage
        localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
        localStorage.setItem('finance-tracker-samples-added', 'true');
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
      // Clear corrupted data and start fresh
      localStorage.removeItem('notifications');
      localStorage.removeItem('finance-tracker-samples-added');
    }
  }, []);

  // Listen for real-time notification events
  useEffect(() => {
    const unsubscribe = subscribe('notification', (event) => {
      console.log('Real-time notification event:', event);
      
      // Reload notifications from localStorage to get the latest state
      setTimeout(() => {
        try {
          const savedNotifications = localStorage.getItem('notifications');
          if (savedNotifications) {
            const parsed = JSON.parse(savedNotifications);
            const normalized = parsed.map((n: any) => ({
              ...n,
              timestamp: typeof n.timestamp === 'string' ? parseInt(n.timestamp) : n.timestamp
            }));
            setNotifications(normalized);
          }
        } catch (error) {
          console.error('Failed to reload notifications:', error);
        }
      }, 100); // Small delay to ensure localStorage is updated
    });

    return unsubscribe;
  }, [subscribe]);

  // Remove a notification
  const removeNotification = useCallback((id: string) => {
    const notificationToRemove = notifications.find(n => n.id === id);
    
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
    
    // Emit real-time event after state update (deferred)
    if (notificationToRemove) {
      setTimeout(() => {
        emit({
          type: 'notification',
          action: 'delete',
          data: {
            notification: notificationToRemove,
            action: 'remove',
            timestamp: new Date().toISOString()
          }
        });
      }, 0);
    }
  }, [notifications, emit]);

  // Add a new notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
      archived: false,
      autoHide: false, // Disable auto-hide so notifications stay in the system
      duration: notification.type === 'error' ? 8000 : notification.type === 'warning' ? 6000 : 5000,
      ...notification
    };

    setNotifications(prev => {
      // Check if a notification with the same content already exists to prevent duplicates
      const existingDuplicate = prev.find(n => 
        n.title === newNotification.title && 
        n.message === newNotification.message && 
        n.type === newNotification.type
      );
      
      // Also check if there's a recent notification (within 2 seconds) to prevent rapid duplicates
      const recentDuplicate = prev.find(n => 
        n.title === newNotification.title && 
        n.type === newNotification.type &&
        (Date.now() - n.timestamp) < 2000 // Within 2 seconds
      );
      
      if (existingDuplicate || recentDuplicate) {
        console.warn('Duplicate notification prevented:', newNotification.title);
        return prev; // Don't add duplicate
      }
      
      const updated = [newNotification, ...prev];
      // Save to localStorage for persistence
      try {
        const savedNotifications = localStorage.getItem('notifications');
        const existing = savedNotifications ? JSON.parse(savedNotifications) : [];
        
        // Check for duplicates in localStorage too
        const hasDuplicate = existing.some((n: any) => 
          n.title === newNotification.title && 
          n.message === newNotification.message && 
          n.type === newNotification.type
        );
        
        // Also check for recent duplicates in localStorage
        const hasRecentDuplicate = existing.some((n: any) => 
          n.title === newNotification.title && 
          n.type === newNotification.type &&
          (Date.now() - (n.timestamp || 0)) < 2000 // Within 2 seconds
        );
        
        if (!hasDuplicate && !hasRecentDuplicate) {
          const finalUpdated = [newNotification, ...existing.slice(0, 99)]; // Keep max 100
          localStorage.setItem('notifications', JSON.stringify(finalUpdated));
          
          // Emit real-time event for new notification (deferred)
          setTimeout(() => {
            emit({
              type: 'notification',
              action: 'create',
              data: {
                notification: newNotification,
                action: 'add',
                timestamp: new Date().toISOString()
              }
            });
          }, 0);
        }
      } catch (error) {
        console.error('Failed to save notification to localStorage:', error);
      }
      return updated;
    });

    // Auto-hide if specified
    if (newNotification.autoHide && newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }, [removeNotification, emit]);

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    const notificationToMark = notifications.find(n => n.id === id);
    
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
    
    // Emit real-time event for marking as read (deferred)
    if (notificationToMark && !notificationToMark.read) {
      setTimeout(() => {
        emit({
          type: 'notification',
          action: 'update',
          data: {
            notification: { ...notificationToMark, read: true },
            action: 'mark_read',
            timestamp: new Date().toISOString()
          }
        });
      }, 0);
    }
  }, [notifications, emit]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      // Update localStorage immediately
      try {
        localStorage.setItem('notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to update notifications in localStorage:', error);
      }
      return updated;
    });
    
    // Emit real-time event for marking all as read (deferred)
    if (unreadNotifications.length > 0) {
      setTimeout(() => {
        emit({
          type: 'notification',
          action: 'update',
          data: {
            notifications: unreadNotifications,
            action: 'mark_all_read',
            timestamp: new Date().toISOString()
          }
        });
      }, 0);
    }
  }, [notifications, emit]);

  // Clear all notifications
  const clearAll = useCallback(() => {
    const notificationsToClear = [...notifications];
    
    setNotifications(prev => {
      // Clear from localStorage
      try {
        localStorage.setItem('notifications', JSON.stringify([]));
      } catch (error) {
        console.error('Failed to clear notifications from localStorage:', error);
      }
      return [];
    });
    
    // Emit real-time event for clearing all notifications (deferred)
    if (notificationsToClear.length > 0) {
      setTimeout(() => {
        emit({
          type: 'notification',
          action: 'delete',
          data: {
            notifications: notificationsToClear,
            action: 'clear_all',
            timestamp: new Date().toISOString()
          }
        });
      }, 0);
    }
  }, [notifications, emit]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Listen for real-time events and create notifications
  useEffect(() => {
    const unsubscribers = [
      subscribe('transaction', (event) => {
        const { action, data } = event;
        
        console.log('Processing transaction event:', action, data);
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'transaction',
              priority: 'medium',
              title: 'Transaction Added',
              message: `${data?.description || 'New transaction'} of ${data?.type === 'income' ? '+' : '-'}$${data?.amount?.toFixed(2) || '0.00'}`,
              action: {
                label: 'View',
                onClick: () => {
                  // Navigate to transactions page
                  window.location.href = '/transactions';
                }
              }
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'transaction',
              priority: 'low',
              title: 'Transaction Updated',
              message: `${data?.description || 'Transaction'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'transaction',
              priority: 'medium',
              title: 'Transaction Deleted',
              message: `${data?.description || 'Transaction'} has been deleted`,
              duration: 3000
            });
            break;
        }
      }),

      subscribe('budget', (event) => {
        const { action, data } = event;
        
        console.log('Processing budget event:', action, data);
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'budget',
              priority: 'medium',
              title: 'Budget Created',
              message: `Budget for ${data?.category || 'category'} has been created`
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'budget',
              priority: 'low',
              title: 'Budget Updated',
              message: `Budget for ${data?.category || 'category'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'budget',
              priority: 'medium',
              title: 'Budget Deleted',
              message: `Budget for ${data?.category || 'category'} has been deleted`
            });
            break;
        }
      }),

      subscribe('account', (event) => {
        const { action, data } = event;
        
        console.log('Processing account event:', action, data);
        
        switch (action) {
          case 'create':
            addNotification({
              type: 'success',
              category: 'account',
              priority: 'medium',
              title: 'Account Added',
              message: `${data?.name || 'New account'} has been added`
            });
            break;
            
          case 'update':
            addNotification({
              type: 'info',
              category: 'account',
              priority: 'low',
              title: 'Account Updated',
              message: `${data?.name || 'Account'} has been updated`
            });
            break;
            
          case 'delete':
            addNotification({
              type: 'warning',
              category: 'account',
              priority: 'medium',
              title: 'Account Deleted',
              message: `${data?.name || 'Account'} has been deleted`
            });
            break;
        }
      })
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, addNotification]);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}

// Hook for budget warnings and alerts
export function useBudgetAlerts() {
  const { addNotification } = useNotifications();
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('budget', (event) => {
      const { action, data } = event;
      
      if (action === 'update' && data) {
        // Check if budget is over limit
        if (data.percentageUsed > 100) {
          addNotification({
            type: 'error',
            category: 'alert',
            priority: 'critical',
            title: 'Budget Exceeded!',
            message: `${data.category} budget is ${data.percentageUsed.toFixed(0)}% used (${data.spent > data.budget ? '$' + (data.spent - data.budget).toFixed(2) + ' over' : 'at limit'})`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Budget',
              onClick: () => {
                window.location.href = '/budgets';
              }
            }
          });
        } else if (data.percentageUsed >= 80) {
          addNotification({
            type: 'warning',
            category: 'alert',
            priority: 'high',
            title: 'Budget Warning',
            message: `${data.category} budget is ${data.percentageUsed.toFixed(0)}% used`,
            duration: 8000
          });
        }
      }
    });

    return unsubscribe;
  }, [subscribe, addNotification]);
}

// Hook for account balance alerts
export function useAccountAlerts() {
  const { addNotification } = useNotifications();
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('account', (event) => {
      const { action, data } = event;
      
      if (action === 'update' && data) {
        // Low balance warning
        if (data.balance < 100 && data.balance >= 0) {
          addNotification({
            type: 'warning',
            category: 'alert',
            priority: 'high',
            title: 'Low Balance',
            message: `${data.name} has a low balance of $${data.balance.toFixed(2)}`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Account',
              onClick: () => {
                window.location.href = '/accounts';
              }
            }
          });
        }
        
        // Negative balance alert
        if (data.balance < 0) {
          addNotification({
            type: 'error',
            category: 'alert',
            priority: 'critical',
            title: 'Negative Balance',
            message: `${data.name} has a negative balance of $${Math.abs(data.balance).toFixed(2)}`,
            autoHide: false,
            persistent: true,
            action: {
              label: 'View Account',
              onClick: () => {
                window.location.href = '/accounts';
              }
            }
          });
        }
      }
    });

    return unsubscribe;
  }, [subscribe, addNotification]);
}
