import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from './useNotifications';
import { useNotificationSettings } from './useNotificationSettings';
import { useTransactions } from './useTransactions';
import { useBudgets } from './useBudgets';
import { useAccounts } from './useAccounts';

export type ScheduledNotification = {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  title: string;
  message: string;
  category: 'transaction' | 'budget' | 'account' | 'goal' | 'system' | 'reminder' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  time: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly (Sunday = 0)
  dayOfMonth?: number; // 1-31 for monthly
  lastTriggered?: number;
  nextTrigger?: number;
  data?: any; // Additional data for the notification
};

export type NotificationTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'transaction' | 'budget' | 'account' | 'goal' | 'system' | 'reminder' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  titleTemplate: string; // Template with placeholders like {{amount}}, {{category}}
  messageTemplate: string;
  conditions: {
    type: 'spending_threshold' | 'balance_threshold' | 'budget_usage' | 'transaction_count' | 'custom';
    threshold?: number;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    category?: string;
    account?: string;
  };
  enabled: boolean;
};

export function useNotificationScheduler() {
  const { addNotification } = useNotifications();
  const { settings } = useNotificationSettings();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { accounts } = useAccounts();
  
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationTemplates, setNotificationTemplates] = useState<NotificationTemplate[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load scheduled notifications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scheduled-notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        setScheduledNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }, []);

  // Load notification templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotificationTemplates(parsed);
      }
    } catch (error) {
      console.error('Failed to load notification templates:', error);
    }
  }, []);

  // Calculate next trigger time for scheduled notification
  const calculateNextTrigger = useCallback((scheduled: ScheduledNotification): number => {
    const now = new Date();
    const [hours, minutes] = scheduled.time.split(':').map(Number);
    
    let nextDate = new Date(now);
    nextDate.setHours(hours, minutes, 0, 0);

    switch (scheduled.type) {
      case 'daily':
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
        
      case 'weekly':
        if (scheduled.dayOfWeek !== undefined) {
          nextDate.setDate(nextDate.getDate() + ((scheduled.dayOfWeek - nextDate.getDay() + 7) % 7));
          if (nextDate <= now) {
            nextDate.setDate(nextDate.getDate() + 7);
          }
        }
        break;
        
      case 'monthly':
        if (scheduled.dayOfMonth !== undefined) {
          nextDate.setDate(scheduled.dayOfMonth);
          if (nextDate <= now) {
            nextDate.setMonth(nextDate.getMonth() + 1);
          }
        }
        break;
        
      case 'custom':
        // For custom, use the nextTrigger if set, otherwise default to daily
        if (scheduled.nextTrigger) {
          return scheduled.nextTrigger;
        }
        if (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
    }

    return nextDate.getTime();
  }, []);

  // Check and trigger scheduled notifications
  const checkScheduledNotifications = useCallback(() => {
    const now = Date.now();
    
    scheduledNotifications.forEach(scheduled => {
      if (!scheduled.enabled) return;
      
      const nextTrigger = calculateNextTrigger(scheduled);
      
      if (now >= nextTrigger && (!scheduled.lastTriggered || scheduled.lastTriggered < nextTrigger)) {
        // Trigger the notification
        addNotification({
          type: 'info',
          category: scheduled.category,
          priority: scheduled.priority,
          title: scheduled.title,
          message: scheduled.message,
          persistent: scheduled.priority === 'critical',
          metadata: { scheduled: true, scheduledId: scheduled.id },
        });

        // Update last triggered
        scheduled.lastTriggered = now;
        scheduled.nextTrigger = calculateNextTrigger(scheduled);
      }
    });

    // Save updated scheduled notifications
    localStorage.setItem('scheduled-notifications', JSON.stringify(scheduledNotifications));
  }, [scheduledNotifications, calculateNextTrigger, addNotification]);

  // Start the scheduler
  useEffect(() => {
    // Check every minute
    intervalRef.current = setInterval(checkScheduledNotifications, 60000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkScheduledNotifications]);

  // Add scheduled notification
  const addScheduledNotification = useCallback((notification: Omit<ScheduledNotification, 'id' | 'nextTrigger'>) => {
    const newScheduled: ScheduledNotification = {
      ...notification,
      id: crypto.randomUUID(),
      nextTrigger: calculateNextTrigger(notification as ScheduledNotification),
    };

    setScheduledNotifications(prev => [...prev, newScheduled]);
    
    try {
      localStorage.setItem('scheduled-notifications', JSON.stringify([...scheduledNotifications, newScheduled]));
    } catch (error) {
      console.error('Failed to save scheduled notification:', error);
    }

    return newScheduled.id;
  }, [calculateNextTrigger, scheduledNotifications]);

  // Remove scheduled notification
  const removeScheduledNotification = useCallback((id: string) => {
    const updated = scheduledNotifications.filter(n => n.id !== id);
    setScheduledNotifications(updated);
    
    try {
      localStorage.setItem('scheduled-notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove scheduled notification:', error);
    }
  }, [scheduledNotifications]);

  // Update scheduled notification
  const updateScheduledNotification = useCallback((id: string, updates: Partial<ScheduledNotification>) => {
    const updated = scheduledNotifications.map(n => 
      n.id === id ? { ...n, ...updates, nextTrigger: calculateNextTrigger({ ...n, ...updates }) } : n
    );
    setScheduledNotifications(updated);
    
    try {
      localStorage.setItem('scheduled-notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update scheduled notification:', error);
    }
  }, [scheduledNotifications, calculateNextTrigger]);

  // Generate daily summary
  const generateDailySummary = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = transactions.filter(t => 
      new Date(t.date) >= today && !t.deletedAt
    );

    const totalIncome = todayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = todayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;

    addNotification({
      type: netAmount >= 0 ? 'success' : 'warning',
      category: 'system',
      priority: 'medium',
      title: 'Daily Financial Summary',
      message: `Today: $${totalIncome.toFixed(2)} income, $${totalExpenses.toFixed(2)} expenses, Net: $${netAmount.toFixed(2)}`,
      autoHide: false,
      actions: [
        {
          label: 'View Details',
          onClick: () => {
            window.location.href = '/transactions';
          }
        }
      ],
    });
  }, [transactions, addNotification]);

  // Generate weekly report
  const generateWeeklyReport = useCallback(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekTransactions = transactions.filter(t => 
      new Date(t.date) >= weekAgo && !t.deletedAt
    );

    const totalIncome = weekTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = weekTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpenses;

    addNotification({
      type: netAmount >= 0 ? 'success' : 'warning',
      category: 'system',
      priority: 'medium',
      title: 'Weekly Financial Report',
      message: `This week: $${totalIncome.toFixed(2)} income, $${totalExpenses.toFixed(2)} expenses, Net: $${netAmount.toFixed(2)}`,
      autoHide: false,
      actions: [
        {
          label: 'View Report',
          onClick: () => {
            window.location.href = '/reports';
          }
        }
      ],
    });
  }, [transactions, addNotification]);

  // Check notification templates and trigger
  const checkNotificationTemplates = useCallback(() => {
    notificationTemplates.forEach(template => {
      if (!template.enabled) return;

      let shouldTrigger = false;
      let messageData: any = {};

      switch (template.conditions.type) {
        case 'spending_threshold':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todayExpenses = transactions
            .filter(t => t.type === 'expense' && new Date(t.date) >= today && !t.deletedAt)
            .reduce((sum, t) => sum + t.amount, 0);

          if (template.conditions.threshold && todayExpenses >= template.conditions.threshold) {
            shouldTrigger = true;
            messageData = { amount: todayExpenses.toFixed(2), threshold: template.conditions.threshold };
          }
          break;

        case 'budget_usage':
          const budget = budgets.find(b => b.category === template.conditions.category);
          if (budget && template.conditions.threshold) {
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            
            const monthExpenses = transactions
              .filter(t => 
                t.type === 'expense' && 
                t.category === budget.category && 
                new Date(t.date) >= monthStart && 
                !t.deletedAt
              )
              .reduce((sum, t) => sum + t.amount, 0);

            const usagePercentage = (monthExpenses / budget.amount) * 100;
            if (usagePercentage >= template.conditions.threshold) {
              shouldTrigger = true;
              messageData = { 
                category: budget.category, 
                usage: usagePercentage.toFixed(0), 
                spent: monthExpenses.toFixed(2),
                budget: budget.amount.toFixed(2)
              };
            }
          }
          break;

        case 'balance_threshold':
          const account = accounts.find(a => a.name === template.conditions.account);
          if (account && template.conditions.threshold) {
            if (account.balance <= template.conditions.threshold) {
              shouldTrigger = true;
              messageData = { account: account.name, balance: account.balance.toFixed(2) };
            }
          }
          break;
      }

      if (shouldTrigger) {
        // Replace template placeholders
        const title = template.titleTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return messageData[key] || match;
        });

        const message = template.messageTemplate.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return messageData[key] || match;
        });

        addNotification({
          type: template.priority === 'critical' ? 'error' : template.priority === 'high' ? 'warning' : 'info',
          category: template.category,
          priority: template.priority,
          title,
          message,
          persistent: template.priority === 'critical',
          metadata: { template: true, templateId: template.id },
        });
      }
    });
  }, [notificationTemplates, transactions, budgets, accounts, addNotification]);

  // Check templates periodically
  useEffect(() => {
    const interval = setInterval(checkNotificationTemplates, 300000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [checkNotificationTemplates]);

  return {
    scheduledNotifications,
    notificationTemplates,
    addScheduledNotification,
    removeScheduledNotification,
    updateScheduledNotification,
    generateDailySummary,
    generateWeeklyReport,
    checkNotificationTemplates,
  };
}
