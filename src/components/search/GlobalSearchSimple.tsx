'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command } from 'cmdk';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useBudgets } from '@/hooks/useBudgets';
import { Search, TrendingUp, Receipt, Target, Wallet, Calendar, ArrowRight, Plus, Filter, FileText, X, Clock, Sparkles, Bell, HelpCircle } from 'lucide-react';
import { QuickAddModal } from '@/components/forms/QuickAddModal';
import { KeyboardShortcutsHelp } from '@/components/help/KeyboardShortcutsHelp';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function GlobalSearchSimple() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { isOpen: isQuickAddOpen, openQuickAdd, closeQuickAdd } = useQuickAdd();
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  
  // Expose setOpen function globally for external triggers
  useEffect(() => {
    try {
      (window as any).openGlobalSearch = () => {
        try {
          setOpen(true);
        } catch (error) {
          console.error('Error opening global search:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up global search function:', error);
    }
    
    return () => {
      try {
        delete (window as any).openGlobalSearch;
      } catch (error) {
        console.error('Error cleaning up global search function:', error);
      }
    };
  }, []);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onQuickAdd: openQuickAdd,
    onSearchFocus: () => setOpen(true),
    onToggleSearch: () => setOpen(prev => !prev),
    onClose: () => {
      // Close search dialog if open
      if (open) {
        setOpen(false);
      }
      // Close quick add modal if open
      if (isQuickAddOpen) {
        closeQuickAdd();
      }
    }
  });

  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { budgets } = useBudgets();

  // Search results
  const searchResults = useMemo(() => {
    if (!search) return [];
    
    try {
      const results = [];
      const searchLower = search.toLowerCase();
      
      // Search transactions with null checks
      if (transactions && Array.isArray(transactions)) {
        transactions.forEach(transaction => {
          if (transaction && 
              transaction.description && 
              transaction.category && 
              transaction.type &&
              (transaction.description.toLowerCase().includes(searchLower) ||
               transaction.category.toLowerCase().includes(searchLower) ||
               transaction.type.toLowerCase().includes(searchLower))) {
            
            // Safe date formatting
            let dateStr = 'Unknown date';
            try {
              dateStr = transaction.date ? new Date(transaction.date).toLocaleDateString() : 'Unknown date';
            } catch (dateError) {
              console.warn('Error formatting date:', dateError);
            }
            
            results.push({
              id: `transaction-${transaction.id || Math.random()}`,
              title: transaction.description,
              description: `${transaction.type} • ${transaction.category} • ${dateStr}`,
              icon: Receipt,
              action: () => router.push('/transactions'),
              category: 'transactions'
            });
          }
        });
      }
      
      // Search categories with null checks
      if (categories && Array.isArray(categories)) {
        categories.forEach(category => {
          if (category && 
              category.name && 
              category.type &&
              (category.name.toLowerCase().includes(searchLower) ||
               category.type.toLowerCase().includes(searchLower))) {
            results.push({
              id: `category-${category.id || Math.random()}`,
              title: category.name,
              description: `${category.type} category`,
              icon: Target,
              action: () => router.push(`/transactions?category=${encodeURIComponent(category.name)}`),
              category: 'categories'
            });
          }
        });
      }
    
    // Search accounts with null checks
    if (accounts && Array.isArray(accounts)) {
      accounts.forEach(account => {
        if (account && 
            account.name && 
            account.type &&
            (account.name.toLowerCase().includes(searchLower) ||
             account.type.toLowerCase().includes(searchLower))) {
          
          // Safe balance formatting
          let balanceStr = '0.00';
          try {
            balanceStr = typeof account.balance === 'number' ? account.balance.toFixed(2) : '0.00';
          } catch (balanceError) {
            console.warn('Error formatting balance:', balanceError);
          }
          
          results.push({
            id: `account-${account.id || Math.random()}`,
            title: account.name,
            description: `${account.type} Account • Balance: $${balanceStr}`,
            icon: Wallet,
            action: () => router.push('/accounts'),
            category: 'accounts'
          });
        }
      });
    }
    
    // Search budgets with null checks
    if (budgets && Array.isArray(budgets)) {
      budgets.forEach(budget => {
        if (budget && 
            budget.category &&
            budget.category.toLowerCase().includes(searchLower)) {
          
          // Safe amount formatting
          let amountStr = '0.00';
          try {
            amountStr = typeof budget.amount === 'number' ? budget.amount.toFixed(2) : '0.00';
          } catch (amountError) {
            console.warn('Error formatting amount:', amountError);
          }
          
          results.push({
            id: `budget-${budget.id || Math.random()}`,
            title: `${budget.category} Budget`,
            description: `Budget • $${amountStr} limit • ${budget.period || 'monthly'}`,
            icon: Target,
            action: () => router.push('/budgets'),
            category: 'budgets'
          });
        }
      });
    }
    
    // Search pages and routes
    const pages = [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'Overview of your financial health and statistics',
        icon: TrendingUp,
        action: () => router.push('/dashboard'),
        category: 'pages',
        keywords: ['overview', 'home', 'stats', 'statistics']
      },
      {
        id: 'transactions',
        title: 'Transactions',
        description: 'View and manage all your transactions',
        icon: Receipt,
        action: () => router.push('/transactions'),
        category: 'pages',
        keywords: ['history', 'records', 'expenses', 'income']
      },
      {
        id: 'budgets',
        title: 'Budgets',
        description: 'Create and manage your budgets',
        icon: Target,
        action: () => router.push('/budgets'),
        category: 'pages',
        keywords: ['spending', 'limits', 'financial goals']
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'View and manage your notifications',
        icon: Bell,
        action: () => router.push('/notifications'),
        category: 'pages',
        keywords: ['alerts', 'messages', 'updates', 'bell']
      },
      {
        id: 'accounts',
        title: 'Accounts',
        description: 'Manage your accounts and balances',
        icon: Wallet,
        action: () => router.push('/accounts'),
        category: 'pages',
        keywords: ['wallet', 'balance', 'money']
      },
      {
        id: 'reports',
        title: 'Reports',
        description: 'Generate and view financial reports',
        icon: FileText,
        action: () => router.push('/reports'),
        category: 'pages',
        keywords: ['analytics', 'insights', 'summaries']
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'Application settings and preferences',
        icon: Filter,
        action: () => router.push('/settings'),
        category: 'pages',
        keywords: ['preferences', 'config', 'options']
      },
      {
        id: 'templates',
        title: 'Templates',
        description: 'Transaction templates and recurring patterns',
        icon: Plus,
        action: () => router.push('/templates'),
        category: 'pages',
        keywords: ['patterns', 'recurring', 'automation']
      },
      {
        id: 'banking',
        title: 'Banking',
        description: 'Bank integrations and connections',
        icon: Wallet,
        action: () => router.push('/banking'),
        category: 'pages',
        keywords: ['integrations', 'connections', 'sync']
      },
      {
        id: 'notifications',
        title: 'Notifications',
        description: 'Manage notifications and alerts',
        icon: Calendar,
        action: () => router.push('/notifications'),
        category: 'pages',
        keywords: ['alerts', 'reminders', 'updates']
      }
    ];
    
    pages.forEach(page => {
      if (page.title.toLowerCase().includes(searchLower) ||
          page.description.toLowerCase().includes(searchLower) ||
          page.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))) {
        results.push({
          id: page.id,
          title: page.title,
          description: page.description,
          icon: page.icon,
          action: page.action,
          category: page.category
        });
      }
    });
    
    // Search by date patterns
    const datePatterns = ['today', 'yesterday', 'this week', 'last week', 'this month', 'last month', 'this year', 'last year'];
    if (datePatterns.some(pattern => searchLower.includes(pattern))) {
      results.push({
        id: `date-${searchLower}`,
        title: `Filter by ${search}`,
        description: `Show transactions from ${search}`,
        icon: Calendar,
        action: () => router.push(`/transactions?filter=${searchLower}`),
        category: 'filters'
      });
    }
    
    // Search by amount patterns
    if (searchLower.includes('$') || searchLower.includes('amount') || searchLower.includes('money')) {
      results.push({
        id: 'amount-filter',
        title: 'Filter by Amount',
        description: 'Filter transactions by amount range',
        icon: Receipt,
        action: () => router.push('/transactions?filter=amount'),
        category: 'filters'
      });
    }
    
    // Search by transaction type
    if (searchLower.includes('expense') || searchLower.includes('spending')) {
      results.push({
        id: 'expense-filter',
        title: 'Show Expenses Only',
        description: 'Filter to show only expense transactions',
        icon: Receipt,
        action: () => router.push('/transactions?type=expense'),
        category: 'filters'
      });
    }
    
    if (searchLower.includes('income') || searchLower.includes('earning')) {
      results.push({
        id: 'income-filter',
        title: 'Show Income Only',
        description: 'Filter to show only income transactions',
        icon: Receipt,
        action: () => router.push('/transactions?type=income'),
        category: 'filters'
      });
    }
    
    return results.slice(0, 15); // Increased limit to 15 results
    } catch (error) {
      console.error('Error generating search results:', error);
      return [];
    }
  }, [search, transactions, categories, accounts, budgets, router]);

  
  const handleSelect = useCallback((action: () => void) => {
    try {
      // Execute the action immediately
      action();
      // Close the search dialog
      setOpen(false);
      // Reset selection
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error executing search action:', error);
      // Still close the dialog even if action fails
      setOpen(false);
      setSelectedIndex(-1);
    }
  }, []);

  // Handle result selection with immediate feedback
  const handleResultClick = useCallback((action: () => void, event: React.MouseEvent) => {
    try {
      // Add visual feedback immediately
      const target = event.currentTarget as HTMLElement;
      target.style.transform = 'scale(0.95)';
      setTimeout(() => {
        target.style.transform = 'scale(1)';
      }, 100);
      
      // Execute action and close
      handleSelect(action);
    } catch (error) {
      console.error('Error handling result click:', error);
      // Still handle the selection even if visual feedback fails
      handleSelect(action);
    }
  }, [handleSelect]);

  // Keyboard navigation for search results
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < searchResults.length - 1 ? prev + 1 : 0;
          return newIndex;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : searchResults.length - 1;
          return newIndex;
        });
      } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < searchResults.length) {
        e.preventDefault();
        const result = searchResults[selectedIndex];
        if (result.action) {
          try {
            // Add immediate visual feedback for keyboard selection
            const selectedElement = document.querySelector(`[data-result-index="${selectedIndex}"]`) as HTMLElement;
            if (selectedElement) {
              selectedElement.style.transform = 'scale(0.95)';
              setTimeout(() => {
                selectedElement.style.transform = 'scale(1)';
              }, 100);
            }
            
            // Execute action with slight delay for visual feedback
            setTimeout(() => {
              handleSelect(result.action);
            }, 50);
          } catch (error) {
            console.error('Error handling keyboard selection:', error);
            // Still handle the selection even if visual feedback fails
            handleSelect(result.action);
          }
        }
      } else if (e.key === 'Escape') {
        setOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, searchResults, selectedIndex, handleSelect]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      const selectedElement = document.querySelector(`[data-result-index="${selectedIndex}"]`);
      if (selectedElement) {
        // Use scrollIntoView with better options for visibility
        setTimeout(() => {
          selectedElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest',
            inline: 'nearest'
          });
        }, 100); // Small delay to ensure DOM is ready
      }
    }
  }, [selectedIndex, searchResults.length]);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden border-2 shadow-2xl",
            searchResults.length > 0 
              ? "max-w-7xl w-[100vw] max-h-[85vh] sm:max-h-[70vh] sm:w-[98vw]" 
              : "max-w-6xl w-[95vw] max-h-[85vh] sm:max-h-[70vh]",
            resolvedTheme === 'dark' 
              ? "bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-sm border-border/30 shadow-primary/20"
              : "bg-gradient-to-br from-background via-background to-background/95 backdrop-blur-sm border-border/20 shadow-primary/10"
          )}
          showCloseButton={false}
        >
          <DialogHeader className={cn(
            "px-3 sm:px-4 py-2 sm:py-3 border-b",
            resolvedTheme === 'dark'
              ? "border-border/30 bg-gradient-to-r from-primary/10 to-transparent"
              : "border-border/20 bg-gradient-to-r from-primary/5 to-transparent"
          )}>
            <DialogTitle className="flex items-center gap-2 sm:gap-4 text-base sm:text-lg font-semibold">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span className="hidden sm:inline">Global Search</span>
                <span className="sm:hidden">Search</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 ml-auto">
                <kbd className={cn(
                  "px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs border rounded transition-colors duration-200",
                  resolvedTheme === 'dark'
                    ? "bg-background/80 border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                    : "bg-background border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <span className="hidden sm:inline">Ctrl+K</span>
                  <span className="sm:hidden">K</span>
                </kbd>
                <button
                  onClick={() => setOpen(false)}
                  className={cn(
                    "p-1 rounded-md transition-colors duration-200",
                    resolvedTheme === 'dark'
                      ? "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  title="Close (Esc)"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 transition-colors duration-200" />
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <Command className="rounded-lg border-0 shadow-none overflow-hidden" style={{ height: searchResults.length > 0 ? 'calc(85vh - 80px) sm:calc(70vh - 80px)' : 'auto' }}>
            <div className="relative group">
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300",
                resolvedTheme === 'dark' && "from-primary/20 via-primary/10 to-transparent"
              )} />
              <div className={cn(
                "relative flex items-center border-b",
                resolvedTheme === 'dark'
                  ? "border-border/40 group-focus-within:border-primary/60"
                  : "border-border/30 group-focus-within:border-primary/50"
              )}>
                <Search className="ml-2 sm:ml-3 mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary" />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex h-10 sm:h-11 w-full bg-transparent py-2 sm:py-3 pr-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                  autoComplete="off"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className={cn(
                      "mr-2 sm:mr-3 p-1 rounded-full transition-colors duration-200",
                      resolvedTheme === 'dark'
                        ? "hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <X className="h-3 w-3 transition-colors duration-200" />
                  </button>
                )}
              </div>
            </div>
            <Command.List className={cn(
              "p-1 sm:p-2 overflow-y-auto overflow-x-hidden scrollbar-thin",
              "touch-pan-y touch-manipulation", // Better touch scrolling
              resolvedTheme === 'dark'
                ? "scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                : "scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-600"
            )}
            style={{ 
              maxHeight: searchResults.length > 0 ? 'calc(85vh - 140px) sm:calc(70vh - 140px)' : '250px sm:300px',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch' // Better iOS scrolling
            }}>
              {searchResults.length === 0 ? (
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>
              ) : (
                <>
                  {/* Group results by category */}
                  {['pages', 'transactions', 'categories', 'accounts', 'budgets', 'filters'].map(category => {
                    const categoryResults = searchResults.filter(result => result.category === category);
                    if (categoryResults.length === 0) return null;
                    
                    return (
                      <div key={category} className="mb-2">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {category}
                        </div>
                        {categoryResults.map((result, index) => {
                          const globalIndex = searchResults.findIndex(r => r.id === result.id);
                          const isSelected = globalIndex === selectedIndex;
                          
                          return (
                            <Command.Item
                              key={result.id}
                              onSelect={() => handleSelect(result.action)}
                              onClick={(e) => handleResultClick(result.action, e)}
                              className={cn(
                                "flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-sm cursor-pointer transition-all duration-150 active:scale-95",
                                isSelected && "bg-accent",
                                resolvedTheme === 'dark'
                                  ? "hover:bg-accent/80"
                                  : "hover:bg-accent"
                              )}
                              data-result-index={globalIndex}
                              style={{ minHeight: '40px sm:50px', maxWidth: '100%' }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{result.title}</div>
                                <div className="text-xs text-muted-foreground truncate hidden sm:block">{result.description}</div>
                              </div>
                              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0 ml-2 sm:ml-3 transition-colors duration-200" />
                            </Command.Item>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
      
      {/* Mobile Action Buttons */}
      <div className="md:hidden flex flex-col gap-2 fixed bottom-20 right-6 z-50">
        {/* Quick Add Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={openQuickAdd}
          className={cn(
            "h-10 w-10 p-0 rounded-full shadow-lg transition-colors duration-200",
            "border-border/50 backdrop-blur-sm",
            resolvedTheme === 'dark'
              ? "bg-background/80 hover:bg-background text-foreground border-border/50"
              : "bg-background/95 hover:bg-muted text-foreground border-border/40"
          )}
          aria-label="Quick Add Transaction"
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        {/* Search Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if ((window as any).openGlobalSearch) {
              (window as any).openGlobalSearch();
            }
          }}
          className={cn(
            "h-10 w-10 p-0 rounded-full shadow-lg transition-colors duration-200",
            "border-border/50 backdrop-blur-sm",
            resolvedTheme === 'dark'
              ? "bg-background/80 hover:bg-background text-foreground border-border/50"
              : "bg-background/95 hover:bg-muted text-foreground border-border/40"
          )}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        
        {/* Help Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsKeyboardHelpOpen(true)}
          className={cn(
            "h-10 w-10 p-0 rounded-full shadow-lg transition-colors duration-200",
            "border-border/50 backdrop-blur-sm",
            resolvedTheme === 'dark'
              ? "bg-background/80 hover:bg-background text-foreground border-border/50"
              : "bg-background/95 hover:bg-muted text-foreground border-border/40"
          )}
          aria-label="Keyboard Shortcuts Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Quick Add Modal */}
      <QuickAddModal 
        open={isQuickAddOpen} 
        onOpenChange={(open) => open ? openQuickAdd() : closeQuickAdd()} 
      />
      
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp 
        open={isKeyboardHelpOpen} 
        onOpenChange={setIsKeyboardHelpOpen} 
      />
    </>
  );
}
