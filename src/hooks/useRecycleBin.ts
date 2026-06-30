import { useState, useEffect, useCallback } from 'react';
import { RecycleBinItem } from '@/lib/types';
import { db } from '@/lib/db';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { useRealtime } from './useRealtime';
import { toast } from 'sonner';

export function useRecycleBin() {
  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { subscribe, emit } = useRealtime();

  const loadItems = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getRecycleBinItems();
      // Sort by deletedAt date (newest first)
      const sortedItems = data.sort((a, b) => 
        new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
      );
      setItems(sortedItems);
    } catch (error) {
      console.error('Error loading recycle bin items:', error);
      toast.error('Failed to load recycle bin items. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version to prevent event storms
  const debouncedLoadItems = useDebounceCallback(loadItems, 300);

  useEffect(() => {
    loadItems();

    const handleStorageChange = () => {
      debouncedLoadItems();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [debouncedLoadItems]);

  // Listen for real-time events that affect recycle bin
  useEffect(() => {
    const unsubscribeTransaction = subscribe('transaction', (event) => {
      console.log('Transaction event for recycle bin:', event);
      
      // Only reload for delete events (items moved to recycle bin)
      if (event.action === 'delete') {
        const timer = setTimeout(() => {
          loadItems();
        }, 100);
        return () => clearTimeout(timer);
      }
    });

    const unsubscribeNotification = subscribe('notification', (event) => {
      console.log('Notification event for recycle bin:', event);
      
      // Reload for any notification event (permanent deletes, empty recycle bin)
      const timer = setTimeout(() => {
        loadItems();
      }, 100);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribeTransaction();
      unsubscribeNotification();
    };
  }, [subscribe, loadItems]);

  const restoreItem = useCallback((id: string) => {
    try {
      const itemToRestore = items.find(item => item.id === id);
      const success = db.restoreFromRecycleBin(id);
      
      if (success) {
        loadItems(); // Refresh items
        
        // Emit real-time event for restore
        if (itemToRestore) {
          emit({
            type: itemToRestore.type as 'transaction' | 'category' | 'budget' | 'account' | 'template',
            action: 'create', // Restoration is like creation
            data: {
              item: itemToRestore,
              action: 'restore',
              timestamp: new Date().toISOString()
            }
          });
          
          // Show success message
          toast.success(`${itemToRestore.type.charAt(0).toUpperCase() + itemToRestore.type.slice(1)} restored successfully!`);
        }
      }
      return success;
    } catch (error) {
      console.error('Error restoring item:', error);
      throw error;
    }
  }, [items, loadItems, emit]);

  const permanentDeleteItem = useCallback((id: string) => {
    try {
      const itemToDelete = items.find(item => item.id === id);
      const success = db.permanentDeleteFromRecycleBin(id);
      
      if (success) {
        loadItems(); // Refresh items
        
        // Emit real-time event for permanent delete
        if (itemToDelete) {
          emit({
            type: 'notification', // Use notification type for permanent delete
            action: 'delete',
            data: {
              item: itemToDelete,
              action: 'permanent_delete',
              timestamp: new Date().toISOString()
            }
          });
          
          // Show success message
          toast.warning(`${itemToDelete.type.charAt(0).toUpperCase() + itemToDelete.type.slice(1)} permanently deleted`);
        }
      }
      return success;
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      throw error;
    }
  }, [items, loadItems, emit]);

  const emptyRecycleBin = useCallback(() => {
    try {
      const itemsToDelete = [...items]; // Copy current items
      const success = db.emptyRecycleBin();
      
      if (success) {
        loadItems(); // Refresh items
        
        // Emit real-time event for empty recycle bin
        emit({
          type: 'notification',
          action: 'delete',
          data: {
            items: itemsToDelete,
            action: 'empty_recycle_bin',
            timestamp: new Date().toISOString()
          }
        });
        
        // Show success message
        toast.success(`Recycle bin emptied (${itemsToDelete.length} items permanently deleted)`);
      }
      return success;
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      throw error;
    }
  }, [items, loadItems, emit]);

  const getItemDescription = useCallback((item: RecycleBinItem) => {
    switch (item.type) {
      case 'transaction':
        const transaction = item.data;
        const amount = transaction.type === 'income' 
          ? `+${formatCurrency(transaction.amount)}` 
          : `-${formatCurrency(transaction.amount)}`;
        return `${transaction.description} (${amount})`;
      case 'category':
        return `${item.data.name} (${item.data.type})`;
      case 'budget':
        // Resolve category name from ID if needed
        let budgetName = item.data.category || item.data.name || 'Unknown Budget';
        
        // If category is an ID (not a name), try to resolve it using categories hook
        if (budgetName && budgetName.length === 36 && /^[0-9a-f-]{36}$/.test(budgetName)) {
          // This looks like a UUID, try to get the actual category name
          const category = categories.find((c: any) => c.id === budgetName);
          if (category && category.name) {
            budgetName = category.name;
          }
        }
        
        return `${budgetName} - ${formatCurrency(item.data.amount)}`;
      case 'account':
        return `${item.data.name} - ${formatCurrency(item.data.balance)}`;
      case 'template':
        return `${item.data.name} - ${formatCurrency(item.data.amount)}`;
      default:
        return 'Unknown item';
    }
  }, [formatCurrency, categories]);

  const getItemTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'transaction':
        return 'Transaction';
      case 'category':
        return 'Category';
      case 'budget':
        return 'Budget';
      case 'account':
        return 'Account';
      case 'template':
        return 'Template';
      default:
        return 'Unknown';
    }
  }, []);

  const getItemsByType = useCallback((type: string) => {
    return items.filter(item => item.type === type);
  }, [items]);

  const getItemCountByType = useCallback(() => {
    const counts = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return counts;
  }, [items]);

  const getOldItems = useCallback((days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return items.filter(item => 
      new Date(item.deletedAt) < cutoffDate
    );
  }, [items]);

  return {
    items,
    loading,
    restoreItem,
    permanentDeleteItem,
    emptyRecycleBin,
    getItemDescription,
    getItemTypeLabel,
    getItemsByType,
    getItemCountByType,
    getOldItems,
    refreshItems: loadItems,
  };
}
