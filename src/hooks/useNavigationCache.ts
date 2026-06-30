'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { localStorageCache, memoryCache } from '@/lib/cache';
import { getIcon } from '@/lib/iconMapping';

interface NavigationItem {
  id: string;
  name: string;
  href: string;
  icon: string | React.ComponentType<{ className?: string }>;
  badge?: string | null;
  description?: string;
  color?: string;
  order?: number;
  lastAccessed?: number;
  accessCount?: number;
}

interface NavigationState {
  items: NavigationItem[];
  favorites: string[];
  recentlyViewed: string[];
  customOrder: Record<string, number>;
}

const NAVIGATION_CACHE_KEY = 'navigation_data';
const NAVIGATION_PREFERENCES_KEY = 'navigation_preferences';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Default navigation items
const DEFAULT_NAVIGATION: NavigationItem[] = [
  {
    id: 'dashboard',
    name: 'Sprint Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    description: 'View your financial overview and key metrics',
    color: 'text-blue-600',
    order: 0,
  },
  {
    id: 'transactions',
    name: 'Transactions',
    href: '/transactions',
    icon: 'Receipt',
    description: 'Manage and categorize your transactions',
    color: 'text-green-600',
    order: 1,
  },
  {
    id: 'budgets',
    name: 'Budgets',
    href: '/budgets',
    icon: 'Target',
    description: 'Set and track your spending budgets',
    color: 'text-orange-600',
    order: 2,
  },
  {
    id: 'reports',
    name: 'Reports',
    href: '/reports',
    icon: 'TrendingUp',
    description: 'Generate detailed financial reports',
    color: 'text-purple-600',
    order: 3,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    href: '/notifications',
    icon: 'Bell',
    description: 'View and manage your notifications',
    color: 'text-red-600',
    order: 4,
  },
  {
    id: 'accounts',
    name: 'Accounts',
    href: '/accounts',
    icon: 'Wallet',
    description: 'Manage your bank accounts and cards',
    color: 'text-indigo-600',
    order: 5,
  },
  {
    id: 'banking',
    name: 'Banking',
    href: '/banking',
    icon: 'CreditCard',
    description: 'Connect and sync bank accounts',
    color: 'text-cyan-600',
    order: 6,
  },
  {
    id: 'templates',
    name: 'Templates',
    href: '/templates',
    icon: 'Layout',
    description: 'Create transaction and account templates',
    color: 'text-pink-600',
    order: 7,
  },
  {
    id: 'recycle-bin',
    name: 'Recycle Bin',
    href: '/recycle-bin',
    icon: 'Trash2',
    description: 'View and restore deleted items',
    color: 'text-gray-600',
    order: 8,
  },
  {
    id: 'settings',
    name: 'Settings',
    href: '/settings',
    icon: 'Settings',
    description: 'Configure app preferences and settings',
    color: 'text-slate-600',
    order: 9,
  },
];

