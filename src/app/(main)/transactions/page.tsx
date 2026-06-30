'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Transaction } from '@/lib/types';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { EditTransactionForm } from '@/components/forms/EditTransactionForm';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { EnhancedTransactionTable } from '@/components/transactions/EnhancedTransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Calendar, X, RotateCcw, Loader2, Table, LayoutGrid, Infinity } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRealtime } from '@/hooks/useRealtime';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { DeleteDialogProvider, useDeleteDialog } from '@/contexts/DeleteDialogContext';
import { QuickAddProvider } from '@/contexts/QuickAddContext';
import { ExportDialog } from '@/components/dialogs/ExportDialog';
import { BulkCategoryChangeDialog } from '@/components/dialogs/BulkCategoryChangeDialog';
import { BulkDateEditDialog } from '@/components/dialogs/BulkDateEditDialog';
import { EnhancedTransactionFilters } from '@/components/filters/EnhancedTransactionFilters';
import { InfiniteScrollTransactions } from '@/components/transactions/InfiniteScrollTransactions';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { MonthlyComparison } from '@/components/charts/MonthlyComparison';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { 
  TransactionTableSkeleton, 
  SummaryCardsSkeleton, 
  FiltersSkeleton, 
  ChartSkeleton 
} from '@/components/ui/TransactionSkeleton';
import { 
  EmptyTransactionsState, 
  NoSearchResultsState, 
  NoFilterResultsState, 
  EmptyChartsState 
} from '@/components/ui/EmptyStates';
import { TooltipWrapper } from '@/components/ui/Tooltip';
import { BulkOperationProgress } from '@/components/ui/BulkOperationProgress';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useDebounce } from '@/hooks/useDebounce';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Skeleton } from '@/components/ui/skeleton';

interface FilterState {
  searchTerm: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  account: string;
  tags: string[];
  dateRange: { start: string; end: string };
  amountRange: { min: number; max: number };
}

export default function TransactionsPage() {
  return (
    <QuickAddProvider>
      <DeleteDialogProvider>
        <MainLayoutContent />
      </DeleteDialogProvider>
    </QuickAddProvider>
  );
}

