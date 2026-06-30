import { useState, useCallback, useMemo } from 'react';
import { NotificationCategory, NotificationPriority } from './useNotifications';

export type NotificationFilter = {
  // Basic filters
  categories: NotificationCategory[];
  priorities: NotificationPriority[];
  types: ('success' | 'error' | 'warning' | 'info')[];
  
  // Date range filter
  dateRange: {
    enabled: boolean;
    start: Date | null;
    end: Date | null;
  };
  
  // Search filter
  search: {
    enabled: boolean;
    query: string;
    fields: ('title' | 'message' | 'category' | 'priority')[];
  };
  
  // Status filters
  status: {
    read: boolean | null; // null = both, true = only read, false = only unread
    archived: boolean | null;
    persistent: boolean | null;
  };
  
  // Custom filters
  custom: {
    hasActions: boolean | null;
    hasMetadata: boolean | null;
    minDuration: number | null;
    maxDuration: number | null;
  };
  
  // Sorting
  sortBy: 'timestamp' | 'priority' | 'category' | 'type';
  sortOrder: 'asc' | 'desc';
};

const defaultFilter: NotificationFilter = {
  categories: [],
  priorities: [],
  types: [],
  dateRange: {
    enabled: false,
    start: null,
    end: null,
  },
  search: {
    enabled: false,
    query: '',
    fields: ['title', 'message'],
  },
  status: {
    read: null,
    archived: null,
    persistent: null,
  },
  custom: {
    hasActions: null,
    hasMetadata: null,
    minDuration: null,
    maxDuration: null,
  },
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

export type SavedFilter = {
  id: string;
  name: string;
  description: string;
  filter: NotificationFilter;
  isDefault: boolean;
  createdAt: number;
  lastUsed?: number;
};

export function useNotificationFilters() {
  const [filter, setFilter] = useState<NotificationFilter>(defaultFilter);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);

  // Load saved filters from localStorage
  useState(() => {
    try {
      const saved = localStorage.getItem('notification-filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed);
        
        // Set active default filter
        const defaultFilter = parsed.find((f: SavedFilter) => f.isDefault);
        if (defaultFilter) {
          setFilter(defaultFilter.filter);
          setActiveFilterId(defaultFilter.id);
        }
      }
    } catch (error) {
      console.error('Failed to load notification filters:', error);
    }
  });

  // Save filters to localStorage
  const saveFilters = useCallback((filters: SavedFilter[]) => {
    setSavedFilters(filters);
    try {
      localStorage.setItem('notification-filters', JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save notification filters:', error);
    }
  }, []);

  // Apply filter to notifications
  const applyFilter = useCallback((notifications: any[], currentFilter: NotificationFilter = filter) => {
    return notifications.filter(notification => {
      // Category filter
      if (currentFilter.categories.length > 0 && !currentFilter.categories.includes(notification.category)) {
        return false;
      }

      // Priority filter
      if (currentFilter.priorities.length > 0 && !currentFilter.priorities.includes(notification.priority)) {
        return false;
      }

      // Type filter
      if (currentFilter.types.length > 0 && !currentFilter.types.includes(notification.type)) {
        return false;
      }

      // Date range filter
      if (currentFilter.dateRange.enabled) {
        const notifDate = new Date(notification.timestamp);
        if (currentFilter.dateRange.start && notifDate < currentFilter.dateRange.start) {
          return false;
        }
        if (currentFilter.dateRange.end && notifDate > currentFilter.dateRange.end) {
          return false;
        }
      }

      // Search filter
      if (currentFilter.search.enabled && currentFilter.search.query) {
        const query = currentFilter.search.query.toLowerCase();
        const matches = currentFilter.search.fields.some(field => {
          const value = notification[field];
          return value && value.toString().toLowerCase().includes(query);
        });
        if (!matches) return false;
      }

      // Status filters
      if (currentFilter.status.read !== null && notification.read !== currentFilter.status.read) {
        return false;
      }
      if (currentFilter.status.archived !== null && notification.archived !== currentFilter.status.archived) {
        return false;
      }
      if (currentFilter.status.persistent !== null && notification.persistent !== currentFilter.status.persistent) {
        return false;
      }

      // Custom filters
      if (currentFilter.custom.hasActions !== null) {
        const hasActions = (notification.action || notification.actions?.length);
        if (currentFilter.custom.hasActions !== hasActions) {
          return false;
        }
      }

      if (currentFilter.custom.hasMetadata !== null) {
        const hasMetadata = notification.metadata && Object.keys(notification.metadata).length > 0;
        if (currentFilter.custom.hasMetadata !== hasMetadata) {
          return false;
        }
      }

      if (currentFilter.custom.minDuration !== null) {
        const duration = notification.duration || 0;
        if (duration < currentFilter.custom.minDuration) {
          return false;
        }
      }

      if (currentFilter.custom.maxDuration !== null) {
        const duration = notification.duration || 0;
        if (duration > currentFilter.custom.maxDuration) {
          return false;
        }
      }

      return true;
    }).sort((a: any, b: any) => {
      // Sorting
      const { sortBy, sortOrder } = currentFilter;
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'priority':
          const priorityOrder: Record<NotificationPriority, number> = { low: 0, medium: 1, high: 2, critical: 3 };
          comparison = priorityOrder[a.priority as NotificationPriority] - priorityOrder[b.priority as NotificationPriority];
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filter]);

  // Update filter
  const updateFilter = useCallback((updates: Partial<NotificationFilter>) => {
    const newFilter = { ...filter, ...updates };
    setFilter(newFilter);
    setActiveFilterId(null); // Clear active filter when manually updating
  }, [filter]);

  // Reset filter
  const resetFilter = useCallback(() => {
    setFilter(defaultFilter);
    setActiveFilterId(null);
  }, []);

  // Save current filter
  const saveCurrentFilter = useCallback((name: string, description: string) => {
    const newSavedFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      description,
      filter: { ...filter },
      isDefault: false,
      createdAt: Date.now(),
    };

    const updated = [...savedFilters, newSavedFilter];
    saveFilters(updated);
    return newSavedFilter.id;
  }, [filter, savedFilters, saveFilters]);

  // Load saved filter
  const loadSavedFilter = useCallback((filterId: string) => {
    const savedFilter = savedFilters.find(f => f.id === filterId);
    if (savedFilter) {
      setFilter(savedFilter.filter);
      setActiveFilterId(filterId);
      
      // Update last used
      const updated = savedFilters.map(f => 
        f.id === filterId ? { ...f, lastUsed: Date.now() } : f
      );
      saveFilters(updated);
    }
  }, [savedFilters, saveFilters]);

  // Delete saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    saveFilters(updated);
    
    if (activeFilterId === filterId) {
      setActiveFilterId(null);
    }
  }, [savedFilters, activeFilterId, saveFilters]);

  // Set as default
  const setAsDefault = useCallback((filterId: string) => {
    const updated = savedFilters.map(f => ({
      ...f,
      isDefault: f.id === filterId
    }));
    saveFilters(updated);
  }, [savedFilters, saveFilters]);

  // Get filter statistics
  const getFilterStats = useCallback((allNotifications: any[]) => {
    const filtered = applyFilter(allNotifications);
    const total = allNotifications.length;
    const filteredCount = filtered.length;

    return {
      total,
      filtered: filteredCount,
      percentage: total > 0 ? (filteredCount / total) * 100 : 0,
      unread: filtered.filter(n => !n.read).length,
      byCategory: filtered.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: filtered.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: filtered.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }, [applyFilter]);

  // Quick filter presets
  const quickFilters = useMemo(() => [
    {
      name: 'Unread Only',
      filter: { ...defaultFilter, status: { ...defaultFilter.status, read: false } },
    },
    {
      name: 'Critical Only',
      filter: { ...defaultFilter, priorities: ['critical' as NotificationPriority] },
    },
    {
      name: 'Alerts Only',
      filter: { ...defaultFilter, categories: ['alert' as NotificationCategory] },
    },
    {
      name: 'Recent (24h)',
      filter: { 
        ...defaultFilter, 
        dateRange: { 
          enabled: true, 
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), 
          end: new Date() 
        } 
      },
    },
    {
      name: 'This Week',
      filter: { 
        ...defaultFilter, 
        dateRange: { 
          enabled: true, 
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
          end: new Date() 
        } 
      },
    },
  ], []);

  // Apply quick filter
  const applyQuickFilter = useCallback((quickFilter: typeof quickFilters[0]) => {
    setFilter(quickFilter.filter);
    setActiveFilterId(null);
  }, []);

  return {
    filter,
    activeFilterId,
    savedFilters,
    quickFilters,
    applyFilter,
    updateFilter,
    resetFilter,
    saveCurrentFilter,
    loadSavedFilter,
    deleteSavedFilter,
    setAsDefault,
    getFilterStats,
    applyQuickFilter,
  };
}
