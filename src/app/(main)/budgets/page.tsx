'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useBudgetSync } from '@/hooks/useBudgetSync';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useItemAnimation } from '@/hooks/useUpdateAnimation';
import { useBudgetHistory } from '@/hooks/useBudgetHistory';
import { BudgetForm } from '@/components/forms/BudgetForm';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetCardWrapper } from '@/components/budgets/BudgetCardWrapper';
import { BudgetSummary } from '@/components/budgets/BudgetSummary';
import { DeleteBudgetDialog } from '@/components/dialogs/DeleteBudgetDialog';
import { ArchivedBudgetsView } from '@/components/budgets/ArchivedBudgetsView';
import { BudgetHistoryTimeline } from '@/components/budgets/BudgetHistoryTimeline';
import { ArchiveCleanupSettings } from '@/components/budgets/ArchiveCleanupSettings';
import { BudgetComparisonChart } from '@/components/charts/BudgetComparisonChart';
import { BudgetTrendChart } from '@/components/charts/BudgetTrendChart';
import { SafeChart } from '@/components/charts/ChartErrorBoundary';
import { Budget } from '@/lib/types';
import { BudgetErrorBoundary, BudgetErrorFallback } from '@/components/error/BudgetErrorBoundary';
import { Plus, PiggyBank, TrendingUp, AlertCircle, Target, Search, Filter, ArrowUpDown, Archive, Copy, CheckSquare2, Trash2 } from 'lucide-react';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';
import { calculatePeriodSpending, getPeriodDisplayText } from '@/utils/period-aware-calculations';
import { cleanupArchivedBudgets } from '@/utils/archive-cleanup';

