import { useState, useCallback } from 'react';

export interface UseRecentlyViewedOptions {
  maxItems?: number;
  storageKey?: string;
}

export interface UseRecentlyViewedReturn {
  recentlyViewed: string[];
  addToRecentlyViewed: (item: string) => void;
  removeFromRecentlyViewed: (item: string) => void;
  clearRecentlyViewed: () => void;
}

/**
 * Custom hook for managing recently viewed items
 * Supports localStorage persistence and configurable max items
 */
export function useRecentlyViewed(options: UseRecentlyViewedOptions = {}): UseRecentlyViewedReturn {
  const { maxItems = 5, storageKey = 'recentlyViewed' } = options;

  // Initialize from localStorage if available
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch (error) {
        console.error('Error loading recently viewed from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  const addToRecentlyViewed = useCallback((item: string) => {
    setRecentlyViewed(prev => {
      const updated = [item, ...prev.filter(i => i !== item)].slice(0, maxItems);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving recently viewed to localStorage:', error);
        }
      }
      
      return updated;
    });
  }, [maxItems, storageKey]);

  const removeFromRecentlyViewed = useCallback((item: string) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(i => i !== item);
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving recently viewed to localStorage:', error);
        }
      }
      
      return updated;
    });
  }, [storageKey]);

  const clearRecentlyViewed = useCallback(() => {
    setRecentlyViewed([]);
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error('Error clearing recently viewed from localStorage:', error);
      }
    }
  }, [storageKey]);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed
  };
}