export function useNavigationCache() {
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    items: DEFAULT_NAVIGATION,
    favorites: [],
    recentlyViewed: [],
    customOrder: {},
  });

  const [isLoading, setIsLoading] = useState(false);

  // Save navigation state to cache
  const saveNavigationState = useCallback((state: NavigationState) => {
    localStorageCache.set(NAVIGATION_CACHE_KEY, state, { ttl: CACHE_TTL });
    memoryCache.set(NAVIGATION_CACHE_KEY, state, CACHE_TTL);
  }, []);

  // Track page visits for recently viewed
  const trackPageVisit = useCallback((href: string, limit: number = 10) => {
    setNavigationState(prevState => {
      const recentlyViewed = prevState.recentlyViewed.filter(item => item !== href);
      recentlyViewed.unshift(href);

      // Keep only last N items based on limit
      if (recentlyViewed.length > limit) {
        recentlyViewed.splice(limit);
      }

      // Update access count and last accessed
      const items = prevState.items.map(item => {
        if (item.href === href) {
          return {
            ...item,
            lastAccessed: Date.now(),
            accessCount: (item.accessCount || 0) + 1,
          };
        }
        return item;
      });

      const newState = { ...prevState, items, recentlyViewed };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Track current page
  useEffect(() => {
    if (pathname) {
      trackPageVisit(pathname);
    }
  }, [pathname, trackPageVisit]);

  // Toggle favorite
  const toggleFavorite = useCallback((itemId: string) => {
    setNavigationState(prevState => {
      const favorites = prevState.favorites.includes(itemId)
        ? prevState.favorites.filter(id => id !== itemId)
        : [...prevState.favorites, itemId];

      const newState = { ...prevState, favorites };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Reorder navigation items
  const reorderItems = useCallback((draggedId: string, targetId: string) => {
    setNavigationState(prevState => {
      const items = [...prevState.items];
      const draggedIndex = items.findIndex(item => item.id === draggedId);
      const targetIndex = items.findIndex(item => item.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return prevState;

      const [draggedItem] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, draggedItem);

      // Update order property
      const reorderedItems = items.map((item, index) => ({
        ...item,
        order: index,
      }));

      const customOrder = reorderedItems.reduce((acc, item, index) => {
        acc[item.id] = index;
        return acc;
      }, {} as Record<string, number>);

      const newState = { ...prevState, items: reorderedItems, customOrder };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Add custom navigation item
  const addCustomItem = useCallback((item: Omit<NavigationItem, 'id' | 'order'>) => {
    setNavigationState(prevState => {
      const newItem: NavigationItem = {
        ...item,
        id: `custom_${Date.now()}`,
        order: prevState.items.length,
      };

      const newState = {
        ...prevState,
        items: [...prevState.items, newItem],
      };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Remove navigation item
  const removeItem = useCallback((itemId: string) => {
    setNavigationState(prevState => {
      const items = prevState.items.filter(item => item.id !== itemId);
      const favorites = prevState.favorites.filter(id => id !== itemId);
      const recentlyViewed = prevState.recentlyViewed.filter(href => 
        !items.find(item => item.href === href)
      );

      const newState = { ...prevState, items, favorites, recentlyViewed };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Update navigation item
  const updateItem = useCallback((itemId: string, updates: Partial<NavigationItem>) => {
    setNavigationState(prevState => {
      const items = prevState.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );

      const newState = { ...prevState, items };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  // Get sorted navigation items
  const sortedItems = useMemo(() => {
    return [...navigationState.items].sort((a, b) => {
      // Use custom order if available, otherwise use the order property
      const aOrder = navigationState.customOrder[a.id] ?? a.order ?? 0;
      const bOrder = navigationState.customOrder[b.id] ?? b.order ?? 0;
      return aOrder - bOrder;
    }).map(item => ({
      ...item,
      icon: typeof item.icon === 'string' ? getIcon(item.icon) : item.icon, // Convert string icon name to component
    }));
  }, [navigationState.items, navigationState.customOrder]);

  // Get favorite items
  const favoriteItems = useMemo(() => {
    return sortedItems.filter(item => navigationState.favorites.includes(item.id));
  }, [sortedItems, navigationState.favorites]);

  // Get recently viewed items
  const recentlyViewedItems = useMemo(() => {
    const hrefs = navigationState.recentlyViewed.slice(0, 5); // Top 5 displayed in sidebar
    return hrefs.map(href => sortedItems.find(item => item.href === href)).filter(Boolean) as NavigationItem[];
  }, [navigationState.recentlyViewed, sortedItems]);

  // Get most accessed items
  const mostAccessedItems = useMemo(() => {
    return [...sortedItems]
      .filter(item => item.accessCount && item.accessCount > 0)
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, 5);
  }, [sortedItems]);

  // Search navigation items
  const searchItems = useCallback((query: string) => {
    if (!query.trim()) return sortedItems;

    const lowercaseQuery = query.toLowerCase();
    return sortedItems.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description?.toLowerCase().includes(lowercaseQuery) ||
      item.href.toLowerCase().includes(lowercaseQuery)
    );
  }, [sortedItems]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    const defaultState: NavigationState = {
      items: DEFAULT_NAVIGATION,
      favorites: [],
      recentlyViewed: [],
      customOrder: {},
    };
    setNavigationState(defaultState);
    saveNavigationState(defaultState);
  }, [saveNavigationState]);

  // Export/Import functionality
  const exportNavigationData = useCallback(() => {
    return JSON.stringify(navigationState);
  }, [navigationState]);

  const importNavigationData = useCallback((data: string) => {
    try {
      const importedState = JSON.parse(data) as NavigationState;
      setNavigationState(importedState);
      saveNavigationState(importedState);
      return true;
    } catch {
      return false;
    }
  }, [saveNavigationState]);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorageCache.delete(NAVIGATION_CACHE_KEY);
    memoryCache.delete(NAVIGATION_CACHE_KEY);
    resetToDefault();
  }, [resetToDefault]);

  // Clear recently viewed
  const clearRecentlyViewed = useCallback(() => {
    setNavigationState(prevState => {
      const newState = { ...prevState, recentlyViewed: [] };
      saveNavigationState(newState);
      return newState;
    });
  }, [saveNavigationState]);

  return {
    // State
    navigationState,
    sortedItems,
    favoriteItems,
    recentlyViewedItems,
    mostAccessedItems,
    isLoading,

    // Actions
    toggleFavorite,
    reorderItems,
    addCustomItem,
    removeItem,
    updateItem,
    searchItems,
    trackPageVisit,
    clearRecentlyViewed,

    // Utilities
    resetToDefault,
    exportNavigationData,
    importNavigationData,
    clearCache,
  };
}

// Hook for navigation preferences
export function useNavigationPreferences() {
  const [preferences, setPreferences] = useState({
    collapsedSections: [] as string[],
    theme: 'system',
    autoCollapse: true,
    showBadges: true,
    showDescriptions: true,
    animationsEnabled: true,
    recentlyViewedLimit: 10,
  });

  const updatePreference = useCallback((key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorageCache.set('navigation_preferences', newPreferences);
  }, [preferences]);

  const toggleSection = useCallback((sectionId: string) => {
    const collapsedSections = preferences.collapsedSections.includes(sectionId)
      ? preferences.collapsedSections.filter(id => id !== sectionId)
      : [...preferences.collapsedSections, sectionId];
    
    updatePreference('collapsedSections', collapsedSections);
  }, [preferences.collapsedSections, updatePreference]);

  return {
    preferences,
    updatePreference,
    toggleSection,
  };
}
