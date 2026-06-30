import { useState, useEffect, useCallback } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'error';

export interface ConnectionMetrics {
  status: ConnectionStatus;
  lastSync: Date | null;
  syncInProgress: boolean;
  errorCount: number;
  reconnectAttempts: number;
}

export function useConnectionStatus() {
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    status: navigator.onLine ? 'online' : 'offline',
    lastSync: null,
    syncInProgress: false,
    errorCount: 0,
    reconnectAttempts: 0
  });

  const updateStatus = useCallback((status: ConnectionStatus, error?: Error) => {
    setMetrics(prev => ({
      ...prev,
      status,
      errorCount: error ? prev.errorCount + 1 : prev.errorCount,
      lastSync: status === 'online' ? new Date() : prev.lastSync
    }));

    if (error) {
      console.error('Connection error:', error);
    }
  }, []);

  const setSyncInProgress = useCallback((inProgress: boolean) => {
    setMetrics(prev => ({ ...prev, syncInProgress: inProgress }));
  }, []);

  const incrementReconnectAttempts = useCallback(() => {
    setMetrics(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
  }, []);

  const resetReconnectAttempts = useCallback(() => {
    setMetrics(prev => ({ ...prev, reconnectAttempts: 0 }));
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      updateStatus('online');
      resetReconnectAttempts();
    };

    const handleOffline = () => {
      updateStatus('offline');
    };

    const handleConnectionChange = () => {
      const isOnline = navigator.onLine;
      updateStatus(isOnline ? 'online' : 'offline');
    };

    // Listen for network events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('connectionchange', handleConnectionChange);

    // Monitor storage events for sync detection
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('realtime-event-')) {
        setMetrics(prev => ({
          ...prev,
          lastSync: new Date()
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Periodic connection check
    const connectionCheck = setInterval(() => {
      const isOnline = navigator.onLine;
      setMetrics(prev => {
        if (prev.status !== (isOnline ? 'online' : 'offline')) {
          return {
            ...prev,
            status: isOnline ? 'online' : 'offline',
            lastSync: isOnline ? new Date() : prev.lastSync
          };
        }
        return prev;
      });
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('connectionchange', handleConnectionChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(connectionCheck);
    };
  }, [updateStatus, resetReconnectAttempts]);

  return {
    ...metrics,
    updateStatus,
    setSyncInProgress,
    incrementReconnectAttempts,
    resetReconnectAttempts
  };
}
