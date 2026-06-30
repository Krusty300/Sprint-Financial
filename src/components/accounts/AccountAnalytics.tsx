'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Account, Transaction } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, TrendingDown, Activity, Target, Calendar, AlertCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface AccountAnalyticsProps {
  account: Account;
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AccountAnalytics({ account, transactions }: AccountAnalyticsProps) {
  const { formatCurrency } = useCurrency();
  
  // Filter transactions for this account
  const accountTransactions = transactions.filter(t => t.account === account.name);
  
  // Calculate analytics
  const totalTransactions = accountTransactions.length;
  const totalIncome = accountTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Get recent transactions (last 30 days) - use UTC for consistency
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTransactions = accountTransactions.filter(t => {
    if (!t || !t.date) return false;
    const transactionDate = new Date(t.date);
    if (isNaN(transactionDate.getTime())) return false;
    return transactionDate.getTime() >= thirtyDaysAgo.getTime();
  });
  
  // Calculate category breakdown for expenses
  const expensesByCategory = accountTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const existing = acc.find(item => item.category === t.category);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc.push({
          category: t.category,
          amount: t.amount,
        });
      }
      return acc;
    }, [] as Array<{ category: string; amount: number }>)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // Calculate monthly trend (last 6 months) - use UTC for consistency
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const trendDate = new Date();
    trendDate.setMonth(trendDate.getMonth() - i);
    const monthStart = new Date(trendDate.getFullYear(), trendDate.getMonth(), 1);
    const monthEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0);
    
    const monthTransactions = accountTransactions.filter(t => {
      if (!t || !t.date) return false;
      const transactionDate = new Date(t.date);
      if (isNaN(transactionDate.getTime())) return false;
      // Use timestamp comparison for consistency
      return transactionDate.getTime() >= monthStart.getTime() && 
             transactionDate.getTime() <= monthEnd.getTime();
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthExpenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    monthlyTrend.push({
      month: trendDate.toLocaleDateString('en-US', { month: 'short' }),
      income: monthIncome,
      expenses: monthExpenses,
      net: monthIncome - monthExpenses,
    });
  }

  // Calculate activity metrics
  const avgTransactionAmount = totalTransactions > 0 ? 
    (totalIncome + totalExpenses) / totalTransactions : 0;
  const mostActiveDay = accountTransactions.length > 0 ? 
    'Frequent activity detected' : 'No recent activity';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {recentTransactions.length} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(totalIncome - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Income - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            6-Month Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyTrend.some(t => t.income > 0 || t.expenses > 0) ? (
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={undefined}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Income"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="Expenses"
                />
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Net"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No transaction history available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Categories */}
      {expensesByCategory.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pie Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4">Distribution</h4>
                <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={undefined}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => {
                        if (typeof value === 'number') {
                          return formatCurrency(value);
                        }
                        if (typeof value === 'string') {
                          return formatCurrency(parseFloat(value) || 0);
                        }
                        return formatCurrency(0);
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category List */}
              <div>
                <h4 className="text-sm font-medium mb-4">Breakdown</h4>
                <div className="space-y-3">
                  {expensesByCategory.map((category, index) => {
                    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.amount, 0);
                    const percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
                    
                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{category.category}</span>
                          <span>{formatCurrency(category.amount)}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}%</span>
                          <span>{accountTransactions.filter(t => t.category === category.category).length} transactions</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Insights */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Transaction Pattern</h4>
              <p className="text-sm text-muted-foreground">
                {avgTransactionAmount > 1000 ? 
                  'High-value transactions' :
                  avgTransactionAmount > 100 ?
                    'Medium-value transactions' :
                    'Small-value transactions'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Average: {formatCurrency(avgTransactionAmount)}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Account Activity</h4>
              <p className="text-sm text-muted-foreground">{mostActiveDay}</p>
              <p className="text-xs text-muted-foreground">
                {totalTransactions === 0 && 'No transactions recorded'}
                {totalTransactions > 0 && totalTransactions <= 10 && 'Light usage'}
                {totalTransactions > 10 && totalTransactions <= 50 && 'Moderate usage'}
                {totalTransactions > 50 && 'Heavy usage'}
              </p>
            </div>
          </div>

          {account.type === 'credit' && account.balance > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-600">Credit Card Debt</h4>
                <p className="text-sm text-muted-foreground">
                  Current balance: {formatCurrency(account.balance)}. 
                  Consider paying more than the minimum to reduce interest charges.
                </p>
              </div>
            </div>
          )}

          {account.type !== 'credit' && account.balance < 0 && (
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-600">Overdrawn Account</h4>
                <p className="text-sm text-muted-foreground">
                  Account is overdrawn by {formatCurrency(Math.abs(account.balance))}. 
                  Please deposit funds to avoid overdraft fees.
                </p>
              </div>
            </div>
          )}

          {account.type !== 'credit' && account.balance > 0 && account.balance < 100 && (
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-600">Low Balance</h4>
                <p className="text-sm text-muted-foreground">
                  Current balance: {formatCurrency(account.balance)}. 
                  Consider maintaining a buffer for unexpected expenses.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
