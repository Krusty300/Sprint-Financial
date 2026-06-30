'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Account, Transaction } from '@/lib/types';
import { AccountAnalytics } from '@/components/accounts/AccountAnalytics';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { TrendingUp, CreditCard, Wallet, Smartphone, DollarSign, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AccountDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  transactions: Transaction[];
}

const accountTypeIcons = {
  cash: Wallet,
  bank: DollarSign,
  credit: CreditCard,
  mobile: Smartphone,
};

const accountTypeLabels = {
  cash: 'Cash',
  bank: 'Bank Account',
  credit: 'Credit Card',
  mobile: 'Mobile Wallet',
};

export function AccountDetailsDialog({
  open,
  onOpenChange,
  account,
  transactions,
}: AccountDetailsDialogProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  if (!account) return null;

  const Icon = accountTypeIcons[account.type];
  const isCredit = account.type === 'credit';
  const hasBalance = account.balance !== 0;

  // Filter transactions for this account
  const accountTransactions = transactions.filter(t => t.account === account.name);
  
  // Get recent transactions (last 10)
  const recentTransactions = accountTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const viewAllTransactions = () => {
    router.push(`/transactions?account=${encodeURIComponent(account.name)}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" aria-describedby="account-details-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isCredit ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
              <Icon className={`h-5 w-5 ${isCredit ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div>
              <DialogTitle className="text-xl">{account.name}</DialogTitle>
              <DialogDescription id="account-details-dialog-description" className="flex items-center gap-2">
                <span className="capitalize">{accountTypeLabels[account.type]}</span>
                <span>•</span>
                <span>{account.currency}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="transactions">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Account Summary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Current Balance</h3>
                    <div className={`text-2xl font-bold ${isCredit && account.balance > 0 ? 'text-red-600' : account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit && account.balance > 0 ? '-' : ''}
                      {formatCurrency(Math.abs(account.balance))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isCredit ? account.balance > 0 ? 'Debt' : 'Available credit' : 
                       account.balance >= 0 ? 'Available funds' : 'Overdrawn'}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Account Type</h3>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{accountTypeLabels[account.type]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {account.type === 'cash' && 'Physical currency and cash equivalents'}
                      {account.type === 'bank' && 'Checking and savings accounts'}
                      {account.type === 'credit' && 'Credit and debit cards'}
                      {account.type === 'mobile' && 'Digital payment platforms'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Transaction Count</h3>
                    <div className="text-2xl font-bold">{accountTransactions.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Total transactions recorded
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Currency</h3>
                    <div className="text-2xl font-bold">{account.currency}</div>
                    <p className="text-sm text-muted-foreground">
                      Account currency
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-medium">Quick Actions</h3>
                <div className="grid gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={viewAllTransactions}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View All Transactions
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </Button>
                  
                  {isCredit && account.balance > 0 && (
                    <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <p className="text-sm text-orange-600">
                        💡 Consider paying more than the minimum to reduce interest charges
                      </p>
                    </div>
                  )}
                  
                  {!isCredit && account.balance < 0 && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-sm text-red-600">
                        ⚠️ Account is overdrawn. Please deposit funds soon.
                      </p>
                    </div>
                  )}
                  
                  {!isCredit && account.balance > 0 && account.balance < 100 && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-yellow-600">
                        💰 Low balance. Consider maintaining a buffer.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AccountAnalytics account={account} transactions={transactions} />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Recent Transactions</h3>
                  <Button variant="outline" size="sm" onClick={viewAllTransactions}>
                    View All
                  </Button>
                </div>
                
                {recentTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {recentTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.category} • {formatDate(transaction.date)}
                            </p>
                          </div>
                        </div>
                        <div className={`font-medium ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transactions found for this account</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
