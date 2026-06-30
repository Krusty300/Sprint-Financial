/**
 * Real-time data synchronization system for instant updates across pages
 */

import { useState, useEffect } from 'react';

export interface SyncEvent {
  type: string;
  data: any;
  timestamp: number;
  source: string;
  id: string;
}

export interface SyncSubscriber {
  id: string;
  eventType: string;
  callback: (event: SyncEvent) => void;
  component?: string;
}

export interface SyncConfig {
  enableBroadcastChannel: boolean;
  enableLocalStorage: boolean;
  enableEventBus: boolean;
  debounceMs: number;
  maxRetries: number;
}

class RealtimeSyncManager {
  private config: SyncConfig;
  private subscribers: Map<string, SyncSubscriber[]> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private eventQueue: SyncEvent[] = [];
  private isProcessing = false;
  private retryCount = 0;
  private lastSyncTime = 0;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      enableBroadcastChannel: typeof BroadcastChannel !== 'undefined',
      enableLocalStorage: true,
      enableEventBus: true,
      debounceMs: 100,
      maxRetries: 3,
      ...config
    };

    this.initializeBroadcastChannel();
    this.setupStorageListener();
    this.setupPageVisibilityHandler();
  }

  private initializeBroadcastChannel(): void {
    if (this.config.enableBroadcastChannel && typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('finance-tracker-sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.handleIncomingEvent(event.data);
          }
        };
      } catch (error) {
        console.warn('BroadcastChannel not supported, falling back to localStorage:', error);
        this.config.enableBroadcastChannel = false;
      }
    }
  }

  private setupStorageListener(): void {
    if (this.config.enableLocalStorage) {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('finance-tracker-sync-')) {
          try {
            const syncData = JSON.parse(event.newValue || '{}');
            if (syncData.event) {
              this.handleIncomingEvent(syncData.event);
            }
          } catch (error) {
            console.warn('Failed to parse sync event from storage:', error);
          }
        }
      });
    }
  }

  private setupPageVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, request latest data
        this.requestSync();
      }
    });

    // Handle page refresh/close
    window.addEventListener('beforeunload', () => {
      this.savePendingEvents();
    });
  }

  private handleIncomingEvent(event: SyncEvent): void {
    // Ignore events from the same source (to prevent echo)
    if (event.source === this.getSourceId()) {
      return;
    }

    // Add to queue and process
    this.eventQueue.push(event);
    this.processEventQueue();
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process events in order
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift()!;
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Error processing sync events:', error);
      this.retryFailedEvents();
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEvent(event: SyncEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.type) || [];
    
    // Notify all subscribers for this event type
    const promises = subscribers.map(async (subscriber) => {
      try {
        await subscriber.callback(event);
      } catch (error) {
        console.error(`Error in sync subscriber ${subscriber.id}:`, error);
      }
    });

    await Promise.allSettled(promises);

    // Also notify wildcard subscribers
    const wildcardSubscribers = this.subscribers.get('*') || [];
    const wildcardPromises = wildcardSubscribers.map(async (subscriber) => {
      try {
        await subscriber.callback(event);
      } catch (error) {
        console.error(`Error in wildcard sync subscriber ${subscriber.id}:`, error);
      }
    });

    await Promise.allSettled(wildcardPromises);
  }

  private retryFailedEvents(): void {
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.processEventQueue();
      }, 1000 * this.retryCount); // Exponential backoff
    }
  }

  private savePendingEvents(): void {
    if (this.eventQueue.length > 0) {
      try {
        localStorage.setItem(
          'finance-tracker-sync-pending',
          JSON.stringify(this.eventQueue)
        );
      } catch (error) {
        console.warn('Failed to save pending sync events:', error);
      }
    }
  }

  private loadPendingEvents(): void {
    try {
      const pending = localStorage.getItem('finance-tracker-sync-pending');
      if (pending) {
        const events = JSON.parse(pending);
        this.eventQueue = [...events, ...this.eventQueue];
        localStorage.removeItem('finance-tracker-sync-pending');
        this.processEventQueue();
      }
    } catch (error) {
      console.warn('Failed to load pending sync events:', error);
    }
  }

  // Public API methods
  subscribe(eventType: string, callback: (event: SyncEvent) => void, component?: string): () => void {
    const subscriber: SyncSubscriber = {
      id: this.generateSubscriberId(),
      eventType,
      callback,
      component
    };

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(subscriber);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        const index = subscribers.findIndex(sub => sub.id === subscriber.id);
        if (index !== -1) {
          subscribers.splice(index, 1);
        }
        
        if (subscribers.length === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  publish(eventType: string, data: any, source = 'unknown'): void {
    const event: SyncEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
      source: this.getSourceId(),
      id: this.generateEventId()
    };

    // Broadcast to other tabs/windows
    this.broadcastEvent(event);

    // Process locally
    this.handleIncomingEvent(event);
  }

  private broadcastEvent(event: SyncEvent): void {
    // Broadcast via BroadcastChannel
    if (this.config.enableBroadcastChannel && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(event);
      } catch (error) {
        console.warn('Failed to broadcast event:', error);
      }
    }

    // Fallback to localStorage for cross-tab communication
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem(
          `finance-tracker-sync-${event.type}`,
          JSON.stringify({ event, timestamp: Date.now() })
        );
        
        // Clean up after a short delay
        setTimeout(() => {
          localStorage.removeItem(`finance-tracker-sync-${event.type}`);
        }, 1000);
      } catch (error) {
        console.warn('Failed to broadcast event via localStorage:', error);
      }
    }
  }

  private getSourceId(): string {
    // Generate a unique ID for this source
    if (!window.__FINANCE_TRACKER_SOURCE_ID) {
      window.__FINANCE_TRACKER_SOURCE_ID = `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return window.__FINANCE_TRACKER_SOURCE_ID;
  }

  private generateSubscriberId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Request sync from other tabs
  requestSync(): void {
    this.publish('sync-request', { timestamp: Date.now() }, 'sync-manager');
  }

  // Force immediate sync of all data
  async forceSync(): Promise<void> {
    this.publish('force-sync', { timestamp: Date.now() }, 'sync-manager');
    
    // Wait a bit for other tabs to respond
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Get sync statistics
  getStats(): {
    subscribers: number;
    pendingEvents: number;
    lastSyncTime: number;
    retryCount: number;
  } {
    let totalSubscribers = 0;
    this.subscribers.forEach(subs => {
      totalSubscribers += subs.length;
    });

    return {
      subscribers: totalSubscribers,
      pendingEvents: this.eventQueue.length,
      lastSyncTime: this.lastSyncTime,
      retryCount: this.retryCount
    };
  }

  // Cleanup
  destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    
    this.subscribers.clear();
    this.eventQueue = [];
    this.isProcessing = false;
  }
}

// Global instance
export const realtimeSync = new RealtimeSyncManager();

// Convenience functions for common sync events
export const syncSettings = (settings: any, category: string) => {
  realtimeSync.publish('settings-changed', { settings, category }, 'settings');
};

export const syncTheme = (theme: string) => {
  realtimeSync.publish('theme-changed', { theme }, 'theme');
};

export const syncCurrency = (currency: string, dateFormat: string, numberFormat: string) => {
  realtimeSync.publish('currency-changed', { currency, dateFormat, numberFormat }, 'currency');
};

export const syncData = (dataType: string, data: any) => {
  realtimeSync.publish('data-changed', { dataType, data }, 'data');
};

export const syncImportExport = (operation: 'import' | 'export', status: string, details?: any) => {
  realtimeSync.publish('import-export-changed', { operation, status, details }, 'import-export');
};

// Hook for React components
export const useRealtimeSync = (eventType: string, callback: (event: SyncEvent) => void, deps: any[] = []) => {
  const [subscriberId, setSubscriberId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe(eventType, callback);
    setSubscriberId('subscribed');

    return () => {
      unsubscribe();
      setSubscriberId(null);
    };
  }, deps);

  return subscriberId !== null;
};

// Type declarations for global window object
declare global {
  interface Window {
    __FINANCE_TRACKER_SOURCE_ID?: string;
  }
}
