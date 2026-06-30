'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { SparklineChart } from './SparklineChart';
import { Transaction } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useCategories } from '@/hooks/useCategories';

interface MonthlyComparisonProps {
  transactions: Transaction[];
  className?: string;
}

export function MonthlyComparison({ transactions, className }: MonthlyComparisonProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const { categories } = useCategories();

  if (!transactions || transactions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">No transaction data available</p>
        </CardContent>
      </Card>
    );
  }

  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  // Group transactions by month
  const monthlyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        income: 0,
        expenses: 0,
        transactions: []
      };
    }
    
    if (transaction.type === 'income') {
      acc[monthKey].income += transaction.amount;
    } else {
      acc[monthKey].expenses += transaction.amount;
    }
    
    acc[monthKey].transactions.push(transaction);
    
    return acc;
  }, {} as Record<string, { month: string; income: number; expenses: number; transactions: Transaction[] }>);

  // Sort by month and get last 6 months
  const sortedMonths = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  // Get current month data
  const currentMonth = sortedMonths[sortedMonths.length - 1];
  const previousMonth = sortedMonths[sortedMonths.length - 2];

  // Category breakdown for current month expenses
  const categoryBreakdown = currentMonth?.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = getCategoryName(transaction.category);
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name,
    value
  }));

  // Sparkline data for trends
  const incomeTrend = sortedMonths.map(m => m.income);
  const expensesTrend = sortedMonths.map(m => m.expenses);

  // Line chart data
  const lineChartData = sortedMonths.map(m => ({
    label: formatDate(m.month + '-01'),
    income: m.income,
    expenses: m.expenses
  }));

  // Calculate month-over-month change
  const incomeChange = previousMonth 
    ? ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100 
    : 0;
  const expensesChange = previousMonth 
    ? ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 
    : 0;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Income</span>
                <Badge variant={incomeChange >= 0 ? "default" : "destructive"} className="text-xs">
                  {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                </Badge>
              </div>
              <SparklineChart 
                data={incomeTrend} 
                color="#10b981" 
                positive={incomeChange >= 0}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <Badge variant={expensesChange <= 0 ? "default" : "destructive"} className="text-xs">
                  {expensesChange >= 0 ? '+' : ''}{expensesChange.toFixed(1)}%
                </Badge>
              </div>
              <SparklineChart 
                data={expensesTrend} 
                color="#ef4444" 
                positive={expensesChange <= 0}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={categoryData} size={150} />
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart data={lineChartData} height={150} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
