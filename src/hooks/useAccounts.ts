import { useState, useEffect, useCallback } from 'react';
import { Account } from '@/lib/types';
import { db } from '@/lib/db';
import { useRealtimeAccounts } from './useRealtime';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for retry logic with exponential backoff
async function withRetry<T>(
  operation: () => T,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError!;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAccount, setAddingAccount] = useState(false);
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const { notifyAccountChange, lastAccountEvent } = useRealtimeAccounts();

  const loadAccounts = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();

    const handleStorageChange = () => {
      loadAccounts();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAccounts]);

  // Listen for real-time account events
  useEffect(() => {
    if (lastAccountEvent) {
      console.log('Real-time account event received:', lastAccountEvent);
      
      // Note: Toast notifications are handled by useNotifications hook to avoid duplicates
      
      // Reload accounts to get the latest data
      const timer = setTimeout(() => {
        loadAccounts();
      }, 100); // Small delay to ensure database is updated

      return () => clearTimeout(timer);
    }
  }, [lastAccountEvent, loadAccounts]);

  const addAccount = useCallback(async (account: Omit<Account, 'id'>) => {
    setAddingAccount(true);
    try {
      const newAccount = await withRetry(() => db.addAccount(account));
      
      // Update local state immediately
      setAccounts(prev => [...prev, newAccount]);
      
      // Emit real-time event after state update (deferred to avoid render issues)
      console.log('Account creation: Emitting real-time event', { accountId: newAccount.id });
      setTimeout(() => {
        notifyAccountChange('create', newAccount);
      }, 50);
      
      return newAccount;
    } catch (error) {
      console.error('Error adding account after retries:', error);
      throw new Error(`Failed to add account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingAccount(false);
    }
  }, [notifyAccountChange]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    setUpdatingAccount(id);
    try {
      const updated = await withRetry(() => db.updateAccount(id, updates));
      if (updated) {
        setAccounts(prev => 
          prev.map(a => a.id === id ? updated : a)
        );
        
        // Emit real-time event after state update (deferred to avoid render issues)
        console.log('Account update: Emitting real-time event', { accountId: updated.id });
        setTimeout(() => {
          notifyAccountChange('update', updated);
        }, 50);
      }
      return updated;
    } catch (error) {
      console.error('Error updating account after retries:', error);
      throw new Error(`Failed to update account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingAccount(null);
    }
  }, [notifyAccountChange]);

  const deleteAccount = useCallback(async (id: string) => {
    setDeletingAccount(id);
    try {
      const accountToDelete = accounts.find(a => a.id === id);
      const success = await withRetry(() => db.deleteAccount(id));
      if (success) {
        setAccounts(prev => prev.filter(a => a.id !== id));
        
        // Emit real-time event after state update (deferred to avoid render issues)
        if (accountToDelete) {
          console.log('Account deletion: Emitting real-time event', { accountId: accountToDelete.id });
          setTimeout(() => {
            notifyAccountChange('delete', accountToDelete);
          }, 50);
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting account after retries:', error);
      throw new Error(`Failed to delete account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingAccount(null);
    }
  }, [notifyAccountChange, accounts]);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(a => a.id === id);
  }, [accounts]);

  const getTotalBalance = useCallback(() => {
    return accounts.reduce((total, account) => {
      // Validate account structure
      if (!account || typeof account.balance !== 'number') {
        console.warn('Invalid account data in getTotalBalance:', account);
        return total;
      }
      
      if (account.type === 'credit') {
        return total - Math.abs(account.balance);
      }
      return total + account.balance;
    }, 0);
  }, [accounts]);

  return {
    accounts,
    loading,
    addingAccount,
    updatingAccount,
    deletingAccount,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    getTotalBalance,
    refreshAccounts: loadAccounts,
  };
}
