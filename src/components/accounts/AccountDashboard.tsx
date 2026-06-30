'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Smartphone,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account, Transaction } from '@/lib/types';
import { useBankIntegration } from '@/hooks/useBankIntegration';

interface AccountDashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  selectedAccount?: Account | null;
  onAccountSelect?: (account: Account) => void;
}

export function AccountDashboard({ 
  accounts, 
  transactions, 
  selectedAccount, 
  onAccountSelect 
}: AccountDashboardProps) {
  const { formatCurrency } = useCurrency();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const { bankFeedStatus } = useBankIntegration();

  const dashboardStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filteredTransactions = transactions.filter(t => {
      if (!t || !t.date) return false;
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return false;
      // Use UTC timestamp comparison for consistency
      return transactionDate.getTime() >= startDate.getTime() && 
             transactionDate.getTime() <= now.getTime();
    });

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const netChange = totalIncome - totalExpenses;

    const accountStats = accounts.map(account => {
      const accountTransactions = filteredTransactions.filter(t => t.account === account.name);
      const accountIncome = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const accountExpenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const accountNetChange = accountIncome - accountExpenses;
      const transactionCount = accountTransactions.length;

      return {
        ...account,
        income: accountIncome,
        expenses: accountExpenses,
        netChange: accountNetChange,
        transactionCount,
        healthScore: calculateHealthScore(account, accountNetChange, transactionCount)
      };
    });

    const topPerformers = accountStats
      .filter(account => account.netChange > 0)
      .sort((a, b) => b.netChange - a.netChange)
      .slice(0, 3);

    const needsAttention = accountStats
      .filter(account => account.balance < 0 || account.healthScore < 50)
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 3);

    return {
      totalBalance,
      totalIncome,
      totalExpenses,
      netChange,
      accountCount: accounts.length,
      transactionCount: filteredTransactions.length,
      topPerformers,
      needsAttention,
      accountStats
    };
  }, [accounts, transactions, timeRange]);

  function calculateHealthScore(account: Account, netChange: number, transactionCount: number): number {
    let score = 100;
    
    // Balance health
    if (account.balance < 0) score -= 40;
    else if (account.balance < 100) score -= 20;
    
    // Activity health
    if (transactionCount === 0) score -= 30;
    else if (transactionCount < 5) score -= 10;
    
    // Net change health
    if (netChange < -100) score -= 30;
    else if (netChange < 0) score -= 15;
    
    return Math.max(0, score);
  }

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'bank': return <DollarSign className="h-4 w-4" />;
      case 'credit': return <CreditCard className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Banking Integration Status */}
      <Card className="rounded-xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Bank Integration Status</h3>
              <p className="text-sm text-muted-foreground">
                {bankFeedStatus.totalAccounts} accounts connected • 
                {bankFeedStatus.totalTransactions} transactions imported
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                bankFeedStatus.status === 'active' ? 'bg-green-500' :
                bankFeedStatus.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
              <span className="text-sm font-medium capitalize">{bankFeedStatus.status}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/banking'}
              >
                Manage Banking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboardStats.totalBalance)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(dashboardStats.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(dashboardStats.totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Change</p>
                <p className={`text-2xl font-bold ${dashboardStats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardStats.netChange >= 0 ? '+' : ''}{formatCurrency(dashboardStats.netChange)}
                </p>
              </div>
              {dashboardStats.netChange >= 0 ? 
                <ArrowUpRight className="h-8 w-8 text-green-600" /> : 
                <ArrowDownRight className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Accounts</p>
                <p className="text-2xl font-bold">{dashboardStats.accountCount}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Account Performance</h3>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performers */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.topPerformers.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No top performers this period</p>
                </div>
              ) : (
                dashboardStats.topPerformers.map((account, index) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                       onClick={() => onAccountSelect?.(account)}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.transactionCount} transactions</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+{formatCurrency(account.netChange)}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(account.balance)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Needs Attention */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.needsAttention.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">All accounts are healthy!</p>
                </div>
              ) : (
                dashboardStats.needsAttention.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                       onClick={() => onAccountSelect?.(account)}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{account.name}</p>
                          <p className="text-sm text-muted-foreground">{account.transactionCount} transactions</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getHealthColor(account.healthScore)}`}>
                        {formatCurrency(account.balance)}
                      </p>
                      <div className="flex items-center gap-1">
                        {getHealthBadge(account.healthScore)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Health Overview */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Account Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardStats.accountStats.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                   onClick={() => onAccountSelect?.(account)}>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{account.type}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-medium">{formatCurrency(account.balance)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Net Change</p>
                    <p className={`font-medium ${account.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {account.netChange >= 0 ? '+' : ''}{formatCurrency(account.netChange)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="font-medium">{account.transactionCount}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <p className="text-sm text-muted-foreground mb-1">Health</p>
                      <Progress value={account.healthScore} className="h-2" />
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getHealthColor(account.healthScore)}`}>
                        {account.healthScore}%
                      </p>
                      {getHealthBadge(account.healthScore)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
