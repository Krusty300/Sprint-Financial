'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useRealtimeSync, realtimeSync } from '@/utils/realtimeSync';
import { toast } from 'sonner';

interface RefreshStatus {
  isConnected: boolean;
  lastSync: number;
  pendingUpdates: number;
  syncInProgress: boolean;
  errorCount: number;
}

export function DataRefreshManager() {
  const [status, setStatus] = useState<RefreshStatus>({
    isConnected: true,
    lastSync: Date.now(),
    pendingUpdates: 0,
    syncInProgress: false,
    errorCount: 0
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen for sync events
  useRealtimeSync('sync-request', (event) => {
    handleForceRefresh();
  });

  useRealtimeSync('data-changed', (event) => {
    setStatus(prev => ({
      ...prev,
      lastSync: Date.now(),
      pendingUpdates: prev.pendingUpdates + 1
    }));

    // Auto-clear pending updates after a delay
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        pendingUpdates: Math.max(0, prev.pendingUpdates - 1)
      }));
    }, 2000);
  });

  useRealtimeSync('settings-changed', (event) => {
    setStatus(prev => ({
      ...prev,
      lastSync: Date.now(),
      pendingUpdates: prev.pendingUpdates + 1
    }));
  });

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const isOnline = navigator.onLine;
      setStatus(prev => ({
        ...prev,
        isConnected: isOnline
      }));

      if (!isOnline) {
        toast.warning('Connection lost - Some features may be unavailable');
      } else if (status.isConnected !== isOnline) {
        toast.success('Connection restored');
        handleForceRefresh();
      }
    };

    const handleOnline = () => checkConnection();
    const handleOffline = () => checkConnection();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    checkConnection();

    // Periodic connection check
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [status.isConnected]);

  const handleForceRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      // Request sync from all tabs
      await realtimeSync.forceSync();
      
      // Wait a moment for sync to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus(prev => ({
        ...prev,
        lastSync: Date.now(),
        syncInProgress: false,
        errorCount: 0
      }));

      toast.success('Data refreshed successfully');
      
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        syncInProgress: false,
        errorCount: prev.errorCount + 1
      }));
      
      toast.error('Failed to refresh data');
      
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached data? This will refresh all data from storage.')) {
      try {
        // Clear application cache
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('cache') || key.includes('temp') || key.includes('pending')) {
            localStorage.removeItem(key);
          }
        });

        setStatus(prev => ({
          ...prev,
          pendingUpdates: 0,
          errorCount: 0
        }));

        toast.success('Cache cleared successfully');
        handleForceRefresh();
        
      } catch (error) {
        toast.error('Failed to clear cache');
      }
    }
  };

  const getTimeSinceLastSync = () => {
    const seconds = Math.floor((Date.now() - status.lastSync) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getStatusColor = () => {
    if (!status.isConnected) return 'text-destructive';
    if (status.syncInProgress) return 'text-yellow-600';
    if (status.errorCount > 0) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (!status.isConnected) return <WifiOff className="h-4 w-4" />;
    if (status.syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (status.errorCount > 0) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Real-time Sync Status
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              disabled={isRefreshing || !status.isConnected}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={isRefreshing}
            >
              Clear Cache
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status.isConnected ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {status.isConnected ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <div className="font-medium">Connection</div>
                <div className={`text-sm ${getStatusColor()}`}>
                  {status.isConnected ? 'Connected' : 'Offline'}
                </div>
              </div>
            </div>
            <Badge variant={status.isConnected ? 'default' : 'destructive'}>
              {getStatusIcon()}
            </Badge>
          </div>

          {/* Sync Status */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                status.syncInProgress ? 'bg-yellow-100' : 'bg-blue-100'
              }`}>
                <Activity className={`h-5 w-5 ${
                  status.syncInProgress ? 'text-yellow-600 animate-pulse' : 'text-blue-600'
                }`} />
              </div>
              <div>
                <div className="font-medium">Last Sync</div>
                <div className="text-sm text-muted-foreground">
                  {getTimeSinceLastSync()}
                </div>
              </div>
            </div>
            {status.pendingUpdates > 0 && (
              <Badge variant="secondary">
                {status.pendingUpdates} pending
              </Badge>
            )}
          </div>
        </div>

        {/* Error Status */}
        {status.errorCount > 0 && (
          <div className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="font-medium">Sync Issues</div>
                <div className="text-sm text-orange-700">
                  {status.errorCount} error{status.errorCount !== 1 ? 's' : ''} detected
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Auto-refresh Info */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>
              Data automatically syncs across all open tabs and windows. 
              Changes made in one tab will instantly appear in others.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
