'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Generic state manager with performance optimizations
interface PerformanceStateOptions<T> {
  initialState: T;
  persistKey?: string;
  debounceMs?: number;
  maxHistory?: number;
}

interface StateHistory<T> {
  state: T;
  timestamp: number;
}

export function usePerformanceState<T>({
  initialState,
  persistKey,
  debounceMs = 300,
  maxHistory = 10,
}: PerformanceStateOptions<T>) {
  const [state, setState] = useState<T>(initialState);

  const historyRef = useRef<StateHistory<T>[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced persistence
  const persistState = useCallback((newState: T) => {
    if (persistKey) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(persistKey, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to persist state:', error);
        }
      }, debounceMs);
    }
  }, [persistKey, debounceMs]);

  // Optimized setState with history tracking
  const setOptimizedState = useCallback((updater: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newState = typeof updater === 'function' ? (updater as (prev: T) => T)(prevState) : updater;
      
      // Add to history
      historyRef.current.push({
        state: newState,
        timestamp: Date.now(),
      });
      
      // Limit history size
      if (historyRef.current.length > maxHistory) {
        historyRef.current = historyRef.current.slice(-maxHistory);
      }
      
      // Persist changes
      persistState(newState);
      
      return newState;
    });
  }, [persistState, maxHistory]);

  // Undo functionality
  const undo = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop(); // Remove current state
      const previousState = historyRef.current[historyRef.current.length - 1];
      setState(previousState.state);
      if (persistKey) {
        localStorage.setItem(persistKey, JSON.stringify(previousState.state));
      }
    }
  }, [persistKey]);

  // Reset to initial state
  const reset = useCallback(() => {
    setState(initialState);
    historyRef.current = [];
    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(initialState));
    }
  }, [initialState, persistKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    setState: setOptimizedState,
    undo,
    reset,
    history: historyRef.current,
  };
}

// Hook for managing large datasets with virtualization
interface VirtualizedDataOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  getKey?: (item: T, index: number) => string | number;
}

export function useVirtualizedData<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
  getKey = (_, index) => index,
}: VirtualizedDataOptions<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleRange,
  };
}

// Hook for efficient data fetching with caching
interface CachedDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  staleTime?: number; // in milliseconds
  cacheTime?: number; // in milliseconds
}

export function useCachedData<T>({
  key,
  fetcher,
  staleTime = 5 * 60 * 1000, // 5 minutes
  cacheTime = 10 * 60 * 1000, // 10 minutes
}: CachedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const isStale = useCallback((timestamp: number) => {
    return Date.now() - timestamp > staleTime;
  }, [staleTime]);

  const isExpired = useCallback((timestamp: number) => {
    return Date.now() - timestamp > cacheTime;
  }, [cacheTime]);

  const cleanupExpiredCache = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;
    
    for (const [key, entry] of cache.entries()) {
      if (isExpired(entry.timestamp)) {
        cache.delete(key);
      }
    }
  }, [isExpired]);

  const fetchData = useCallback(async (force = false) => {
    const cached = cacheRef.current.get(key);
    
    if (!force && cached && !isStale(cached.timestamp)) {
      setData(cached.data);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      cacheRef.current.set(key, { data: result, timestamp: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, isStale]);

  // Initial fetch and cleanup
  useEffect(() => {
    cleanupExpiredCache();
    fetchData();
  }, [fetchData, cleanupExpiredCache]);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(cleanupExpiredCache, cacheTime);
    return () => clearInterval(interval);
  }, [cleanupExpiredCache, cacheTime]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
  };
}

// Hook for performance monitoring
interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now();
    renderTimesRef.current.push(renderTime);
    
    // Keep only last 100 render times
    if (renderTimesRef.current.length > 100) {
      renderTimesRef.current = renderTimesRef.current.slice(-100);
    }

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      const averageRenderTime = renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length;
      
      if (averageRenderTime > 16) { // 16ms = 60fps
        console.warn(`Performance warning: ${componentName} average render time: ${averageRenderTime.toFixed(2)}ms`);
      }
    }
  });

  const metrics = useMemo((): PerformanceMetrics => {
    const renderTimes = renderTimesRef.current;
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length 
      : 0;

    return {
      renderCount: renderCountRef.current,
      lastRenderTime: renderTimes[renderTimes.length - 1] || 0,
      averageRenderTime,
    };
  }, []);

  return metrics;
}

// Hook for debounced values
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled values
export function useThrottledValue<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= delay) {
      setThrottledValue(value);
      lastUpdateRef.current = now;
    } else {
      const timeout = setTimeout(() => {
        setThrottledValue(value);
        lastUpdateRef.current = Date.now();
      }, delay - timeSinceLastUpdate);

      return () => clearTimeout(timeout);
    }
  }, [value, delay]);

  return throttledValue;
}
