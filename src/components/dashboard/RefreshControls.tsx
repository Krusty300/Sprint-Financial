'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Clock, 
  Play, 
  Pause,
  ChevronDown 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useRealtimeRefresh, REFRESH_INTERVALS } from '@/hooks/useRealtimeRefresh';

interface RefreshControlsProps {
  onRefresh: () => Promise<void> | void;
  defaultInterval?: number;
}

export function RefreshControls({ 
  onRefresh, 
  defaultInterval = REFRESH_INTERVALS.THIRTY_SECONDS 
}: RefreshControlsProps) {
  const {
    isRefreshing,
    lastRefresh,
    autoRefreshEnabled,
    refreshInterval,
    refresh,
    toggleAutoRefresh,
    setIntervalDuration,
    getTimeUntilNextRefresh
  } = useRealtimeRefresh({
    interval: defaultInterval,
    enabled: true,
    onRefresh
  });

  const timeUntilNextRefresh = getTimeUntilNextRefresh();

  const formatInterval = (ms: number) => {
    if (ms === 0) return 'Off';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      {/* Auto-refresh toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAutoRefresh}
        className={`${autoRefreshEnabled ? 'text-green-600' : 'text-muted-foreground'} text-xs sm:text-sm`}
      >
        {autoRefreshEnabled ? (
          <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
        ) : (
          <Pause className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
        )}
        <span className="hidden sm:inline">Auto</span>
        <span className="sm:hidden">Auto</span>
      </Button>

      {/* Refresh interval selector */}
      <Select value={refreshInterval.toString()} onValueChange={(value) => setIntervalDuration(Number(value))}>
        <SelectTrigger className="w-[70px] sm:w-[100px] h-7 sm:h-8 text-xs sm:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Off</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.THIRTY_SECONDS.toString()}>30s</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.ONE_MINUTE.toString()}>1m</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.FIVE_MINUTES.toString()}>5m</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.FIFTEEN_MINUTES.toString()}>15m</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.THIRTY_MINUTES.toString()}>30m</SelectItem>
          <SelectItem value={REFRESH_INTERVALS.ONE_HOUR.toString()}>1h</SelectItem>
        </SelectContent>
      </Select>

      {/* Manual refresh button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={refresh}
        disabled={isRefreshing}
        className="h-7 sm:h-8 w-7 sm:w-auto px-1 sm:px-2"
      >
        <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline ml-1">Refresh</span>
      </Button>

      {/* Last refresh time */}
      {lastRefresh && (
        <Badge variant="outline" className="text-[10px] sm:text-xs hidden sm:flex">
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(lastRefresh)}
        </Badge>
      )}

      {/* Time until next refresh */}
      {autoRefreshEnabled && timeUntilNextRefresh !== null && (
        <Badge variant="secondary" className="text-[10px] sm:text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {Math.floor(timeUntilNextRefresh / 1000)}s
        </Badge>
      )}
    </div>
  );
}
