'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account, Transaction } from '@/lib/types';

interface TrendData {
  date: string;
  balance: number;
  income: number;
  expenses: number;
}

export function AccountBalanceTrend({ account, transactions }: { account: Account; transactions: Transaction[] }) {
  const { formatCurrency } = useCurrency();
  const trendData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Generate daily data for current month
    const data: TrendData[] = [];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    for (let day = 1; day <= Math.min(daysInMonth, now.getDate()); day++) {
      const currentDate = new Date(now.getFullYear(), now.getMonth(), day);
      const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
      
      const dayTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.account === account.name && transactionDate >= currentDate && transactionDate < nextDate;
      });
      
      const income = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate running balance
      const allPreviousTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.account === account.name && transactionDate < nextDate;
      });
      
      const balance = allPreviousTransactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
      
      data.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance,
        income,
        expenses
      });
    }
    
    return data;
  }, [account, transactions]);

  const statistics = useMemo(() => {
    if (trendData.length === 0) return { trend: 'stable', netChange: 0, avgBalance: 0 };
    
    const startBalance = trendData[0].balance;
    const endBalance = trendData[trendData.length - 1].balance;
    const netChange = endBalance - startBalance;
    const avgBalance = trendData.reduce((sum, d) => sum + d.balance, 0) / trendData.length;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (netChange > avgBalance * 0.05) trend = 'increasing';
    else if (netChange < -avgBalance * 0.05) trend = 'decreasing';
    else trend = 'stable';
    
    return { trend, netChange, avgBalance };
  }, [trendData]);

  const getTrendIcon = () => {
    switch (statistics.trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Balance Trend - {account.name}
          {getTrendIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <Badge variant={statistics.trend === 'increasing' ? 'default' : statistics.trend === 'decreasing' ? 'destructive' : 'secondary'}>
            {statistics.trend.charAt(0).toUpperCase() + statistics.trend.slice(1)}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Net Change: <span className={statistics.netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {statistics.netChange >= 0 ? '+' : ''}{formatCurrency(statistics.netChange)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
