import { useState, useEffect, useCallback } from 'react';
import { Budget } from '@/lib/types';
import { db } from '@/lib/db';
import { useRealtimeBudgets } from './useRealtime';

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const { notifyBudgetChange, lastBudgetEvent } = useRealtimeBudgets();

  const loadBudgets = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getBudgets();
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed as it only uses external functions

  useEffect(() => {
    loadBudgets();

    const handleStorageChange = () => {
      loadBudgets();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadBudgets]); // Include loadBudgets in dependencies

  // Listen for real-time budget events
  useEffect(() => {
    if (lastBudgetEvent) {
      console.log('Real-time budget event received:', lastBudgetEvent);
      
      // Note: Toast notifications are handled by useNotifications hook to avoid duplicates
      
      // Reload budgets to get the latest data
      const timer = setTimeout(() => {
        loadBudgets();
      }, 100); // Small delay to ensure database is updated

      return () => clearTimeout(timer);
    }
  }, [lastBudgetEvent, loadBudgets]);

  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    try {
      // Validate budget amount is not negative
      if (budget.amount < 0) {
        throw new Error('Budget amount cannot be negative');
      }
      
      const newBudget = db.addBudget(budget);
      
      // Update local state immediately
      setBudgets(prev => [...prev, newBudget]);
      
      // Emit real-time event after state update (with proper delay)
      console.log('Budget creation: Emitting real-time event', { budgetId: newBudget.id });
      setTimeout(() => {
        notifyBudgetChange('create', newBudget);
      }, 50);
      
      return newBudget;
    } catch (error) {
      console.error('Error adding budget:', error);
      throw error;
    }
  }, [notifyBudgetChange]);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    try {
      // Validate budget amount is not negative if being updated
      if (updates.amount !== undefined && updates.amount < 0) {
        throw new Error('Budget amount cannot be negative');
      }
      
      const updated = db.updateBudget(id, updates);
      if (updated) {
        setBudgets(prev => 
          prev.map(b => b.id === id ? updated : b)
        );
        
        // Emit real-time event after state update (with proper delay)
        console.log('Budget update: Emitting real-time event', { budgetId: updated.id });
        setTimeout(() => {
          notifyBudgetChange('update', updated);
        }, 50);
      }
      return updated;
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }, [notifyBudgetChange]);

  const deleteBudget = useCallback((id: string) => {
    try {
      // Get the budget to delete before deletion
      const budgetToDelete = budgets.find(b => b.id === id);
      const success = db.deleteBudget(id);
      
      if (success) {
        // Update local state immediately
        setBudgets(prev => prev.filter(b => b.id !== id));
        
        // Emit real-time event after state update (with proper delay)
        if (budgetToDelete) {
          console.log('Budget deletion: Emitting real-time event', { budgetId: budgetToDelete.id });
          setTimeout(() => {
            notifyBudgetChange('delete', budgetToDelete);
          }, 50);
        }
      }
      return success;
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }, [budgets, notifyBudgetChange]);

  const getBudgetByCategory = useCallback((category: string) => {
    return budgets.find(b => b.category === category);
  }, [budgets]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetByCategory,
    refreshBudgets: loadBudgets,
  };
}