export default function BudgetsPage() {
  const { resolvedTheme } = useTheme();
  const { budgets, loading, addBudget, updateBudget, deleteBudget, lastUpdate } = useBudgetSync();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { history, addHistoryEntry, getBudgetHistory } = useBudgetHistory();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedBudgetForHistory, setSelectedBudgetForHistory] = useState<Budget | null>(null);
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'over-budget' | 'near-limit' | 'on-track'>('all');
  const [sortBy, setSortBy] = useState<'amount' | 'percentage' | 'period' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Bulk selection state
  const [selectedBudgetIds, setSelectedBudgetIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Animation state for budget updates
  const [updatedBudgetId, setUpdatedBudgetId] = useState<string | null>(null);
  const { shouldAnimate: shouldAnimateSummary, triggerItemAnimation: triggerSummaryAnimation } = useItemAnimation('summary', updatedBudgetId);

  // Memoize category lookups to avoid repeated filtering
  const expenseCategories = useMemo(() => 
    categories.filter(cat => cat.type === 'expense'), 
    [categories]
  );

  // Memoize current month transactions to avoid repeated filtering
  const currentMonthTransactions = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions.filter(t => {
      if (!t.date) return false;
      const transactionDate = new Date(t.date);
      return !isNaN(transactionDate.getTime()) &&
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });
  }, [transactions]);

  // Auto-cleanup old archived budgets on page load
  useEffect(() => {
    const runAutoCleanup = async () => {
      try {
        const result = await cleanupArchivedBudgets(budgets, deleteBudget);
        if (result.deleted > 0) {
          toast.success(`Auto-cleaned ${result.deleted} old archived budget(s)${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
        }
      } catch (error) {
        console.error('Auto-cleanup failed:', error);
      }
    };

    runAutoCleanup();
  }, [budgets, deleteBudget]);

  // Check for duplicate budgets by category and period
  const duplicateBudgets = budgets.filter((budget, index, self) => 
    self.findIndex((b, idx) => 
      idx !== index && 
      b.category === budget.category && 
      b.period === budget.period &&
      b.startDate === budget.startDate &&
      b.endDate === budget.endDate
    ) !== -1
  );

  // Show warning for duplicate budgets
  useEffect(() => {
    if (duplicateBudgets.length > 0) {
      toast.warning(`Found ${duplicateBudgets.length} duplicate budget(s). Duplicates have been filtered out.`);
    }
  }, [duplicateBudgets.length]);

  // Memoize unique budgets to avoid duplicate filtering
  const uniqueBudgets = useMemo(() => {
    const budgetIds = budgets.map(b => b.id);
    const uniqueIds = new Set(budgetIds);
    if (budgetIds.length !== uniqueIds.size) {
      console.warn('Duplicate budget IDs detected:', budgetIds);
    }
    return budgets.filter((budget, index, self) => 
      index === self.findIndex((b) => b.id === budget.id)
    );
  }, [budgets]);

  // Memoize budget spending calculations separately
  const budgetsWithSpending = useMemo(() => {
    return uniqueBudgets.map(budget => {
      // Validate budget structure
      if (!budget || typeof budget.amount !== 'number' || budget.amount < 0) {
        console.warn('Invalid budget structure:', budget);
        return {
          budget: budget || { id: 'invalid', category: 'Invalid', amount: 0, period: 'monthly' as const },
          spent: 0,
          remaining: 0,
          percentageUsed: 0,
        };
      }
      
      // Guard against undefined transactions
      const safeTransactions = transactions || [];
      const spent = calculatePeriodSpending(budget, safeTransactions);
      const remaining = budget.amount - spent;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentageUsed,
      };
    });
  }, [uniqueBudgets, transactions]);

  // Memoize aggregate calculations separately
  const budgetAggregates = useMemo(() => {
    const totalBudget = uniqueBudgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0);
    const overBudgetCount = budgetsWithSpending.filter(b => b.percentageUsed > 100).length;
    const nearLimitCount = budgetsWithSpending.filter(b => b.percentageUsed >= 80 && b.percentageUsed <= 100).length;

    return {
      totalBudget,
      totalSpent,
      overBudgetCount,
      nearLimitCount,
    };
  }, [uniqueBudgets, budgetsWithSpending]);

  // Combine into budgetAnalytics
  const budgetAnalytics = useMemo(() => ({
    budgetsWithSpending,
    ...budgetAggregates,
  }), [budgetsWithSpending, budgetAggregates]);

  // Filter budgets separately from sorting
  const filteredBudgets = useMemo(() => {
    let filtered = budgetAnalytics?.budgetsWithSpending || [];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ budget }) => {
        const category = categories?.find(c => c.id === budget.category);
        const categoryName = category?.name.toLowerCase() || '';
        return categoryName.includes(query);
      });
    }

    // Filter out archived budgets
    filtered = filtered.filter(({ budget }) => !budget.isArchived);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(({ percentageUsed }) => {
        if (statusFilter === 'over-budget') return percentageUsed > 100;
        if (statusFilter === 'near-limit') return percentageUsed >= 80 && percentageUsed <= 100;
        if (statusFilter === 'on-track') return percentageUsed < 80;
        return true;
      });
    }

    return filtered;
  }, [budgetAnalytics?.budgetsWithSpending, searchQuery, statusFilter, categories]);

  // Sort budgets separately
  const filteredAndSortedBudgets = useMemo(() => {
    const sorted = [...filteredBudgets].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'amount':
          comparison = a.budget.amount - b.budget.amount;
          break;
        case 'percentage':
          comparison = a.percentageUsed - b.percentageUsed;
          break;
        case 'period':
          const periodOrder = { weekly: 0, biweekly: 1, monthly: 2, quarterly: 3, yearly: 4, custom: 5 };
          comparison = (periodOrder[a.budget.period] || 0) - (periodOrder[b.budget.period] || 0);
          break;
        case 'name':
          const categoryA = categories?.find(c => c.id === a.budget.category)?.name || '';
          const categoryB = categories?.find(c => c.id === b.budget.category)?.name || '';
          comparison = categoryA.localeCompare(categoryB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredBudgets, sortBy, sortOrder, categories]);

  // Memoize archived budgets with spending calculations
  const archivedBudgetsWithSpending = useMemo(() => {
    const archivedBudgets = budgets.filter(b => b.isArchived);
    return archivedBudgets.map(budget => {
      const safeTransactions = transactions || [];
      const spent = calculatePeriodSpending(budget, safeTransactions);
      const remaining = budget.amount - spent;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentageUsed,
      };
    });
  }, [budgets, transactions]);

  const handleRestoreBudget = async (budget: Budget) => {
    try {
      await updateBudget(budget.id, { isArchived: false, archivedAt: undefined });
      await addHistoryEntry({
        budgetId: budget.id,
        changeType: 'restored',
        changes: {},
        newState: { isArchived: false }
      });
      toast.success('Budget restored successfully');
    } catch (error) {
      toast.error('Failed to restore budget');
    }
  };

  const handleDeleteArchivedBudget = async (budget: Budget) => {
    try {
      await deleteBudget(budget.id);
      await addHistoryEntry({
        budgetId: budget.id,
        changeType: 'deleted',
        changes: {},
        previousState: { ...budget }
      });
      toast.success('Archived budget deleted permanently');
    } catch (error) {
      toast.error('Failed to delete archived budget');
    }
  };

  const openHistoryDialog = (budget: Budget) => {
    setSelectedBudgetForHistory(budget);
    setShowHistoryDialog(true);
  };

  const handleCreateBudget = async (data: Omit<Budget, 'id'>) => {
    try {
      // Check for existing budget with same category and period
      const existingBudget = budgets.find(b => 
        b.category === data.category && 
        b.period === data.period &&
        b.startDate === data.startDate &&
        b.endDate === data.endDate
      );

      if (existingBudget) {
        const category = categories.find(c => c.id === data.category);
        const categoryName = category?.name || data.category;
        toast.error(`A budget for "${categoryName}" already exists for this period.`);
        return;
      }

      const newBudget = await addBudget(data);
      setShowCreateDialog(false);
      toast.success('Budget created successfully');
      
      // Trigger animation
      setUpdatedBudgetId(newBudget?.id || 'summary');
      triggerSummaryAnimation('success');
    } catch (error) {
      toast.error('Failed to create budget');
      console.error('Error creating budget:', error);
    }
  };

  const handleEditBudget = async (data: Omit<Budget, 'id'>) => {
    if (!selectedBudget) return;
    
    try {
      const updatedBudget = await updateBudget(selectedBudget.id, data);
      setShowEditDialog(false);
      setSelectedBudget(null);
      toast.success('Budget updated successfully');
      
      // Trigger animation
      setUpdatedBudgetId(selectedBudget.id);
      triggerSummaryAnimation('success');
    } catch (error) {
      toast.error('Failed to update budget');
      console.error('Error updating budget:', error);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    
    try {
      await deleteBudget(selectedBudget.id);
      setShowDeleteDialog(false);
      const deletedId = selectedBudget.id;
      setSelectedBudget(null);
      toast.success('Budget deleted successfully');
      
      // Trigger animation
      setUpdatedBudgetId(deletedId);
      triggerSummaryAnimation('warning');
    } catch (error) {
      toast.error('Failed to delete budget');
      console.error('Error deleting budget:', error);
    }
  };

  const openEditDialog = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (budget: Budget) => {
    setSelectedBudget(budget);
    setShowDeleteDialog(true);
  };

  // Bulk action handlers
  const handleSelectBudget = (budgetId: string) => {
    setSelectedBudgetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(budgetId)) {
        newSet.delete(budgetId);
      } else {
        newSet.add(budgetId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedBudgetIds.size === filteredAndSortedBudgets.length) {
      setSelectedBudgetIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedBudgetIds(new Set(filteredAndSortedBudgets.map(({ budget }) => budget.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkArchive = async () => {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    try {
      for (const budgetId of selectedBudgetIds) {
        try {
          const budget = budgets.find(b => b.id === budgetId);
          if (budget) {
            await updateBudget(budgetId, { ...budget, isArchived: true, archivedAt: new Date().toISOString() });
            successCount++;
          } else {
            failureCount++;
            errors.push(`Budget ${budgetId} not found`);
          }
        } catch (error) {
          failureCount++;
          errors.push(`Failed to archive budget ${budgetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setSelectedBudgetIds(new Set());
      setShowBulkActions(false);

      if (failureCount === 0) {
        toast.success(`Archived ${successCount} budget(s)`);
      } else if (successCount === 0) {
        toast.error(`Failed to archive all ${failureCount} budget(s)`);
      } else {
        toast.warning(`Archived ${successCount} budget(s), failed to archive ${failureCount}`);
        console.error('Bulk archive errors:', errors);
      }
    } catch (error) {
      toast.error('Unexpected error during bulk archive');
      console.error('Bulk archive error:', error);
    }
  };

  const handleBulkDuplicate = async () => {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    try {
      for (const budgetId of selectedBudgetIds) {
        try {
          const budget = budgets.find(b => b.id === budgetId);
          if (budget) {
            const { id, ...budgetData } = budget;
            await addBudget(budgetData);
            successCount++;
          } else {
            failureCount++;
            errors.push(`Budget ${budgetId} not found`);
          }
        } catch (error) {
          failureCount++;
          errors.push(`Failed to duplicate budget ${budgetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setSelectedBudgetIds(new Set());
      setShowBulkActions(false);

      if (failureCount === 0) {
        toast.success(`Duplicated ${successCount} budget(s)`);
      } else if (successCount === 0) {
        toast.error(`Failed to duplicate all ${failureCount} budget(s)`);
      } else {
        toast.warning(`Duplicated ${successCount} budget(s), failed to duplicate ${failureCount}`);
        console.error('Bulk duplicate errors:', errors);
      }
    } catch (error) {
      toast.error('Unexpected error during bulk duplicate');
      console.error('Bulk duplicate error:', error);
    }
  };

  const handleBulkDelete = async () => {
    setShowBulkDeleteDialog(false);
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    try {
      for (const budgetId of selectedBudgetIds) {
        try {
          await deleteBudget(budgetId);
          successCount++;
        } catch (error) {
          failureCount++;
          errors.push(`Failed to delete budget ${budgetId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setSelectedBudgetIds(new Set());
      setShowBulkActions(false);

      if (failureCount === 0) {
        toast.success(`Deleted ${successCount} budget(s)`);
      } else if (successCount === 0) {
        toast.error(`Failed to delete all ${failureCount} budget(s)`);
      } else {
        toast.warning(`Deleted ${successCount} budget(s), failed to delete ${failureCount}`);
        console.error('Bulk delete errors:', errors);
      }
    } catch (error) {
      toast.error('Unexpected error during bulk delete');
      console.error('Bulk delete error:', error);
    }
  };

  const handleArchiveBudget = async (budget: Budget) => {
    try {
      await updateBudget(budget.id, { isArchived: true, archivedAt: new Date().toISOString() });
      await addHistoryEntry({
        budgetId: budget.id,
        changeType: 'archived',
        changes: {},
        previousState: { ...budget },
        newState: { isArchived: true, archivedAt: new Date().toISOString() }
      });
      toast.success('Budget archived');
    } catch (error) {
      toast.error('Failed to archive budget');
    }
  };

  // Generate trend data for the last 6 months (memoized)
  const generateTrendData = useMemo(() => {
    const trendData = [];
    const now = new Date();

    // Helper function to normalize budget amount to monthly equivalent
    const normalizeToMonthly = (amount: number, period: string) => {
      switch (period) {
        case 'weekly':
          return amount * 4.33; // ~4.33 weeks per month
        case 'biweekly':
          return amount * 2.17; // ~2.17 biweekly periods per month
        case 'monthly':
          return amount;
        case 'quarterly':
          return amount / 3;
        case 'yearly':
          return amount / 12;
        case 'custom':
          return amount; // Custom periods are complex, use as-is
        default:
          return amount;
      }
    };

    for (let i = 5; i >= 0; i--) {
      const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trendStart = new Date(trendDate.getFullYear(), trendDate.getMonth(), 1);
      const trendEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0);

      // Get transactions for this month (optimized with pre-filtered data)
      const monthTransactions = transactions.filter(t => {
        if (!t.date || t.type !== 'expense') return false;
        const transactionDate = new Date(t.date);
        return !isNaN(transactionDate.getTime()) &&
               transactionDate >= trendStart && transactionDate <= trendEnd;
      });

      // Calculate total budget for this month, normalizing different periods to monthly
      const monthBudget = budgets.reduce((sum, budget) => {
        // Only include non-archived budgets
        if (budget.isArchived) return sum;
        // Normalize to monthly equivalent
        return sum + normalizeToMonthly(budget.amount, budget.period);
      }, 0);

      const monthSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

      trendData.push({
        month: trendDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        budget: monthBudget,
        spent: monthSpent,
        variance: monthSpent - monthBudget,
        percentageUsed: monthBudget > 0 ? (monthSpent / monthBudget) * 100 : 0
      });
    }

    return trendData;
  }, [transactions, budgets]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">
            Set and track your monthly budgets
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="rounded-xl">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Set and track your monthly budgets
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <FavoriteButton size="sm" variant="outline" showLabel={false} />
          <Button 
            variant="outline" 
            onClick={() => setShowCreateDialog(true)} 
            className="flex-1 sm:flex-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Budget
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80"
          >
             Quick Start
          </Button>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search budgets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="over-budget">Over Budget</SelectItem>
            <SelectItem value="near-limit">Near Limit</SelectItem>
            <SelectItem value="on-track">On Track</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="period">Period</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedBudgetIds.size === filteredAndSortedBudgets.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedBudgetIds.size} budget{selectedBudgetIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkArchive}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card className="text-center py-12 rounded-xl">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">No budgets yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start your budgeting journey with our pre-configured templates or create a custom budget from scratch
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Budget
              </Button>
              <Button 
                onClick={() => setShowCreateDialog(true)} 
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                Use Templates
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <BudgetErrorBoundary fallback={BudgetErrorFallback}>
            <div className={shouldAnimateSummary ? 'flash-success' : ''}>
              <BudgetSummary
                budgets={budgets}
                totalSpent={budgetAnalytics.totalSpent}
                totalBudget={budgetAnalytics.totalBudget}
                overBudgetCount={budgetAnalytics.overBudgetCount}
                nearLimitCount={budgetAnalytics.nearLimitCount}
              />
            </div>
          </BudgetErrorBoundary>

          <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="detailed">Detailed View</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAndSortedBudgets.map(({ budget, spent, remaining, percentageUsed }, index) => (
                      <BudgetCardWrapper
                        key={`overview-${budget.id}-${index}`}
                        budget={budget}
                        spent={spent}
                        remaining={remaining}
                        percentageUsed={percentageUsed}
                        updatedBudgetId={updatedBudgetId}
                        onEdit={() => openEditDialog(budget)}
                        onDelete={() => openDeleteDialog(budget)}
                        onArchive={() => handleArchiveBudget(budget)}
                        isSelected={selectedBudgetIds.has(budget.id)}
                        onSelect={() => handleSelectBudget(budget.id)}
                        index={index}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="detailed" className="space-y-4">
              <div className="space-y-4">
                {filteredAndSortedBudgets.map(({ budget, spent, remaining, percentageUsed }, index) => (
                  <BudgetCardWrapper
                    key={`detailed-${budget.id}-${index}`}
                    budget={budget}
                    spent={spent}
                    remaining={remaining}
                    percentageUsed={percentageUsed}
                    updatedBudgetId={updatedBudgetId}
                    onEdit={() => openEditDialog(budget)}
                    onDelete={() => openDeleteDialog(budget)}
                    onArchive={() => handleArchiveBudget(budget)}
                    isSelected={selectedBudgetIds.has(budget.id)}
                    onSelect={() => handleSelectBudget(budget.id)}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6">
                <ArchiveCleanupSettings
                  onCleanup={async () => {
                    const result = await cleanupArchivedBudgets(budgets, deleteBudget);
                    return result;
                  }}
                />
                <SafeChart title="Budget vs Spending Analysis">
                  <BudgetComparisonChart
                    data={budgetAnalytics.budgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }) => {
                      // Map category ID to name for display
                      const category = categories.find(c => c.id === budget.category);
                      const categoryName = category?.name || budget.category;
                      
                      return {
                        category: categoryName,
                        budget: budget.amount,
                        spent,
                        remaining,
                        percentageUsed,
                        status: percentageUsed > 100 ? 'over-budget' : percentageUsed >= 80 ? 'near-limit' : 'on-track',
                        period: getPeriodDisplayText(budget)
                      };
                    })}
                    title="Budget vs Spending Analysis"
                    showComparison={true}
                  />
                </SafeChart>

                <SafeChart title="Budget Performance Trends">
                  <BudgetTrendChart
                    data={generateTrendData}
                    title="Budget Performance Trends"
                    showProjection={true}
                  />
                </SafeChart>
              </div>
            </TabsContent>

            <TabsContent value="archived" className="space-y-4">
              <ArchivedBudgetsView
                budgets={budgets}
                transactions={transactions}
                onRestore={handleRestoreBudget}
                onDelete={handleDeleteArchivedBudget}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Budget</DialogTitle>
            <DialogDescription>
              Set a spending limit for a specific category to track your expenses.
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            onSubmit={handleCreateBudget}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Modify the budget settings for this category.
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            budget={selectedBudget || undefined}
            onSubmit={handleEditBudget}
            onCancel={() => {
              setShowEditDialog(false);
              setSelectedBudget(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Budget Dialog */}
      <DeleteBudgetDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        budget={selectedBudget}
        onConfirm={handleDeleteBudget}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedBudgetIds.size} budget{selectedBudgetIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
            >
              Delete {selectedBudgetIds.size} Budget{selectedBudgetIds.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Budget History</DialogTitle>
            <DialogDescription>
              View all changes made to this budget over time
            </DialogDescription>
          </DialogHeader>
          <BudgetHistoryTimeline
            history={getBudgetHistory(selectedBudgetForHistory?.id || '')}
            onClose={() => setShowHistoryDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
