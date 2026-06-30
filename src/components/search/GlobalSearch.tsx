'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command } from 'cmdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { Transaction, Category, Account, Budget } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Receipt, 
  Target, 
  Wallet, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Plus,
  Filter,
  FileText,
  Command as CommandIcon
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'transaction' | 'category' | 'account' | 'budget' | 'page';
  title: string;
  description?: string;
  amount?: number;
  date?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();

  // Haptic feedback for mobile devices
  const handleHapticFeedback = () => {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  };

  const handleSearchClick = () => {
    handleHapticFeedback();
    setOpen(true);
  };

  // Navigation items
  const navigationItems = useMemo(() => [
    {
      id: 'dashboard',
      type: 'page' as const,
      title: 'Dashboard',
      description: 'Overview of your financial health',
      icon: TrendingUp,
      action: () => {
        router.push('/dashboard');
        setOpen(false);
      },
      keywords: ['dashboard', 'home', 'overview', 'summary']
    },
    {
      id: 'transactions',
      type: 'page' as const,
      title: 'Transactions',
      description: 'Manage your income and expenses',
      icon: Receipt,
      action: () => {
        router.push('/transactions');
        setOpen(false);
      },
      keywords: ['transactions', 'income', 'expenses', 'history']
    },
    {
      id: 'budgets',
      type: 'page' as const,
      title: 'Budgets',
      description: 'Set and track spending limits',
      icon: Target,
      action: () => {
        router.push('/budgets');
        setOpen(false);
      },
      keywords: ['budgets', 'limits', 'goals', 'planning']
    },
    {
      id: 'accounts',
      type: 'page' as const,
      title: 'Accounts',
      description: 'Manage your financial accounts',
      icon: Wallet,
      action: () => {
        router.push('/accounts');
        setOpen(false);
      },
      keywords: ['accounts', 'wallet', 'bank', 'cards']
    },
    {
      id: 'reports',
      type: 'page' as const,
      title: 'Reports',
      description: 'Financial reports and analytics',
      icon: FileText,
      action: () => {
        router.push('/reports');
        setOpen(false);
      },
      keywords: ['reports', 'analytics', 'insights', 'summary']
    }
  ], [router]);

  // Transaction search results
  const transactionResults = useMemo(() => {
    if (!search) return [];
    
    return transactions
      .filter(transaction => 
        transaction.description.toLowerCase().includes(search.toLowerCase()) ||
        transaction.category.toLowerCase().includes(search.toLowerCase()) ||
        (transaction.account && transaction.account.toLowerCase().includes(search.toLowerCase()))
      )
      .slice(0, 5)
      .map(transaction => ({
        id: transaction.id,
        type: 'transaction' as const,
        title: transaction.description,
        description: `${transaction.category} • ${transaction.account || 'No account'}`,
        amount: transaction.amount,
        date: transaction.date,
        icon: Receipt,
        action: () => {
          router.push(`/transactions?search=${encodeURIComponent(transaction.description)}`);
          setOpen(false);
        },
        keywords: [transaction.description, transaction.category, transaction.account || ''].filter(Boolean)
      }));
  }, [transactions, search, router]);

  // Category search results
  const categoryResults = useMemo(() => {
    if (!search) return [];
    
    return categories
      .filter(category =>
        category.name.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 3)
      .map(category => ({
        id: category.id,
        type: 'category' as const,
        title: category.name,
        description: `${category.type === 'income' ? 'Income' : 'Expense'} category`,
        icon: ({ className = "text-lg" }) => <span className={className}>{category.icon}</span>,
        action: () => {
          router.push(`/transactions?category=${encodeURIComponent(category.name)}`);
          setOpen(false);
        },
        keywords: [category.name, category.type]
      }));
  }, [categories, search, router]);

  // Account search results
  const accountResults = useMemo(() => {
    if (!search) return [];
    
    return accounts
      .filter(account =>
        account.name.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 3)
      .map(account => ({
        id: account.id,
        type: 'account' as const,
        title: account.name,
        description: `${account.type} • ${formatCurrency(account.balance)}`,
        amount: account.balance,
        icon: Wallet,
        action: () => {
          router.push(`/accounts`);
          setOpen(false);
        },
        keywords: [account.name, account.type]
      }));
  }, [accounts, search, router]);

  // Budget search results
  const budgetResults = useMemo(() => {
    if (!search) return [];
    
    return budgets
      .filter(budget =>
        budget.category.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 3)
      .map(budget => ({
        id: budget.id,
        type: 'budget' as const,
        title: budget.category,
        description: `Monthly budget: ${formatCurrency(budget.amount)}`,
        amount: budget.amount,
        icon: Target,
        action: () => {
          router.push(`/budgets`);
          setOpen(false);
        },
        keywords: [budget.category, 'budget', 'limit']
      }));
  }, [budgets, search, router]);

  // Combine all results
  const allResults = useMemo(() => {
    const results: SearchResult[] = [];
    
    // Add navigation items when no search or matches
    if (!search) {
      results.push(...navigationItems);
    } else {
      // Add matching navigation items
      const matchingNav = navigationItems.filter(item =>
        item.keywords.some(keyword => keyword.toLowerCase().includes(search.toLowerCase()))
      );
      results.push(...matchingNav);
    }
    
    // Add data results when searching
    if (search) {
      results.push(...transactionResults);
      results.push(...categoryResults);
      results.push(...accountResults);
      results.push(...budgetResults);
    }
    
    return results.slice(0, 10); // Limit results
  }, [search, navigationItems, transactionResults, categoryResults, accountResults, budgetResults]);

  // Keyboard shortcut handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
      
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open]);

  const handleSelect = useCallback((result: SearchResult) => {
    result.action();
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-6xl w-[95vw] max-h-[60vh]">
          <DialogHeader className="sr-only">
            <DialogTitle>Global Search</DialogTitle>
            <DialogDescription>
              Search transactions, categories, accounts, or navigate to different pages
            </DialogDescription>
          </DialogHeader>
          <Command className="rounded-lg border shadow-md h-full flex flex-col">
            <div className="flex items-center border-b px-6 py-3">
              <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Search transactions, categories, accounts, or navigate..."
                value={search}
                onValueChange={setSearch}
                className="flex h-10 w-full rounded-md bg-transparent py-2 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <Command.List className="flex-1 overflow-y-auto p-4">
              {!search && (
                <div className="px-4 py-3 text-sm text-muted-foreground font-medium">
                  Navigation
                </div>
              )}
              
              {search && allResults.length === 0 && (
                <div className="px-4 py-8 text-center text-base text-muted-foreground">
                  No results found for "{search}"
                </div>
              )}
              
              {allResults.map((result) => (
                <Command.Item
                  key={result.id}
                  value={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors mx-2 my-1"
                >
                  <result.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-medium truncate">
                        {result.title}
                      </span>
                      <Badge variant="outline" className="text-sm">
                        {result.type}
                      </Badge>
                    </div>
                    
                    {result.description && (
                      <div className="text-sm text-muted-foreground truncate mt-1">
                        {result.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-right flex-shrink-0">
                    {result.amount !== undefined && (
                      <span className="text-base font-medium">
                        {formatCurrency(result.amount)}
                      </span>
                    )}
                    
                    {result.date && (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(result.date)}
                      </span>
                    )}
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Command.Item>
              ))}
              
              {search && (
                <div className="border-t mt-4 pt-4">
                  <Command.Item
                    onSelect={() => {
                      router.push(`/transactions?search=${encodeURIComponent(search)}`);
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent cursor-pointer transition-colors mx-2"
                  >
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium">
                      View all results for "{search}"
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
                  </Command.Item>
                </div>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Search Button */}
      <div className="md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSearchClick}
          className="fixed bottom-20 right-6 z-50 h-10 w-10 p-0 rounded-full"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
