import { useState, useEffect, useCallback, useRef } from 'react';

// Extend Window interface for tab ID
declare global {
  interface Window {
    realtimeTabId?: string;
  }
}

export type RealtimeEvent = {
  id: string;
  type: 'transaction' | 'budget' | 'account' | 'category' | 'template' | 'notification';
  action: 'create' | 'update' | 'delete' | 'sync';
  data?: any;
  timestamp: number;
  source?: string;
};

export type RealtimeListener = (event: RealtimeEvent) => void;

class RealtimeEventManager {
  private listeners: Map<string, RealtimeListener[]> = new Map();
  private eventHistory: RealtimeEvent[] = [];
  private maxHistorySize = 100;
  private recentEvents: Map<string, number> = new Map(); // Track recent events for deduplication
  private deduplicationWindow = 1000; // 1 second deduplication window

  // Subscribe to events
  subscribe(eventType: string, listener: RealtimeListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    
    const listeners = this.listeners.get(eventType)!;
    listeners.push(listener);
    
    // Debug logging to track subscriptions
    console.log(`Realtime: Subscribed to ${eventType}, total listeners: ${listeners.length}`);
    
    // Return unsubscribe function
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        console.log(`Realtime: Unsubscribed from ${eventType}, remaining listeners: ${listeners.length}`);
      }
    };
  }

  // Check if an event is a recent duplicate
  private isDuplicate(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): boolean {
    const eventKey = `${event.type}-${event.action}-${JSON.stringify(event.data || {})}`;
    const now = Date.now();
    const lastEventTime = this.recentEvents.get(eventKey);
    
    // If same event occurred within deduplication window, it's a duplicate
    if (lastEventTime && (now - lastEventTime) < this.deduplicationWindow) {
      console.log('Realtime: Duplicate event prevented:', eventKey);
      return true;
    }
    
    // Update the recent events map
    this.recentEvents.set(eventKey, now);
    
    // Clean up old events
    const cutoff = now - this.deduplicationWindow * 2; // Keep events for 2x the window
    for (const [key, timestamp] of this.recentEvents.entries()) {
      if (timestamp < cutoff) {
        this.recentEvents.delete(key);
      }
    }
    
    return false;
  }

  // Emit an event
  emit(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): void {
    // Check for duplicates before processing
    if (this.isDuplicate(event)) {
      return;
    }
    
    const fullEvent: RealtimeEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...event
    };

    // Debug logging to track event emissions
    console.log('Realtime: Emitting event', {
      type: event.type,
      action: event.action,
      id: fullEvent.id,
      timestamp: fullEvent.timestamp,
      listenerCount: (this.listeners.get(event.type) || []).length
    });

    // Add to history
    this.eventHistory.unshift(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }

    // Notify listeners
    const listeners = this.listeners.get(event.type) || [];
    console.log(`Realtime: Notifying ${listeners.length} listeners for ${event.type} events`);
    listeners.forEach((listener, index) => {
      try {
        console.log(`Realtime: Calling listener ${index} for ${event.type}:${event.action}`);
        listener(fullEvent);
      } catch (error) {
        console.error('Error in realtime listener:', error);
      }
    });

    // Also notify general listeners
    const generalListeners = this.listeners.get('*') || [];
    generalListeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Error in general realtime listener:', error);
      }
    });

    // Store in localStorage for cross-tab communication
    this.storeEvent(fullEvent);
  }

  // Get event history
  getHistory(type?: string, limit?: number): RealtimeEvent[] {
    let events = this.eventHistory;
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return limit ? events.slice(0, limit) : events;
  }

  // Clear history
  clearHistory(): void {
    this.eventHistory = [];
  }

  // Store event in localStorage for cross-tab communication
  private storeEvent(event: RealtimeEvent): void {
    try {
      const key = `realtime-event-${event.id}`;
      localStorage.setItem(key, JSON.stringify(event));
      
      // Clean up old events - sort by timestamp and keep only last 20
      const eventKeys = Object.keys(localStorage)
        .filter(k => k.startsWith('realtime-event-'))
        .map(k => ({
          key: k,
          timestamp: parseInt(k.split('-').pop() || '0')
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
      
      // Remove events beyond the last 20
      eventKeys.slice(20).forEach(({ key }) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    } catch (error) {
      console.error('Failed to store event in localStorage:', error);
      // If quota exceeded, try to clean up more aggressively
      try {
        this.aggressiveCleanup();
      } catch (cleanupError) {
        console.error('Failed to cleanup localStorage:', cleanupError);
      }
    }
  }

  // Aggressive cleanup when quota is exceeded
  private aggressiveCleanup(): void {
    const eventKeys = Object.keys(localStorage)
      .filter(k => k.startsWith('realtime-event-'));
    
    // Remove all but the 5 most recent events
    eventKeys.slice(5).forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  }

  // Listen for storage events from other tabs
  initCrossTabCommunication = (): void => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('realtime-event-') && e.newValue) {
        try {
          const event = JSON.parse(e.newValue) as RealtimeEvent;
          const currentTabId = this.getCurrentTabId();
          
          // Don't echo back events from this tab
          if (event.source !== currentTabId) {
            this.emitLocal(event);
          }
        } catch (error) {
          console.error('Failed to parse stored event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
  };

  private emitLocal(event: RealtimeEvent): void {
    const listeners = this.listeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in realtime listener:', error);
      }
    });

    const generalListeners = this.listeners.get('*') || [];
    generalListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in general realtime listener:', error);
      }
    });
  }

  public getCurrentTabId(): string {
    // Simple tab identification - could be enhanced
    if (typeof window === 'undefined') return 'server';
    
    // Type-safe window property access
    const windowWithTab = window as typeof window & { realtimeTabId?: string };
    if (!windowWithTab.realtimeTabId) {
      windowWithTab.realtimeTabId = `tab-${Date.now()}-${Math.random()}`;
    }
    return windowWithTab.realtimeTabId;
  }
}

