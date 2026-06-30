'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export type ConnectionStatus = 'online' | 'offline' | 'connecting' | 'error';

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Initial status
    setStatus(navigator.onLine ? 'online' : 'offline');

    const handleOnline = () => {
      setStatus('online');
      setLastSync(new Date());
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor storage events for real-time sync detection
    const handleStorageChange = () => {
      setLastSync(new Date());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          icon: Wifi,
          label: 'Online',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'offline':
        return {
          icon: WifiOff,
          label: 'Offline',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'connecting':
        return {
          icon: AlertCircle,
          label: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'error':
        return {
          icon: AlertCircle,
          label: 'Connection Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Unknown',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      {lastSync && (
        <span className="text-xs text-muted-foreground">
          Last sync: {lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
