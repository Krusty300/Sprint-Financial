import { useState, useEffect, useCallback } from 'react';
import { NotificationCategory, NotificationPriority } from './useNotifications';

export type NotificationSettings = {
  // Category preferences
  categories: Record<NotificationCategory, {
    enabled: boolean;
    priority: NotificationPriority;
    sound: boolean;
    desktop: boolean;
    autoHide: boolean;
    duration: number;
  }>;
  
  // Global preferences
  global: {
    enabled: boolean;
    sound: boolean;
    volume: number;
    desktop: boolean;
    maxVisible: number;
    persistence: boolean;
  };
  
  // Quiet hours
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
    allowCritical: boolean;
  };
  
  // Scheduling preferences
  scheduling: {
    dailySummary: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    summaryTime: string; // HH:MM format
  };
};

const defaultSettings: NotificationSettings = {
  categories: {
    transaction: { enabled: true, priority: 'medium', sound: true, desktop: false, autoHide: true, duration: 5000 },
    budget: { enabled: true, priority: 'high', sound: true, desktop: true, autoHide: false, duration: 8000 },
    account: { enabled: true, priority: 'medium', sound: true, desktop: false, autoHide: true, duration: 5000 },
    goal: { enabled: true, priority: 'low', sound: false, desktop: false, autoHide: true, duration: 3000 },
    system: { enabled: true, priority: 'medium', sound: false, desktop: false, autoHide: true, duration: 4000 },
    reminder: { enabled: true, priority: 'medium', sound: true, desktop: true, autoHide: false, duration: 6000 },
    alert: { enabled: true, priority: 'critical', sound: true, desktop: true, autoHide: false, duration: 10000 },
  },
  global: {
    enabled: true,
    sound: true,
    volume: 0.7,
    desktop: false,
    maxVisible: 5,
    persistence: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    allowCritical: true,
  },
  scheduling: {
    dailySummary: false,
    weeklyReport: false,
    monthlyReport: false,
    summaryTime: '09:00',
  },
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    try {
      localStorage.setItem('notification-settings', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }, [settings]);

  // Update category settings
  const updateCategorySettings = useCallback((
    category: NotificationCategory,
    updates: Partial<NotificationSettings['categories'][NotificationCategory]>
  ) => {
    saveSettings({
      categories: {
        ...settings.categories,
        [category]: {
          ...settings.categories[category],
          ...updates,
        },
      },
    });
  }, [settings, saveSettings]);

  // Update global settings
  const updateGlobalSettings = useCallback((updates: Partial<NotificationSettings['global']>) => {
    saveSettings({
      global: {
        ...settings.global,
        ...updates,
      },
    });
  }, [settings, saveSettings]);

  // Update quiet hours
  const updateQuietHours = useCallback((updates: Partial<NotificationSettings['quietHours']>) => {
    saveSettings({
      quietHours: {
        ...settings.quietHours,
        ...updates,
      },
    });
  }, [settings, saveSettings]);

  // Update scheduling
  const updateScheduling = useCallback((updates: Partial<NotificationSettings['scheduling']>) => {
    saveSettings({
      scheduling: {
        ...settings.scheduling,
        ...updates,
      },
    });
  }, [settings, saveSettings]);

  // Check if notification should be shown based on settings
  const shouldShowNotification = useCallback((
    category: NotificationCategory,
    priority: NotificationPriority
  ) => {
    if (!settings.global.enabled) return false;
    
    const categorySettings = settings.categories[category];
    if (!categorySettings.enabled) return false;
    
    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end, allowCritical } = settings.quietHours;
      
      const isQuietHours = (currentTime >= start && currentTime <= end) || 
                          (start > end && (currentTime >= start || currentTime <= end));
      
      if (isQuietHours && (!allowCritical || priority !== 'critical')) {
        return false;
      }
    }
    
    return true;
  }, [settings]);

  // Get notification duration based on settings
  const getNotificationDuration = useCallback((
    category: NotificationCategory,
    priority: NotificationPriority,
    defaultDuration: number
  ) => {
    const categorySettings = settings.categories[category];
    return categorySettings.autoHide ? categorySettings.duration : defaultDuration;
  }, [settings]);

  // Check if sound should play
  const shouldPlaySound = useCallback((
    category: NotificationCategory,
    priority: NotificationPriority
  ) => {
    if (!settings.global.sound || !settings.global.enabled) return false;
    
    const categorySettings = settings.categories[category];
    return categorySettings.sound;
  }, [settings]);

  // Check if desktop notification should show
  const shouldShowDesktop = useCallback((
    category: NotificationCategory,
    priority: NotificationPriority
  ) => {
    if (!settings.global.desktop || !settings.global.enabled) return false;
    
    const categorySettings = settings.categories[category];
    return categorySettings.desktop;
  }, [settings]);

  return {
    settings,
    loading,
    saveSettings,
    updateCategorySettings,
    updateGlobalSettings,
    updateQuietHours,
    updateScheduling,
    shouldShowNotification,
    getNotificationDuration,
    shouldPlaySound,
    shouldShowDesktop,
  };
}
