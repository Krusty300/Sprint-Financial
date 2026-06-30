'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { localStorageCache, memoryCache } from '@/lib/cache';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense';
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
}

interface PrecomputedStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  transactionCount: number;
  accountCount: number;
  budgetCount: number;
  hasReports: boolean;
  categoryBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  monthlyTrend: Array<{ month: string; income: number; expenses: number; net: number }>;
  recentTransactions: Transaction[];
  budgetBreakdown: Array<{ name: string; budget: number; spent: number; percentage: number }>;
  topCategories: Array<{ category: string; amount: number; count: number }>;
  averageTransactionAmount: number;
  largestExpense: Transaction | null;
  largestIncome: Transaction | null;
  savingsRate: number;
  lastUpdated: number;
}

const STATS_CACHE_KEY = 'precomputed_stats';
const STATS_TTL = 5 * 60 * 1000; // 5 minutes

// Computation functions
class StatsCalculator {
  static calculateBasicStats(transactions: Transaction[], accounts: Account[], budgets: Budget[]) {
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const transactionCount = transactions.length;
    const accountCount = accounts.length;
    const budgetCount = budgets.length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const netWorth = totalBalance + monthlyIncome - monthlyExpenses;

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      netWorth,
      transactionCount,
      accountCount,
      budgetCount,
    };
  }

  static calculateCategoryBreakdown(transactions: Transaction[]) {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const totalExpenses = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }

  static calculateMonthlyTrend(transactions: Transaction[]) {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: 0,
        expenses: 0,
        net: 0,
      };
    }).reverse();

    transactions.forEach(t => {
      const transactionDate = new Date(t.date);
      const monthYear = transactionDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const monthData = last12Months.find(m => m.month === monthYear);
      
      if (monthData) {
        if (t.type === 'income') {
          monthData.income += t.amount;
        } else {
          monthData.expenses += Math.abs(t.amount);
        }
        monthData.net = monthData.income - monthData.expenses;
      }
    });

    return last12Months;
  }

  static calculateTopCategories(transactions: Transaction[]) {
    const categoryStats = transactions.reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = { amount: 0, count: 0 };
      }
      acc[t.category].amount += Math.abs(t.amount);
      acc[t.category].count += 1;
      return acc;
    }, {} as Record<string, { amount: number; count: number }>);

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({ category, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }

  static calculateBudgetBreakdown(budgets: Budget[]) {
    return budgets.map(budget => ({
      name: budget.name,
      budget: budget.amount,
      spent: budget.spent,
      percentage: budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0,
    })).sort((a, b) => b.percentage - a.percentage);
  }

  static calculateAdvancedMetrics(transactions: Transaction[]) {
    const amounts = transactions.map(t => Math.abs(t.amount));
    const averageTransactionAmount = amounts.length > 0 
      ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length 
      : 0;

    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    const largestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max)
      : null;

    const largestIncome = incomes.length > 0 
      ? incomes.reduce((max, t) => t.amount > max.amount ? t : max)
      : null;

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return {
      averageTransactionAmount,
      largestExpense,
      largestIncome,
      savingsRate,
    };
  }
}

