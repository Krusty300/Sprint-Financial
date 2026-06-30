import { useState, useCallback } from 'react';
import { Budget } from '@/lib/types';
import { db } from '@/lib/db';

export interface BudgetHistoryEntry {
  id: string;
  budgetId: string;
  timestamp: number;
  changeType: 'created' | 'updated' | 'archived' | 'restored' | 'deleted';
  changes: {
    amount?: { from: number; to: number };
    period?: { from: string; to: string };
    category?: { from: string; to: string };
    rolloverEnabled?: { from: boolean; to: boolean };
    notes?: { from: string; to: string };
  };
  previousState?: Partial<Budget>;
  newState?: Partial<Budget>;
}

export function useBudgetHistory() {
  const [history, setHistory] = useState<BudgetHistoryEntry[]>([]);

  const addHistoryEntry = useCallback(async (entry: Omit<BudgetHistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: BudgetHistoryEntry = {
      ...entry,
      id: `${entry.budgetId}-${Date.now()}`,
      timestamp: Date.now(),
    };

    setHistory(prev => [...prev, newEntry]);

    // In a real app, you would save this to a database
    // await db.addBudgetHistoryEntry(newEntry);
  }, []);

  const getBudgetHistory = useCallback((budgetId: string) => {
    return history.filter(entry => entry.budgetId === budgetId);
  }, [history]);

  const cleanupOldHistory = useCallback((monthsToKeep: number = 6) => {
    const cutoffDate = Date.now() - (monthsToKeep * 30 * 24 * 60 * 60 * 1000);
    setHistory(prev => prev.filter(entry => entry.timestamp > cutoffDate));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addHistoryEntry,
    getBudgetHistory,
    cleanupOldHistory,
    clearHistory,
  };
}
