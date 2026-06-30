import { useState, useEffect, useCallback, useRef } from 'react';
import { DashboardStats } from '@/lib/types';
import { useTransactions } from './useTransactions';
import { useCategories } from './useCategories';
import { useBudgets } from './useBudgets';
import { useAccounts } from './useAccounts';
import { useRealtime } from './useRealtime';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCurrencyConversion } from './useCurrencyConversion';
import { getMonthStart, getMonthEnd, parseDateWithTimezone } from '@/lib/utils';
import { calculatePeriodSpending, getPeriodDisplayText } from '@/utils/period-aware-calculations';

export function useDashboardStats(recentTransactionsLimit: number = 10) {
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const { accounts, getTotalBalance } = useAccounts();
  const { subscribe } = useRealtime();
  const { formatCurrency, currency: baseCurrency } = useCurrency();
  const { convertAmount } = useCurrencyConversion();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isCalculatingRef = useRef(false);
  const manualRefreshRef = useRef(false);

  const calculateStats = useCallback(() => {
    // Prevent race conditions by checking if already calculating
    if (isCalculatingRef.current) {
      console.log('Dashboard stats: Calculation already in progress, skipping');
      return;
    }
    
    isCalculatingRef.current = true;
    setLoading(true);
    
    try {
      if (!transactions || !Array.isArray(transactions)) {
        console.warn('Invalid transactions data:', transactions);
        setStats(null);
        isCalculatingRef.current = false;
        setLoading(false);
        return;
      }
      
      if (!budgets || !Array.isArray(budgets)) {
        console.warn('Invalid budgets data:', budgets);
        setStats(null);
        isCalculatingRef.current = false;
        setLoading(false);
        return;
      }

      const now = new Date();
      const monthStart = getMonthStart(now);
      const monthEnd = getMonthEnd(now);
      
      // Filter transactions for current month with validation and timezone handling
      const currentMonthTransactions = transactions.filter(t => {
        if (!t || !t.date) return false;
        const transactionDate = parseDateWithTimezone(t.date);
        if (isNaN(transactionDate.getTime())) return false;
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Calculate monthly income and expenses with validation
      const monthlyIncome = currentMonthTransactions
        .filter(t => t.type === 'income' && typeof t.amount === 'number' && !isNaN(t.amount))
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount))
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate total balance from accounts
      const totalBalance = getTotalBalance() || 0;

      // Calculate net worth (assets - liabilities)
      // Liabilities include credit accounts (negative balances)
      const liabilities = accounts.reduce((total, account) => {
        if (!account || typeof account.balance !== 'number') return total;
        if (account.type === 'credit') {
          return total + Math.abs(account.balance);
        }
        return total;
      }, 0);
      const netWorth = totalBalance - liabilities;

      // Get recent transactions (configurable limit)
      const recentTransactions = transactions
        .filter(t => t && t.id && t.date) // Ensure transaction has required fields
        .filter(t => !t.deletedAt) // Exclude soft-deleted transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, recentTransactionsLimit);

      // Calculate additional stats for sidebar badges
      const transactionCount = transactions.filter(t => !t.deletedAt).length;
      const accountCount = accounts.length;
      const budgetCount = budgets.length;
      
      // Log budget count for debugging
      console.log('Dashboard stats: Budget count calculated', {
        totalBudgets: budgets.length,
        budgetCount: budgetCount,
        budgets: budgets.map(b => ({ id: b.id, category: b.category, amount: b.amount }))
      });
      const lowBalanceAccounts = accounts.filter((acc: any) => acc.balance < 100).length;
      const overdueTransactions = transactions.filter(t => 
        !t.deletedAt && 
        t.type === 'expense' && 
        parseDateWithTimezone(t.date) < new Date() // Overdue if date is in the past
      ).length;
      const activeGoals = 0; // Could be calculated from goals data
      const hasReports = currentMonthTransactions.length > 0;

      // Calculate category breakdown for expenses
      // Use a Map to aggregate by category ID to prevent duplicates
      const categoryMap = new Map<string, number>();
      currentMonthTransactions
        .filter(t => t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount))
        .forEach(t => {
          const current = categoryMap.get(t.category) || 0;
          categoryMap.set(t.category, current + t.amount);
        });

      // Map category IDs to names with deduplication
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([categoryId, amount]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          category: category?.name || categoryId, // Fallback to category ID if not found
          amount,
          percentage: 0, // Will be calculated below
        };
      });

      // Calculate percentages for category breakdown with zero division protection
      const totalExpenses = categoryBreakdown.reduce((sum, item) => sum + (typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0), 0);
      categoryBreakdown.forEach(item => {
        const validAmount = typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0;
        item.percentage = totalExpenses > 0 ? Math.round((validAmount / totalExpenses) * 100) : 0;
      });

      // Sort category breakdown by amount (descending)
      categoryBreakdown.sort((a, b) => b.amount - a.amount);

      // Calculate budget breakdown with period-aware spending
      const budgetBreakdown = budgets.map(budget => {
        const spent = calculatePeriodSpending(budget, transactions);
        
        const remaining = budget.amount - spent;
        const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        // Get category name for display
        const category = categories.find(c => c.id === budget.category);
        const categoryName = category?.name || budget.category;
        
        return {
          category: categoryName,
          budget: budget.amount,
          spent,
          remaining,
          percentageUsed,
          status: percentageUsed > 100 ? 'over-budget' : 
                  percentageUsed >= 80 ? 'near-limit' : 'on-track' as 'on-track' | 'near-limit' | 'over-budget',
          period: getPeriodDisplayText(budget)
        };
      });

      const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalSpent = budgetBreakdown.reduce((sum, item) => sum + item.spent, 0);
      const overBudgetCount = budgetBreakdown.filter(item => item.status === 'over-budget').length;
      
      // Determine overall budget health
      let budgetHealth: 'healthy' | 'warning' | 'critical';
      if (overBudgetCount > 0) {
        budgetHealth = 'critical';
      } else if (budgetBreakdown.filter(item => item.status === 'near-limit').length > 0) {
        budgetHealth = 'warning';
      } else {
        budgetHealth = 'healthy';
      }

      // Calculate monthly trend for the last 6 months
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const trendStart = getMonthStart(trendDate);
        const trendEnd = getMonthEnd(trendDate);
        
        const trendTransactions = transactions.filter(t => {
          const transactionDate = parseDateWithTimezone(t.date);
          if (isNaN(transactionDate.getTime())) return false;
          return transactionDate >= trendStart && transactionDate <= trendEnd;
        });

        const trendIncome = trendTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const trendExpenses = trendTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        monthlyTrend.push({
          month: trendDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          income: trendIncome,
          expenses: trendExpenses,
        });
      }

      const dashboardStats: DashboardStats = {
        totalBalance,
        monthlyIncome,
        monthlyExpenses,
        netWorth,
        recentTransactions,
        categoryBreakdown,
        monthlyTrend,
        budgetBreakdown,
        totalBudget,
        totalSpent,
        budgetHealth,
        transactionCount,
        accountCount,
        budgetCount,
        lowBalanceAccounts,
        overdueTransactions,
        activeGoals,
        hasReports,
      };

      setStats(dashboardStats);
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      setStats(null);
    } finally {
      setLoading(false);
      isCalculatingRef.current = false;
    }
  }, [transactions, getTotalBalance, budgets, recentTransactionsLimit]);

  useEffect(() => {
    calculateStats();

    // Listen for storage changes to refresh stats in real-time
    const handleStorageChange = () => {
      // Skip if manual refresh is in progress
      if (manualRefreshRef.current) {
        console.log('Dashboard stats: Skipping storage change during manual refresh');
        return;
      }
      // Small delay to ensure data is written
      setTimeout(calculateStats, 100);
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for real-time events
    const unsubscribers = [
      subscribe('transaction', (event) => {
        // Skip if manual refresh is in progress
        if (manualRefreshRef.current) {
          console.log('Dashboard stats: Skipping transaction event during manual refresh');
          return;
        }
        console.log('Dashboard stats: Transaction event received', event);
        setTimeout(calculateStats, 50);
      }),
      subscribe('budget', (event) => {
        // Skip if manual refresh is in progress
        if (manualRefreshRef.current) {
          console.log('Dashboard stats: Skipping budget event during manual refresh');
          return;
        }
        console.log('Dashboard stats: Budget event received', event);
        // Use a longer delay for budget events to ensure database is updated
        setTimeout(calculateStats, 200);
      }),
      subscribe('account', (event) => {
        // Skip if manual refresh is in progress
        if (manualRefreshRef.current) {
          console.log('Dashboard stats: Skipping account event during manual refresh');
          return;
        }
        console.log('Dashboard stats: Account event received', event);
        setTimeout(calculateStats, 50);
      }),
      subscribe('category', (event) => {
        // Skip if manual refresh is in progress
        if (manualRefreshRef.current) {
          console.log('Dashboard stats: Skipping category event during manual refresh');
          return;
        }
        console.log('Dashboard stats: Category event received', event);
        setTimeout(calculateStats, 50);
      }),
      subscribe('notification', (event) => {
        // Skip if manual refresh is in progress
        if (manualRefreshRef.current) {
          console.log('Dashboard stats: Skipping notification event during manual refresh');
          return;
        }
        console.log('Dashboard stats: Notification event received', event);
        // Also listen for notification events (like budget restores from recycle bin)
        setTimeout(calculateStats, 100);
      })
    ];

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [calculateStats, subscribe]);

  // Also listen for direct budget changes
  useEffect(() => {
    if (budgets) {
      console.log('Dashboard stats: Budgets changed, recalculating stats', budgets.length);
      // Add a small delay to ensure all state updates are processed
      setTimeout(calculateStats, 100);
    }
  }, [budgets, calculateStats]);

  const refreshStats = useCallback(() => {
    manualRefreshRef.current = true;
    calculateStats();
    // Reset flag after a short delay
    setTimeout(() => {
      manualRefreshRef.current = false;
    }, 500);
  }, [calculateStats]);

  return {
    stats,
    loading,
    refreshStats,
  };
}