export function usePrecomputedStats(
  transactions: Transaction[] = [],
  accounts: Account[] = [],
  budgets: Budget[] = []
) {
  const [stats, setStats] = useState<PrecomputedStats | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [lastComputationTime, setLastComputationTime] = useState<number>(0);

  // Check if cached stats are still valid
  const isCacheValid = useCallback((cachedStats: PrecomputedStats): boolean => {
    const now = Date.now();
    const age = now - cachedStats.lastUpdated;
    return age < STATS_TTL;
  }, []);

  // Compute all statistics
  const computeStats = useCallback(async (
    txs: Transaction[],
    accs: Account[],
    bdgs: Budget[]
  ): Promise<PrecomputedStats> => {
    setIsComputing(true);
    
    try {
      // Use Web Workers for heavy computations if available
      const startTime = performance.now();

      const basicStats = StatsCalculator.calculateBasicStats(txs, accs, bdgs);
      const categoryBreakdown = StatsCalculator.calculateCategoryBreakdown(txs);
      const monthlyTrend = StatsCalculator.calculateMonthlyTrend(txs);
      const topCategories = StatsCalculator.calculateTopCategories(txs);
      const budgetBreakdown = StatsCalculator.calculateBudgetBreakdown(bdgs);
      const advancedMetrics = StatsCalculator.calculateAdvancedMetrics(txs);

      const recentTransactions = txs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      const computedStats: PrecomputedStats = {
        ...basicStats,
        categoryBreakdown,
        monthlyTrend,
        recentTransactions,
        budgetBreakdown,
        topCategories,
        ...advancedMetrics,
        hasReports: txs.length > 0,
        lastUpdated: Date.now(),
      };

      const computationTime = performance.now() - startTime;
      console.log(`Stats computed in ${computationTime.toFixed(2)}ms`);

      // Cache the results
      localStorageCache.set(STATS_CACHE_KEY, computedStats, { ttl: STATS_TTL });
      memoryCache.set(STATS_CACHE_KEY, computedStats, STATS_TTL);

      setLastComputationTime(Date.now());
      return computedStats;
    } finally {
      setIsComputing(false);
    }
  }, []);

  // Load cached stats or compute new ones
  const loadStats = useCallback(async (force = false) => {
    // Try memory cache first
    let cachedStats = memoryCache.get<PrecomputedStats>(STATS_CACHE_KEY);
    
    if (!cachedStats && !force) {
      // Try localStorage cache
      cachedStats = localStorageCache.get<PrecomputedStats>(STATS_CACHE_KEY);
    }

    if (cachedStats && !force && isCacheValid(cachedStats)) {
      setStats(cachedStats);
      return cachedStats;
    }

    // Compute fresh stats
    const freshStats = await computeStats(transactions, accounts, budgets);
    setStats(freshStats);
    return freshStats;
  }, [transactions, accounts, budgets, computeStats, isCacheValid]);

  // Initial load and data change handling
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Incremental updates for better performance
  const updateStatsIncremental = useCallback((
    newTransactions: Transaction[],
    newAccounts: Account[],
    newBudgets: Budget[]
  ) => {
    if (!stats) return;

    // For small changes, we can update specific parts
    const hasNewTransactions = newTransactions.length > transactions.length;
    const hasNewAccounts = newAccounts.length > accounts.length;
    const hasNewBudgets = newBudgets.length > budgets.length;

    if (hasNewTransactions || hasNewAccounts || hasNewBudgets) {
      // Debounce the recomputation
      const timeoutId = setTimeout(() => {
        loadStats(true);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [stats, transactions, accounts, budgets, loadStats]);

  // Get specific stat quickly
  const getStat = useCallback(<K extends keyof PrecomputedStats>(key: K): PrecomputedStats[K] | null => {
    return stats?.[key] ?? null;
  }, [stats]);

  // Refresh stats
  const refreshStats = useCallback(() => {
    return loadStats(true);
  }, [loadStats]);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorageCache.delete(STATS_CACHE_KEY);
    memoryCache.delete(STATS_CACHE_KEY);
    setStats(null);
  }, []);

  // Export stats
  const exportStats = useCallback(() => {
    return stats ? JSON.stringify(stats) : null;
  }, [stats]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    isComputing,
    lastComputationTime,
    cacheAge: stats ? Date.now() - stats.lastUpdated : 0,
    isCacheValid: stats ? isCacheValid(stats) : false,
  }), [isComputing, lastComputationTime, stats, isCacheValid]);

  return {
    stats,
    isComputing,
    performanceMetrics,
    getStat,
    refreshStats,
    clearCache,
    exportStats,
    computeStats: () => computeStats(transactions, accounts, budgets),
  };
}

// Hook for real-time stats updates
export function useRealTimeStats() {
  const [realTimeStats, setRealTimeStats] = useState<Partial<PrecomputedStats>>({});
  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time updates (replace with actual WebSocket/Server-Sent Events)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        // In a real app, this would receive updates from a server
        setRealTimeStats(prev => ({
          ...prev,
          lastUpdated: Date.now(),
        }));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected]);

  const connect = useCallback(() => {
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
  }, []);

  const updateRealTimeStat = useCallback(<K extends keyof PrecomputedStats>(
    key: K,
    value: PrecomputedStats[K]
  ) => {
    setRealTimeStats(prev => ({
      ...prev,
      [key]: value,
      lastUpdated: Date.now(),
    }));
  }, []);

  return {
    realTimeStats,
    isConnected,
    connect,
    disconnect,
    updateRealTimeStat,
  };
}
