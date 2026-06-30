import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { useRealtime } from './useRealtime';

export function useRecycleBinCount() {
  const [count, setCount] = useState(0);
  const { subscribe } = useRealtime();

  const getCount = useCallback(() => {
    try {
      const items = db.getRecycleBinItems();
      setCount(items.length);
    } catch (error) {
      console.error('Error getting recycle bin count:', error);
      setCount(0);
    }
  }, []);

  useEffect(() => {
    getCount();

    const handleStorageChange = () => {
      getCount();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getCount]);

  // Listen for real-time events that affect recycle bin count
  useEffect(() => {
    const unsubscribeTransaction = subscribe('transaction', (event) => {
      console.log('Transaction event for recycle bin count:', event);
      
      // Update count for delete events (items moved to recycle bin) and create events (items restored)
      if (event.action === 'delete' || event.action === 'create') {
        const timer = setTimeout(() => {
          getCount();
        }, 100);
        return () => clearTimeout(timer);
      }
    });

    const unsubscribeBudget = subscribe('budget', (event) => {
      console.log('Budget event for recycle bin count:', event);
      
      // Update count for delete events (items moved to recycle bin) and create events (items restored)
      if (event.action === 'delete' || event.action === 'create') {
        const timer = setTimeout(() => {
          getCount();
        }, 100);
        return () => clearTimeout(timer);
      }
    });

    const unsubscribeNotification = subscribe('notification', (event) => {
      console.log('Notification event for recycle bin count:', event);
      
      // Update count for any notification event (permanent deletes, empty recycle bin, restores)
      const timer = setTimeout(() => {
        getCount();
      }, 100);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribeTransaction();
      unsubscribeBudget();
      unsubscribeNotification();
    };
  }, [subscribe, getCount]);

  return count;
}
