'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { addTransaction } = useTransactions();
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const { resolvedTheme } = useTheme();

  // Validate transactions data and memoize to prevent re-renders
  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions.filter(t => 
      t && 
      t.id && 
      t.date && 
      typeof t.amount === 'number' && 
      !isNaN(t.amount) &&
      ['income', 'expense'].includes(t.type)
    ) : [];
  }, [transactions]);

  const handleAddTransaction = () => {
    // Navigate to transactions page or open add dialog
    router.push('/transactions?action=add');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    return accounts.find(acc => acc.id === accountId);
  };

  if (safeTransactions.length === 0) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <p className="text-muted-foreground text-center">
              No recent transactions
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Start tracking your finances by adding your first transaction
            </p>
            <Button 
              onClick={handleAddTransaction}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {safeTransactions.slice(0, 5).map((transaction: Transaction) => {
            const category = getCategoryInfo(transaction.category);
            const account = getAccountInfo(transaction.account);
            const isIncome = transaction.type === 'income';

            return (
              <div key={transaction.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${isIncome ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {isIncome ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      {category && (
                        <Badge variant="secondary" style={{ backgroundColor: category.color + '20', color: category.color }}>
                          {category.name}
                        </Badge>
                      )}
                      <span>{formatDate(transaction.date)}</span>
                      {account && (
                        <span>• {account.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`font-bold text-lg tabular-nums ${isIncome ? 'text-success' : 'text-destructive'}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