function MainLayoutContent() {
  const { dialog } = useDeleteDialog();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const { subscribe } = useRealtime();
  const { transactions, addTransaction, deleteTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  
  // Enhanced filter state
  const [filters, setFilters] = useState<FilterState>(() => ({
    searchTerm: '',
    type: 'all' as 'all' | 'income' | 'expense',
    category: 'all',
    account: 'all',
    tags: [],
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 1000 }
  }));

  // Debounced search for real-time updates
  const debouncedSearchTerm = useDebounce(filters.searchTerm, 300);

  // Memoize amount range calculation
  const amountRange = useMemo(() => {
    if (transactions.length === 0) {
      return { min: 0, max: 1000 };
    }
    const amounts = transactions.map(t => t.amount || 0);
    return {
      min: Math.min(...amounts, 0),
      max: Math.max(...amounts, 1000)
    };
  }, [transactions]);

  // Update amount range when transactions change
  useEffect(() => {
    if (transactions.length > 0 && filters.amountRange.max < amountRange.max) {
      setFilters(prev => ({
        ...prev,
        amountRange: amountRange
      }));
    }
  }, [amountRange.max, filters.amountRange.max, setFilters]);

  // Filter loading state
  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm, filters.type, filters.category, filters.account, filters.tags, filters.dateRange, filters.amountRange]);

  // Keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  useKeyboardShortcuts({
    onNewTransaction: () => {
      // Trigger new transaction dialog
      const event = new CustomEvent('open-transaction-dialog');
      document.dispatchEvent(event);
    },
    onSearchFocus: () => {
      searchInputRef.current?.focus();
    },
    onDelete: () => {
      // Bulk delete selected items
      if (selectedIds.length > 0) {
        handleBulkDelete(selectedIds);
      }
    }
  });
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { openIndividualDelete, openBulkDelete, closeDeleteDialog } = useDeleteDialog();

  // Listen for real-time transaction events
  useEffect(() => {
    const unsubscribe = subscribe('transaction', (event) => {
      // Real-time transaction event received
      // Note: Toast notifications are handled by useNotifications hook to avoid duplicates
    });

    return unsubscribe;
  }, [subscribe]);
  const [useEnhancedTable, setUseEnhancedTable] = useState<boolean | null>(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [bulkCategoryDialogOpen, setBulkCategoryDialogOpen] = useState(false);
  const [bulkDateDialogOpen, setBulkDateDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [templateData, setTemplateData] = useState<Partial<Transaction> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [bulkOperationProgress, setBulkOperationProgress] = useState<{
    operation: string;
    total: number;
    completed: number;
    failed: number;
    status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
    error?: string;
  } | null>(null);

  // AbortController for cancelling bulk operations
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle URL parameters from template navigation
  useEffect(() => {
    const amount = searchParams.get('amount');
    const type = searchParams.get('type') as 'income' | 'expense' | null;
    const category = searchParams.get('category');
    const description = searchParams.get('description');
    const account = searchParams.get('account');
    const tags = searchParams.get('tags');

    if (amount || type || category || description || account || tags) {
      const templateDataToSet = {
        amount: amount ? parseFloat(amount) : undefined,
        type: type || undefined,
        category: category || undefined,
        description: description || undefined,
        account: account || undefined,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
      };
      setTemplateData(templateDataToSet);

      // Pre-fill the filters
      setFilters((prev: FilterState) => ({
        ...prev,
        type: type || 'all',
        category: category || 'all',
        account: account || 'all',
        searchTerm: description || ''
      }));

      // Clear URL params after a short delay to ensure form processes them first
      setTimeout(() => {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 500);
    }
  }, [searchParams]);


  const handleAddTransaction = (data: Omit<Transaction, 'id'>) => {
    try {
      addTransaction(data);
      toast.success('Transaction added successfully!');
      // Clear template data after successful submission
      setTemplateData(null);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction. Please try again.');
    }
  };

  // Helper function to get monthly trend data for sparklines
  const getMonthlyTrendData = (transactions: Transaction[] | number[]) => {
    if (!transactions || transactions.length === 0) return [];
    
    // If it's already numbers (net data), validate and return as is
    if (typeof transactions[0] === 'number') {
      return (transactions as number[]).map(n => isNaN(n) ? 0 : n);
    }
    
    // Group by month and sum amounts with safety checks
    const monthlyData = (transactions as Transaction[]).reduce((acc, transaction) => {
      // Skip invalid transactions
      if (!transaction || !transaction.date) return acc;
      
      try {
        const date = new Date(transaction.date);
        // Check if date is valid
        if (isNaN(date.getTime())) return acc;
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = 0;
        }
        
        acc[monthKey] += transaction.amount || 0;
        return acc;
      } catch (error) {
        console.error('Error processing transaction date:', error);
        return acc;
      }
    }, {} as Record<string, number>);

    // Get last 6 months of data
    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => isNaN(value) ? 0 : value);

    return sortedMonths;
  };

  
  // Loading state management
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Simulate loading time

    return () => {
      clearTimeout(timer);
    };
  }, [transactions.length, setIsLoading]);

  // Clear template data when component unmounts or after 5 minutes
  useEffect(() => {
    const timer = setTimeout(() => {
      setTemplateData(null);
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Cleanup bulk operation progress timers
  useEffect(() => {
    return () => {
      // Clear any pending progress timers using functional update
      setBulkOperationProgress(null);
    };
  }, []);

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdateTransaction = (data: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      try {
        updateTransaction(editingTransaction.id, data);
        setEditingTransaction(null);
        toast.success('Transaction updated successfully!');
      } catch (error) {
        console.error('Failed to update transaction:', error);
        toast.error('Failed to update transaction. Please try again.');
      }
    }
  };

  const handleDeleteTransaction = (id: string) => {
    // Validate transaction exists before proceeding
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) {
      toast.error('Transaction not found. Please refresh and try again.');
      return;
    }
    
    // Get transaction details for the dialog
    const transactionDetails = getTransactionDetails(transaction.id);
    
    // Open individual delete dialog
    openIndividualDelete({
      title: "Delete Transaction",
      description: "Are you sure you want to delete this transaction? This action cannot be undone.",
      itemName: transaction.description,
      itemDetails: transactionDetails,
      onConfirm: async () => {
        try {
          await deleteTransaction(id);
          toast.success('Transaction deleted successfully');
        } catch (error) {
          console.error('Failed to delete transaction:', error);
          toast.error('Failed to delete transaction. Please try again.');
        }
      }
    });
  };

  
  const getTransactionDescription = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    return transaction?.description || 'Unknown transaction';
  };

  const getTransactionDisplay = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return '';
    
    const amount = transaction.type === 'income' 
      ? `+${formatCurrency(transaction.amount)}` 
      : `-${formatCurrency(transaction.amount)}`;
    const date = formatDate(transaction.date);
    return `${amount} • ${date}`;
  };

  const getTransactionDetails = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return '';
    
    const amount = transaction.type === 'income' 
      ? `+${formatCurrency(transaction.amount)}` 
      : `-${formatCurrency(transaction.amount)}`;
    const date = formatDate(transaction.date);
    return `${amount} • ${date}`;
  };

  const getBulkDeleteDetails = (ids: string[]) => {
    const totalIncome = ids.reduce((sum, id) => {
      const transaction = transactions.find(t => t.id === id);
      return transaction?.type === 'income' ? sum + transaction.amount : sum;
    }, 0);
    
    const totalExpense = ids.reduce((sum, id) => {
      const transaction = transactions.find(t => t.id === id);
      return transaction?.type === 'expense' ? sum + transaction.amount : sum;
    }, 0);

    const details = [];
    if (totalIncome > 0) details.push(`Income: +${formatCurrency(totalIncome)}`);
    if (totalExpense > 0) details.push(`Expenses: -${formatCurrency(totalExpense)}`);
    
    return details.join(' • ');
  };

  // Memoize filtered transactions for performance
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Skip invalid transactions
      if (!transaction || !transaction.id) return false;

      // Search filter with null checks
      const matchesSearch = !debouncedSearchTerm || 
        (transaction.description && transaction.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (transaction.category && transaction.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (transaction.account && transaction.account.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (transaction.tags && transaction.tags.some((tag: string) => 
          tag && tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ));

      // Type filter with null check
      const matchesType = filters.type === 'all' || (transaction.type && transaction.type === filters.type);

      // Category filter with null check
      const matchesCategory = filters.category === 'all' || (transaction.category && transaction.category === filters.category);

      // Account filter with null check
      const matchesAccount = filters.account === 'all' || (transaction.account && transaction.account === filters.account);

      // Tags filter with null check
      const matchesTags = filters.tags.length === 0 || 
        (transaction.tags && filters.tags.some((tag: string) => transaction.tags!.includes(tag)));

      // Amount range filter with null check
      const transactionAmount = transaction.amount || 0;
      const matchesAmountRange = transactionAmount >= filters.amountRange.min && 
                             transactionAmount <= filters.amountRange.max;

      // Date range filtering with validation
      let matchesDateRange = true;
      if (filters.dateRange.start || filters.dateRange.end) {
        try {
          const transactionDate = new Date(transaction.date);
          // Check if date is valid
          if (isNaN(transactionDate.getTime())) {
            matchesDateRange = false;
          } else {
            if (filters.dateRange.start) {
              const startDate = new Date(filters.dateRange.start);
              if (!isNaN(startDate.getTime())) {
                matchesDateRange = transactionDate >= startDate;
              }
            }
            if (filters.dateRange.end && matchesDateRange) {
              const endDate = new Date(filters.dateRange.end + 'T23:59:59');
              if (!isNaN(endDate.getTime())) {
                matchesDateRange = transactionDate <= endDate;
              }
            }
          }
        } catch (error) {
          console.error('Date parsing error:', error);
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesAccount && 
             matchesTags && matchesDateRange && matchesAmountRange;
    });
  }, [transactions, debouncedSearchTerm, filters]);

  // Memoize summary calculations for performance
  const summaryStats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t && t.type === 'income' && typeof t.amount === 'number' && !isNaN(t.amount))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t && t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount))
      .reduce((sum, t) => sum + t.amount, 0);

    const net = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      net
    };
  }, [filteredTransactions]);

  const clearAllFilters = () => {
    // Safe amount calculation with fallback
    let minAmount = 0;
    let maxAmount = 1000;
    
    if (transactions && transactions.length > 0) {
      const amounts = transactions.map(t => t.amount || 0);
      minAmount = Math.min(...amounts, 0);
      maxAmount = Math.max(...amounts, 1000);
    }

    setFilters({
      searchTerm: '',
      type: 'all',
      category: 'all',
      account: 'all',
      tags: [],
      dateRange: { start: '', end: '' },
      amountRange: { min: minAmount, max: maxAmount }
    });
    toast.success('All filters cleared');
  };

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.account !== 'all' ||
    filters.tags.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  const exportTransactions = () => {
    setExportDialogOpen(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    // Get details for bulk delete dialog
    const totalAmount = ids.reduce((sum, id) => {
      const transaction = transactions.find(t => t.id === id);
      return sum + (transaction?.amount || 0);
    }, 0);
    
    // Open bulk delete dialog
    openBulkDelete({
      title: `Delete ${ids.length} Transaction${ids.length > 1 ? 's' : ''}`,
      description: `Are you sure you want to delete ${ids.length} transaction${ids.length > 1 ? 's' : ''}? This action cannot be undone.`,
      itemName: undefined,
      itemDetails: `Total amount: ${formatCurrency(totalAmount)}`,
      onConfirm: async () => {
        setBulkOperationProgress({
          operation: 'Deleting Transactions',
          total: ids.length,
          completed: 0,
          failed: 0,
          status: 'running'
        });

        try {
          let completed = 0;
          let failed = 0;

          for (const id of ids) {
            // Check if operation was cancelled
            if (abortControllerRef.current?.signal.aborted) {
              setBulkOperationProgress({
                operation: 'Deleting Transactions',
                total: ids.length,
                completed,
                failed,
                status: 'cancelled'
              });
              return;
            }

            try {
              await deleteTransaction(id);
              completed++;
            } catch (error) {
              failed++;
            }

            // Update progress
            setBulkOperationProgress(prev => prev ? {
              ...prev,
              completed,
              failed
            } : null);

            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          const finalStatus = failed > 0 ? 'error' : 'completed';
          setBulkOperationProgress({
            operation: 'Deleting Transactions',
            total: ids.length,
            completed,
            failed,
            status: finalStatus,
            error: failed > 0 ? `Failed to delete ${failed} transactions` : undefined
          });

          toast.success(`${ids.length} transaction${ids.length > 1 ? 's' : ''} deleted successfully`);
          
          // Hide progress after 2 seconds
          setTimeout(() => setBulkOperationProgress(null), 2000);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setBulkOperationProgress({
            operation: 'Deleting Transactions',
            total: ids.length,
            completed: 0,
            failed: ids.length,
            status: 'error',
            error: errorMessage
          });
          toast.error('Failed to delete transactions. Please try again.');
          setTimeout(() => setBulkOperationProgress(null), 3000);
        }
      }
    });
  };

  const handleBulkExport = (ids: string[]) => {
    // Store the selected IDs for the export dialog
    if (ids && ids.length > 0) {
      setSelectedIds(ids);
    }
    setExportDialogOpen(true);
  };

  const handleDuplicateTransaction = (data: Omit<Transaction, 'id'>) => {
    try {
      addTransaction(data);
      toast.success('Transaction duplicated successfully!');
    } catch (error) {
      console.error('Failed to duplicate transaction:', error);
      toast.error('Failed to duplicate transaction. Please try again.');
    }
  };

  const handleBulkCategoryChange = async (updates: { ids: string[]; category: string }) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    setBulkOperationProgress({
      operation: 'Changing Categories',
      total: updates.ids.length,
      completed: 0,
      failed: 0,
      status: 'running'
    });

    try {
      let completed = 0;
      let failed = 0;

      for (const id of updates.ids) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          setBulkOperationProgress({
            operation: 'Changing Categories',
            total: updates.ids.length,
            completed,
            failed,
            status: 'cancelled'
          });
          return;
        }

        try {
          const transaction = transactions.find(t => t.id === id);
          if (transaction) {
            updateTransaction(id, { ...transaction, category: updates.category });
            completed++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }

        // Update progress
        setBulkOperationProgress(prev => prev ? {
          ...prev,
          completed,
          failed
        } : null);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const finalStatus = failed > 0 ? 'error' : 'completed';
      setBulkOperationProgress({
        operation: 'Changing Categories',
        total: updates.ids.length,
        completed,
        failed,
        status: finalStatus,
        error: failed > 0 ? `Failed to update ${failed} transactions` : undefined
      });

      setSelectedIds([]);
      
      // Hide progress after 2 seconds
      setTimeout(() => setBulkOperationProgress(null), 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setBulkOperationProgress({
        operation: 'Changing Categories',
        total: updates.ids.length,
        completed: 0,
        failed: updates.ids.length,
        status: 'error',
        error: errorMessage
      });
      
      setTimeout(() => setBulkOperationProgress(null), 3000);
    }
  };

  const handleBulkDateEdit = async (updates: { ids: string[]; date: string; mode: 'set' | 'adjust' }) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();

    setBulkOperationProgress({
      operation: 'Editing Dates',
      total: updates.ids.length,
      completed: 0,
      failed: 0,
      status: 'running'
    });

    try {
      let completed = 0;
      let failed = 0;

      for (const id of updates.ids) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          setBulkOperationProgress({
            operation: 'Editing Dates',
            total: updates.ids.length,
            completed,
            failed,
            status: 'cancelled'
          });
          return;
        }

        try {
          const transaction = transactions.find(t => t.id === id);
          if (transaction) {
            updateTransaction(id, { ...transaction, date: updates.date });
            completed++;
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }

        // Update progress
        setBulkOperationProgress(prev => prev ? {
          ...prev,
          completed,
          failed
        } : null);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const finalStatus = failed > 0 ? 'error' : 'completed';
      setBulkOperationProgress({
        operation: 'Editing Dates',
        total: updates.ids.length,
        completed,
        failed,
        status: finalStatus,
        error: failed > 0 ? `Failed to update ${failed} transactions` : undefined
      });

      setSelectedIds([]);
      
      // Hide progress after 2 seconds
      setTimeout(() => setBulkOperationProgress(null), 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setBulkOperationProgress({
        operation: 'Editing Dates',
        total: updates.ids.length,
        completed: 0,
        failed: updates.ids.length,
        status: 'error',
        error: errorMessage
      });
      
      setTimeout(() => setBulkOperationProgress(null), 3000);
    }
  };

  const handleUpdateTransactionInline = async (id: string, updates: Partial<Transaction>) => {
    try {
      await updateTransaction(id, updates);
      toast.success('Transaction updated successfully');
    } catch (error) {
      toast.error('Failed to update transaction');
    }
  };

  const handleReorderTransactions = (fromIndex: number, toIndex: number) => {
    // Implement reorder logic
    const reorderedTransactions = [...filteredTransactions];
    const [movedItem] = reorderedTransactions.splice(fromIndex, 1);
    reorderedTransactions.splice(toIndex, 0, movedItem);
    // Update the transactions array with the new order
    // This would need to be implemented in the data layer
    toast.success('Transactions reordered');
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6" role="main" aria-label="Transactions page">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" id="transactions-heading">Transactions</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your income and expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton size="sm" variant="outline" showLabel={false} />
            <TransactionForm 
              onSubmit={handleAddTransaction} 
              initialData={templateData || undefined}
              onDialogClose={() => setTemplateData(null)}
            />
          </div>
        </div>

        {/* Bulk Operation Progress */}
        {bulkOperationProgress && (
          <BulkOperationProgress
            operation={bulkOperationProgress.operation}
            total={bulkOperationProgress.total}
            completed={bulkOperationProgress.completed}
            failed={bulkOperationProgress.failed}
            status={bulkOperationProgress.status}
            error={bulkOperationProgress.error}
          />
        )}

        {/* Enhanced Filters */}
        {isLoading ? (
          <FiltersSkeleton />
        ) : (
          <>
            <EnhancedTransactionFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              accounts={accounts}
              transactions={transactions}
            />
            {/* Active Filters Visual Feedback */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 items-center mt-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {filters.searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{filters.searchTerm}"
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear search filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.type !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {filters.type}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear type filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.category !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {filters.category}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.account !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    Account: {filters.account}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, account: 'all' }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear account filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <Badge variant="secondary" className="gap-1">
                    Date Range
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, dateRange: { start: '', end: '' } }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear date range filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.tags.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    Tags: {filters.tags.length}
                    <button 
                      onClick={() => setFilters(prev => ({ ...prev, tags: [] }))}
                      className="ml-1 hover:text-destructive"
                      aria-label="Clear tags filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-6 text-xs"
                  aria-label="Clear all filters"
                >
                  Clear All
                </Button>
              </div>
            )}
            {isFiltering && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying filters...
              </div>
            )}
          </>
        )}

        
        {/* Summary Stats with Sparklines */}
        {isLoading ? (
          <SummaryCardsSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyTransactionsState />
        ) : filteredTransactions.length === 0 ? (
          hasActiveFilters ? (
            <NoFilterResultsState onClearFilters={clearAllFilters} />
          ) : (
            <EmptyTransactionsState />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Financial summary statistics">
            <Card className="rounded-xl" aria-labelledby="total-income-label">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-success" id="total-income-label">
                      +{formatCurrency(summaryStats.totalIncome)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Income</p>
                  </div>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-xs" aria-label={`Number of income transactions: ${filteredTransactions.filter(t => t.type === 'income').length}`}>
                      {filteredTransactions.filter(t => t.type === 'income').length} items
                    </Badge>
                  )}
                </div>
                <SparklineChart 
                  data={getMonthlyTrendData(transactions.filter(t => t.type === 'income'))}
                  color={resolvedTheme === 'dark' ? '#22c55e' : '#16a34a'}
                  height={40}
                  positive={true}
                  aria-label="Income trend over time"
                />
              </CardContent>
            </Card>
        
          <Card className="rounded-xl" aria-labelledby="total-expenses-label">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-destructive" id="total-expenses-label">
                      -{formatCurrency(summaryStats.totalExpenses)}
                    </div>
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                  </div>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-xs" aria-label={`Number of expense transactions: ${filteredTransactions.filter(t => t.type === 'expense').length}`}>
                      {filteredTransactions.filter(t => t.type === 'expense').length} items
                    </Badge>
                  )}
                </div>
              <SparklineChart 
                data={getMonthlyTrendData(transactions.filter(t => t.type === 'expense'))}
                color={resolvedTheme === 'dark' ? '#ef4444' : '#dc2626'}
                height={40}
                positive={false}
                aria-label="Expense trend over time"
              />
          </CardContent>
        </Card>
        
        <Card className="rounded-xl" aria-labelledby="net-balance-label">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className={`text-2xl font-bold ${summaryStats.net >= 0 ? 'text-success' : 'text-destructive'}`} id="net-balance-label">
                  {formatCurrency(summaryStats.net)}
                </div>
                <p className="text-xs text-muted-foreground">Net</p>
              </div>
              {hasActiveFilters && (
                <Badge variant="outline" className="text-xs" aria-label={`Total number of transactions: ${filteredTransactions.length}`}>
                  {filteredTransactions.length} total
                </Badge>
              )}
            </div>
            <SparklineChart 
              data={getMonthlyTrendData(transactions.map(t => t.type === 'income' ? t.amount : -t.amount))}
              color="currentColor"
              height={40}
              positive={true}
              aria-label="Net balance trend over time"
            />
          </CardContent>
        </Card>
        </div>
      )}

      {/* Table Toggle */}
      <div className="flex justify-end mb-2 gap-2" role="group" aria-label="Table view options">
        <TooltipWrapper content="Simple table view with basic columns">
          <Button
            variant={useEnhancedTable === false ? "default" : "outline"}
            size="sm"
            onClick={() => setUseEnhancedTable(false)}
            aria-pressed={useEnhancedTable === false}
            aria-label="Switch to simple table view"
          >
            <Table className="h-4 w-4 mr-2" />
            Simple
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Enhanced table with sorting, filtering, and bulk actions">
          <Button
            variant={useEnhancedTable === true ? "default" : "outline"}
            size="sm"
            onClick={() => setUseEnhancedTable(true)}
            aria-pressed={useEnhancedTable === true}
            aria-label="Switch to enhanced table view"
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Enhanced
          </Button>
        </TooltipWrapper>
        <TooltipWrapper content="Infinite scroll for large datasets">
          <Button
            variant={useEnhancedTable === null ? "default" : "outline"}
            size="sm"
            onClick={() => setUseEnhancedTable(null)}
            aria-pressed={useEnhancedTable === null}
            aria-label="Switch to infinite scroll view"
          >
            <Infinity className="h-4 w-4 mr-2" />
            Infinite
          </Button>
        </TooltipWrapper>
      </div>

      {/* Transactions Table */}
      <div role="region" aria-labelledby="transactions-heading" aria-live="polite" aria-atomic="false">
        {useEnhancedTable ? (
          <EnhancedTransactionTable
            transactions={filteredTransactions}
            searchTerm={debouncedSearchTerm}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
            onDuplicate={handleDuplicateTransaction}
            onExportDialog={exportTransactions}
            onSelectionChange={setSelectedIds}
            onBulkCategoryChange={() => setBulkCategoryDialogOpen(true)}
            onBulkDateEdit={() => setBulkDateDialogOpen(true)}
            onUpdateTransaction={handleUpdateTransactionInline}
            onReorderTransactions={handleReorderTransactions}
            enableDragDrop={true}
          />
        ) : useEnhancedTable === false ? (
          <InfiniteScrollTransactions
            transactions={filteredTransactions}
            onLoadMore={() => {
              // Load more logic is handled internally by the component
            }}
            hasMore={true}
            loading={false}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
          />
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onDuplicate={handleDuplicateTransaction}
          />
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <EditTransactionForm
        transaction={editingTransaction}
        open={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onSubmit={handleUpdateTransaction}
      />

      {/* Single Delete Confirmation Dialog */}
      {dialog && dialog.mode === 'individual' && (
        <DeleteConfirmDialog
          open={dialog.isOpen}
          onOpenChange={closeDeleteDialog}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          description={dialog.description}
          itemName={dialog.itemName}
          itemDetails={dialog.itemDetails}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {dialog && dialog.mode === 'bulk' && (
        <DeleteConfirmDialog
          open={dialog.isOpen}
          onOpenChange={closeDeleteDialog}
          onConfirm={dialog.onConfirm}
          title={dialog.title}
          description={dialog.description}
          itemName={dialog.itemName}
          itemDetails={dialog.itemDetails}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        transactions={filteredTransactions}
        selectedIds={selectedIds}
        onExportComplete={() => setSelectedIds([])}
        categories={categories}
        accounts={accounts}
      />

      {/* Bulk Category Change Dialog */}
      <BulkCategoryChangeDialog
        open={bulkCategoryDialogOpen}
        onOpenChange={setBulkCategoryDialogOpen}
        selectedIds={selectedIds}
        transactions={filteredTransactions}
        categories={categories}
        onUpdate={handleBulkCategoryChange}
      />

      {/* Bulk Date Edit Dialog */}
      <BulkDateEditDialog
        open={bulkDateDialogOpen}
        onOpenChange={setBulkDateDialogOpen}
        selectedIds={selectedIds}
        transactions={filteredTransactions}
        onUpdate={handleBulkDateEdit}
      />

      {/* Data Visualization - Bottom Section */}
      <div className="mt-8 pt-8 border-t" role="region" aria-labelledby="financial-insights-heading">
        <h2 className="text-xl font-semibold mb-4" id="financial-insights-heading">Financial Insights</h2>
        <MonthlyComparison transactions={filteredTransactions} aria-label="Monthly comparison chart" />
      </div>
      </div>
    </ErrorBoundary>
  );
}
