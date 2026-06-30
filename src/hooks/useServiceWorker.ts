'use client';

import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerRegistration {
  installing: ServiceWorker | null;
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
}

interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  offlineReady: boolean;
}

export function useServiceWorker() {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isOnline: navigator.onLine,
    registration: null,
    updateAvailable: false,
    offlineReady: false,
  });

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  // Check service worker support
  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator;
    setStatus(prev => ({ ...prev, isSupported }));

    if (!isSupported) {
      console.warn('Service Worker is not supported in this browser');
      return;
    }

    // Register service worker
    registerServiceWorker();
    
    // Listen for online/offline events
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setStatus(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // Listen for controlling changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      setStatus(prev => ({
        ...prev,
        isRegistered: true,
        registration,
        offlineReady: true
      }));

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, []);

  // Unregister service worker
  const unregisterServiceWorker = useCallback(async () => {
    if (!status.registration) return;

    try {
      // Type assertion for service worker methods
      const registration = status.registration as any;
      if (registration.unregister) {
        await registration.unregister();
      }
      setStatus(prev => ({
        ...prev,
        isRegistered: false,
        registration: null,
        offlineReady: false
      }));
      console.log('Service Worker unregistered');
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
    }
  }, [status.registration]);

  // Apply service worker update
  const applyUpdate = useCallback(() => {
    if (!status.registration || !status.registration.waiting) return;

    status.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [status.registration]);

  // Skip waiting for new service worker
  const skipWaiting = useCallback(() => {
    if (!status.registration) return;

    const registration = status.registration as any;
    if (registration.addEventListener) {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });
    }
  }, [status.registration]);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt || !canInstall) return false;

    try {
      const result = await installPrompt.prompt();
      const outcome = await result.userChoice;
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setCanInstall(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('PWA installation failed:', error);
      return false;
    }
  }, [installPrompt, canInstall]);

  // Clear caches
  const clearCaches = useCallback(async () => {
    if (!status.isSupported) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }, [status.isSupported]);

  // Force refresh
  const forceRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Check for updates manually
  const checkForUpdates = useCallback(async () => {
    if (!status.registration) return false;

    try {
      const registration = status.registration as any;
      if (registration.update) {
        await registration.update();
      }
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }, [status.registration]);

  // Get cache size
  const getCacheSize = useCallback(async () => {
    if (!status.isSupported) return 0;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }, [status.isSupported]);

  // Background sync
  const requestBackgroundSync = useCallback(async (tag: string) => {
    if (!status.registration) {
      return false;
    }

    try {
      const registration = status.registration as any;
      if (registration.sync && registration.sync.register) {
        await registration.sync.register(tag);
      }
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }, [status.registration]);

  // Push notifications
  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (serverPublicKey: string) => {
    if (!status.registration) return null;

    try {
      const registration = status.registration as any;
      if (registration.pushManager && registration.pushManager.subscribe) {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: serverPublicKey
        });
        return subscription;
      }
      return null;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }, [status.registration]);

  // Show notification
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, options);
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }, []);

  return {
    status,
    installPrompt,
    canInstall,
    
    // Actions
    registerServiceWorker,
    unregisterServiceWorker,
    applyUpdate,
    skipWaiting,
    installPWA,
    clearCaches,
    forceRefresh,
    checkForUpdates,
    
    // Utilities
    getCacheSize,
    requestBackgroundSync,
    requestNotificationPermission,
    subscribeToPush,
    showNotification,
  };
}

// Hook for offline functionality
export function useOfflineActions() {
  const [pendingActions, setPendingActions] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingActions();
    };
    
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add action to offline queue
  const queueAction = useCallback(async (action: any) => {
    const newAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Store in IndexedDB
      const db = await openOfflineDB();
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      store.add(newAction);
      
      setPendingActions(prev => [...prev, newAction]);
      return true;
    } catch (error) {
      console.error('Failed to queue action:', error);
      return false;
    }
  }, []);

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (!isOnline) return;

    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');
      
      // Get all actions using a promise wrapper
      const actions = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });

      for (const action of actions) {
        try {
          // Retry the action
          await fetch(action.url, {
            method: action.method,
            headers: action.headers,
            body: action.body,
          });
          
          // Remove from queue on success
          store.delete(action.id);
        } catch (error) {
          console.error('Failed to sync action:', error);
        }
      }

      // Update local state
      const remainingActions = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      setPendingActions(remainingActions);
    } catch (error) {
      console.error('Failed to sync pending actions:', error);
    }
  }, [isOnline]);

  // Get pending actions count
  const getPendingActionsCount = useCallback(async () => {
    try {
      const db = await openOfflineDB();
      const transaction = db.transaction(['pendingActions'], 'readonly');
      const store = transaction.objectStore('pendingActions');
      
      // Get all actions using a promise wrapper
      const actions = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
      
      return actions.length;
    } catch (error) {
      console.error('Failed to get pending actions count:', error);
      return 0;
    }
  }, []);

  return {
    isOnline,
    pendingActions,
    queueAction,
    syncPendingActions,
    getPendingActionsCount,
  };
}

// Helper to open IndexedDB
async function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinanceTrackerOffline', 1);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    
    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
  });
}
