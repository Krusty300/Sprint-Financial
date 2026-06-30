'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account, Transaction } from '@/lib/types';

interface WaterfallData {
  name: string;
  amount: number;
  type: 'opening' | 'income' | 'expense' | 'closing';
  cumulative: number;
}

interface AccountBalanceWaterfallProps {
  account: Account;
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter' | 'year';
  title?: string;
}

export function AccountBalanceWaterfall({ 
  account, 
  transactions, 
  period = 'month',
  title = "Account Balance Waterfall"
}: AccountBalanceWaterfallProps) {
  const { formatCurrency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  // Calculate waterfall data
  const waterfallData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let periodLabel: string;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        periodLabel = 'Last 7 Days';
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        periodLabel = 'Last 3 Months';
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        periodLabel = 'Last Year';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = 'This Month';
    }

    // Filter transactions for the account and period
    const accountTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.account === account.name && transactionDate >= startDate && transactionDate <= now;
    });

    // Calculate opening balance (transactions before period)
    const openingTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.account === account.name && transactionDate < startDate;
    });

    const openingBalance = openingTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);

    // Group transactions by type
    const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Build waterfall data
    const data: WaterfallData[] = [
      {
        name: 'Opening Balance',
        amount: openingBalance,
        type: 'opening',
        cumulative: openingBalance
      }
    ];

    // Add income items
    if (incomeTransactions.length > 0) {
      data.push({
        name: 'Total Income',
        amount: totalIncome,
        type: 'income',
        cumulative: openingBalance + totalIncome
      });
    }

    // Add expense items
    if (expenseTransactions.length > 0) {
      data.push({
        name: 'Total Expenses',
        amount: -totalExpenses,
        type: 'expense',
        cumulative: openingBalance + totalIncome - totalExpenses
      });
    }

    // Add closing balance
    const closingBalance = openingBalance + totalIncome - totalExpenses;
    data.push({
      name: 'Closing Balance',
      amount: closingBalance,
      type: 'closing',
      cumulative: closingBalance
    });

    return { data, periodLabel };
  }, [account, transactions, selectedPeriod]);

  const getBarColor = (type: string) => {
    switch (type) {
      case 'opening': return '#3b82f6';
      case 'income': return '#10b981';
      case 'expense': return '#ef4444';
      case 'closing': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opening': return <DollarSign className="h-4 w-4" />;
      case 'income': return <ArrowUpRight className="h-4 w-4" />;
      case 'expense': return <ArrowDownRight className="h-4 w-4" />;
      case 'closing': return <TrendingUp className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium flex items-center gap-2">
            {getIcon(data.type)}
            {label}
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Amount:</span>
              <span className={`font-medium ${
                data.type === 'expense' ? 'text-red-600' : 
                data.type === 'income' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {data.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(data.amount))}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Running Total:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(data.cumulative)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const { data, periodLabel } = waterfallData;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {title} - {account.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              {periodLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <BarChart data={data} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" stackId="stack">
                {data.map((entry: WaterfallData, index: number) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.map((item: WaterfallData, index: number) => (
            <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${getBarColor(item.type)}20` }}>
              <div className="flex items-center justify-center gap-1 mb-1">
                {getIcon(item.type)}
                <span className="text-xs font-medium" style={{ color: getBarColor(item.type) }}>
                  {item.type === 'opening' ? 'Opening' :
                   item.type === 'income' ? 'Income' :
                   item.type === 'expense' ? 'Expenses' : 'Closing'}
                </span>
              </div>
              <div className={`text-lg font-bold ${
                item.type === 'expense' ? 'text-red-600' : 
                item.type === 'income' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {item.type === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(item.amount))}
              </div>
              <div className="text-xs text-muted-foreground">
                Total: {formatCurrency(item.cumulative)}
              </div>
            </div>
          ))}
        </div>

        {/* Account Health Indicator */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Account Health
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={data[data.length - 1].cumulative >= 0 ? 'default' : 'destructive'}
                className="text-xs"
              >
                {data[data.length - 1].cumulative >= 0 ? 'Healthy' : 'Negative Balance'}
              </Badge>
              <span className={`text-sm font-medium ${
                data[data.length - 1].cumulative >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(data[data.length - 1].cumulative)}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data[data.length - 1].cumulative >= 0 
              ? 'Account balance is positive and healthy.'
              : 'Account has a negative balance. Review recent transactions.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
