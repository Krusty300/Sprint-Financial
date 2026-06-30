'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankIntegration } from '@/hooks/useBankIntegration';
import { AccountForm } from '@/components/forms/AccountForm';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountSummary, AccountTypeDistribution } from '@/components/accounts/AccountSummary';
import { DeleteAccountDialog } from '@/components/dialogs/DeleteAccountDialog';
import { AccountDetailsDialog } from '@/components/dialogs/AccountDetailsDialog';
import { AccountDashboard } from '@/components/accounts/AccountDashboard';
import { DragDropAccounts } from '@/components/accounts/DragDropAccounts';
import { AccountTemplates } from '@/components/accounts/AccountTemplates';
import { AccountBalanceWaterfall } from '@/components/charts/AccountBalanceWaterfall';
import { AccountBalanceTrend } from '@/components/charts/AccountBalanceTrend';
import { AccountTypeDistribution as AccountTypeDistChart } from '@/components/charts/AccountTypeDistribution';
import { TransactionHeatMap } from '@/components/charts/TransactionHeatMap';
import { AccountComparison } from '@/components/charts/AccountComparison';
import { AccountAnalytics } from '@/components/accounts/AccountAnalytics';
import { Account } from '@/lib/types';
import { AccountErrorBoundary, AccountErrorFallback } from '@/components/error/AccountErrorBoundary';
import { Plus, Wallet, CreditCard, Smartphone, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { useRouter } from 'next/navigation';

export default function AccountsPage() {
  const router = useRouter();
  const { accounts, loading: accountsLoading, addingAccount, updatingAccount, deletingAccount, addAccount, updateAccount, deleteAccount, getTotalBalance } = useAccounts();
  const { transactions } = useTransactions();
  const { bankFeedStatus } = useBankIntegration();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Calculate account analytics
  const accountAnalytics = useMemo(() => {
    // Validate inputs
    if (!Array.isArray(accounts) || !Array.isArray(transactions)) {
      return {
        accountTypeDistribution: {},
        lowBalanceAccounts: 0,
        overdrawnAccounts: 0,
        creditDebtAccounts: 0,
        accountsWithTransactions: [],
      };
    }

    // Get current month transactions with validation - use UTC for consistency
    const now = new Date();
    const currentMonth = now.getUTCMonth();
    const currentYear = now.getUTCFullYear();
    const currentMonthTransactions = transactions.filter(t => {
      if (!t || !t.date) return false;
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return false;
      // Use UTC for consistent date comparison across timezones
      return transactionDate.getUTCMonth() === currentMonth && 
             transactionDate.getUTCFullYear() === currentYear;
    });

    // Calculate account type distribution with validation
    const accountTypeDistribution = accounts.reduce((acc, account) => {
      if (!account || !account.type) return acc;
      acc[account.type] = (acc[account.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate account health metrics with validation
    const lowBalanceAccounts = accounts.filter(acc => 
      acc && acc.type !== 'credit' && typeof acc.balance === 'number' && acc.balance > 0 && acc.balance < 100
    ).length;

    const overdrawnAccounts = accounts.filter(acc => 
      acc && acc.type !== 'credit' && typeof acc.balance === 'number' && acc.balance < 0
    ).length;

    const creditDebtAccounts = accounts.filter(acc => 
      acc && acc.type === 'credit' && typeof acc.balance === 'number' && acc.balance > 0
    ).length;

    // Calculate recent transactions per account with validation
    const accountsWithTransactions = accounts.map(account => {
      if (!account || !account.name) {
        return {
          account: account || { id: 'invalid', name: 'Invalid', type: 'bank', balance: 0, currency: 'USD' },
          recentTransactions: 0,
        };
      }
      
      const recentCount = currentMonthTransactions.filter(t => 
        t && t.account === account.name
      ).length;
      
      return {
        account,
        recentTransactions: recentCount,
      };
    });

    return {
      accountTypeDistribution,
      lowBalanceAccounts,
      overdrawnAccounts,
      creditDebtAccounts,
      accountsWithTransactions,
    };
  }, [accounts, transactions]);

  const totalBalance = getTotalBalance();

  const handleCreateAccount = async (data: Omit<Account, 'id'>) => {
    try {
      await addAccount(data);
      setShowCreateDialog(false);
      toast.success('Account created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(errorMessage);
      console.error('Error creating account:', error);
    }
  };

  const handleEditAccount = async (data: Omit<Account, 'id'>) => {
    if (!selectedAccount) return;
    
    try {
      await updateAccount(selectedAccount.id, data);
      setShowEditDialog(false);
      setSelectedAccount(null);
      toast.success('Account updated successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update account';
      toast.error(errorMessage);
      console.error('Error updating account:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;
    
    try {
      await deleteAccount(selectedAccount.id);
      setShowDeleteDialog(false);
      setSelectedAccount(null);
      toast.success('Account deleted successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account';
      toast.error(errorMessage);
      console.error('Error deleting account:', error);
    }
  };

  const openEditDialog = (account: Account) => {
    setSelectedAccount(account);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (account: Account) => {
    setSelectedAccount(account);
    setShowDeleteDialog(true);
  };

  const viewAccountTransactions = (account: Account) => {
    router.push(`/transactions?account=${encodeURIComponent(account.name)}`);
  };

  const viewAccountDetails = (account: Account) => {
    setSelectedAccount(account);
    setShowDetailsDialog(true);
  };

  // Simple account selection handler
  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
  };

  
  if (accountsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, credit cards, and wallets
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
          <h1 className="text-2xl sm:text-3xl font-bold">Accounts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your bank accounts, credit cards, and wallets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton size="sm" variant="outline" showLabel={false} />
          <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
            Add Account
          </Button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <Card className="text-center py-12 rounded-xl">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No accounts yet</h3>
              <p className="text-muted-foreground">
                Add your first account to start tracking your finances
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              Add Account
            </Button>
          </div>
        </Card>
        ) : (
          <>
            <AccountErrorBoundary fallback={AccountErrorFallback}>
              <AccountSummary
                accounts={accounts}
                totalBalance={totalBalance}
                accountTypeDistribution={accountAnalytics.accountTypeDistribution}
                lowBalanceAccounts={accountAnalytics.lowBalanceAccounts}
                overdrawnAccounts={accountAnalytics.overdrawnAccounts}
                creditDebtAccounts={accountAnalytics.creditDebtAccounts}
              />
            </AccountErrorBoundary>

            <Tabs defaultValue="dashboard" className="space-y-4">
              <TabsList className="w-full sm:w-auto overflow-x-auto">
                <TabsTrigger value="dashboard" className="whitespace-nowrap">Dashboard</TabsTrigger>
                <TabsTrigger value="detailed-view" className="whitespace-nowrap">Detailed View</TabsTrigger>
                <TabsTrigger value="distribution" className="whitespace-nowrap">Distribution</TabsTrigger>
                <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
              </TabsList>

            <TabsContent value="dashboard" className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-h-[70vh] overflow-y-auto pr-2">
                {accountAnalytics.accountsWithTransactions.map(({ account, recentTransactions }, index) => {
                                    
                  return (
                    <AccountCard
                      key={account.id}
                      account={account}
                      recentTransactions={recentTransactions}
                      onEdit={() => openEditDialog(account)}
                      onDelete={() => openDeleteDialog(account)}
                      onViewTransactions={() => viewAccountTransactions(account)}
                      onViewDetails={() => viewAccountDetails(account)}
                    />
                  );
                })}
              </div>
            </TabsContent>

            
            <TabsContent value="detailed-view" className="space-y-4 animate-in fade-in-50 duration-300">
              <div className="space-y-4">
                {accountAnalytics.accountsWithTransactions.map(({ account, recentTransactions }, index) => {
                                    
                  return (
                    <AccountCard
                      key={account.id}
                      account={account}
                      recentTransactions={recentTransactions}
                      onEdit={() => openEditDialog(account)}
                      onDelete={() => openDeleteDialog(account)}
                      onViewTransactions={() => viewAccountTransactions(account)}
                      onViewDetails={() => viewAccountDetails(account)}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-4 animate-in fade-in-50 duration-300">
              <AccountTypeDistribution accountTypeDistribution={accountAnalytics.accountTypeDistribution} />
            </TabsContent>

            
            
            <TabsContent value="analytics" className="space-y-6 animate-in fade-in-50 duration-300">
              {/* Individual Account Analytics */}
              {accounts.slice(0, 3).map((account) => (
                <div key={account.id} className="space-y-4">
                  <AccountAnalytics account={account} transactions={transactions} />
                </div>
              ))}
              
              {/* Account Type Distribution with Drill-down */}
              <AccountTypeDistChart accounts={accounts} transactions={transactions} />
              
              {/* Account Comparison */}
              <AccountComparison accounts={accounts} transactions={transactions} />
              
              {/* Balance Trends and Waterfall Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {accounts.slice(0, 2).map((account) => (
                  <div key={account.id} className="space-y-4">
                    <AccountBalanceTrend account={account} transactions={transactions} />
                    <AccountBalanceWaterfall account={account} transactions={transactions} />
                  </div>
                ))}
              </div>
              
              {/* Transaction Heat Maps */}
              <div className="grid gap-6 lg:grid-cols-2">
                {accounts.slice(0, 2).map((account) => (
                  <TransactionHeatMap key={account.id} account={account} transactions={transactions} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Banking Integration Section */}
      {bankFeedStatus.totalAccounts > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Connected Accounts</h4>
                <p className="text-sm text-muted-foreground">
                  {bankFeedStatus.totalAccounts} bank accounts linked
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/banking'}
              >
                Manage Banking
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl mb-2">🏦</div>
                <h4 className="font-medium">Bank Integration Active</h4>
                <p className="text-sm text-muted-foreground">
                  {bankFeedStatus.totalTransactions} transactions imported
                </p>
              </div>
              
              <div className="text-center p-4 border rounded-xl">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-medium">Auto-Sync Enabled</h4>
                <p className="text-sm text-muted-foreground">
                  Last sync: {bankFeedStatus.lastSync ? new Date(bankFeedStatus.lastSync).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Account Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px] z-50">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
            <DialogDescription>
              Create a new account to track your financial transactions and balances.
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            onSubmit={handleCreateAccount}
            onCancel={() => setShowCreateDialog(false)}
            existingAccounts={accounts}
            isSubmitting={addingAccount}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px] z-50">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update the account details and settings.
            </DialogDescription>
          </DialogHeader>
          <AccountForm
            account={selectedAccount || undefined}
            onSubmit={handleEditAccount}
            onCancel={() => {
              setShowEditDialog(false);
              setSelectedAccount(null);
            }}
            existingAccounts={accounts}
            isSubmitting={updatingAccount === selectedAccount?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        account={selectedAccount}
        onConfirm={handleDeleteAccount}
        isDeleting={deletingAccount === selectedAccount?.id}
      />

      {/* Account Details Dialog */}
      <AccountDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        account={selectedAccount}
        transactions={transactions}
      />
    </div>
  );
}