// Global instance
const realtimeManager = new RealtimeEventManager();

// Initialize cross-tab communication
if (typeof window !== 'undefined') {
  realtimeManager.initCrossTabCommunication();
}

// Hook for using realtime events
export function useRealtime() {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const listenersRef = useRef<Map<string, () => void>>(new Map());

  // Subscribe to events
  const subscribe = useCallback((eventType: string, listener: RealtimeListener) => {
    const unsubscribe = realtimeManager.subscribe(eventType, (event) => {
      setLastEvent(event);
      listener(event);
    });
    
    // Store unsubscribe function
    listenersRef.current.set(eventType, unsubscribe);
    
    return unsubscribe;
  }, []);

  // Emit events
  const emit = useCallback((event: Omit<RealtimeEvent, 'id' | 'timestamp'>) => {
    const currentTabId = realtimeManager.getCurrentTabId();
    const fullEvent = {
      ...event,
      source: currentTabId
    };
    realtimeManager.emit(fullEvent);
  }, []);

  // Get event history
  const getHistory = useCallback((type?: string, limit?: number) => {
    return realtimeManager.getHistory(type, limit);
  }, []);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup all active listeners
      listenersRef.current.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error during listener cleanup:', error);
        }
      });
      listenersRef.current.clear();

      // Clean up event history
      realtimeManager.clearHistory();
    };
  }, []);

  return {
    subscribe,
    emit,
    getHistory,
    lastEvent
  };
}

// Specific hooks for common use cases
export function useRealtimeTransactions() {
  const { subscribe, emit } = useRealtime();
  const [lastTransactionEvent, setLastTransactionEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('transaction', (event) => {
      setLastTransactionEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyTransactionChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'transaction',
      action,
      data
    });
  }, [emit]);

  return {
    lastTransactionEvent,
    notifyTransactionChange
  };
}

export function useRealtimeBudgets() {
  const { subscribe, emit } = useRealtime();
  const [lastBudgetEvent, setLastBudgetEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('budget', (event) => {
      setLastBudgetEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyBudgetChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'budget',
      action,
      data
    });
  }, [emit]);

  return {
    lastBudgetEvent,
    notifyBudgetChange
  };
}

export function useRealtimeAccounts() {
  const { subscribe, emit } = useRealtime();
  const [lastAccountEvent, setLastAccountEvent] = useState<RealtimeEvent | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('account', (event) => {
      setLastAccountEvent(event);
    });
    return unsubscribe;
  }, [subscribe]);

  const notifyAccountChange = useCallback((action: 'create' | 'update' | 'delete', data?: any) => {
    emit({
      type: 'account',
      action,
      data
    });
  }, [emit]);

  return {
    lastAccountEvent,
    notifyAccountChange
  };
}

export { realtimeManager };
