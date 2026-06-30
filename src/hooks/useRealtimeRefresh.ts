import { useState, useEffect, useCallback, useRef } from 'react';

export interface RealtimeRefreshOptions {
  interval?: number; // Auto-refresh interval in milliseconds (default: 30000 = 30 seconds)
  enabled?: boolean; // Whether auto-refresh is enabled (default: true)
  onRefresh?: () => Promise<void> | void; // Callback function to execute on refresh
}

export function useRealtimeRefresh(options: RealtimeRefreshOptions = {}) {
  const {
    interval = 30000,
    enabled = true,
    onRefresh
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabled);
  const [refreshInterval, setRefreshInterval] = useState(interval);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (!autoRefreshEnabled || !onRefresh) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, onRefresh, refresh]);

  // Update auto-refresh status
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  // Update refresh interval
  const setIntervalDuration = useCallback((newInterval: number) => {
    setRefreshInterval(newInterval);
  }, []);

  // Pull-to-refresh simulation (for touch devices)
  const pullToRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  // Get time until next refresh
  const getTimeUntilNextRefresh = useCallback(() => {
    if (!autoRefreshEnabled || !lastRefresh) return null;
    const elapsed = Date.now() - lastRefresh.getTime();
    const remaining = refreshInterval - elapsed;
    return remaining > 0 ? remaining : 0;
  }, [autoRefreshEnabled, lastRefresh, refreshInterval]);

  return {
    isRefreshing,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    refresh,
    toggleAutoRefresh,
    setIntervalDuration,
    pullToRefresh,
    getTimeUntilNextRefresh
  };
}

// Preset refresh intervals
export const REFRESH_INTERVALS = {
  OFF: 0,
  THIRTY_SECONDS: 30000,
  ONE_MINUTE: 60000,
  FIVE_MINUTES: 300000,
  FIFTEEN_MINUTES: 900000,
  THIRTY_MINUTES: 1800000,
  ONE_HOUR: 3600000
};
