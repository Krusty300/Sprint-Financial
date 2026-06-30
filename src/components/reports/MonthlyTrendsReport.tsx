'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface MonthlyTrendsReportProps {
  monthlyTrend: DashboardStats['monthlyTrend'];
}

export function MonthlyTrendsReport({ monthlyTrend }: MonthlyTrendsReportProps) {
  const { formatCurrency } = useCurrency();
  
  if (!monthlyTrend || !Array.isArray(monthlyTrend) || monthlyTrend.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate trend data structure
  const validTrendData = monthlyTrend.filter(month => 
    month && 
    typeof month.income === 'number' && 
    typeof month.expenses === 'number' &&
    !isNaN(month.income) && 
    !isNaN(month.expenses)
  );

  if (validTrendData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Insufficient data for trend analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend indicators using validated data
  const currentMonth = validTrendData[validTrendData.length - 1];
  const previousMonth = validTrendData[validTrendData.length - 2];
  
  const incomeTrend = currentMonth.income - previousMonth.income;
  const expenseTrend = currentMonth.expenses - previousMonth.expenses;
  const savingsTrend = (currentMonth.income - currentMonth.expenses) - (previousMonth.income - previousMonth.expenses);

  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return {
        icon: <TrendingUp className="h-3 w-3" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        text: `+${formatCurrency(value)}`,
      };
    } else if (value < 0) {
      return {
        icon: <TrendingDown className="h-3 w-3" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        text: formatCurrency(value),
      };
    }
    return {
      icon: <Minus className="h-3 w-3" />,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      text: 'No change',
    };
  };

  const incomeIndicator = getTrendIndicator(incomeTrend);
  const expenseIndicator = getTrendIndicator(expenseTrend);
  const savingsIndicator = getTrendIndicator(savingsTrend);

  // Custom tooltip for charts
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Trend Indicators */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Income Trend</p>
                <p className="text-lg font-semibold">{formatCurrency(currentMonth.income)}</p>
              </div>
              <Badge className={`${incomeIndicator.bgColor} ${incomeIndicator.color} flex items-center gap-1`}>
                {incomeIndicator.icon}
                {incomeIndicator.text}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Expense Trend</p>
                <p className="text-lg font-semibold">{formatCurrency(currentMonth.expenses)}</p>
              </div>
              <Badge className={`${expenseIndicator.bgColor} ${expenseIndicator.color} flex items-center gap-1`}>
                {expenseIndicator.icon}
                {expenseIndicator.text}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Savings Trend</p>
                <p className="text-lg font-semibold">{formatCurrency(currentMonth.income - currentMonth.expenses)}</p>
              </div>
              <Badge className={`${savingsIndicator.bgColor} ${savingsIndicator.color} flex items-center gap-1`}>
                {savingsIndicator.icon}
                {savingsIndicator.text}
              </Badge>
            </div>
          </div>

          {/* Line Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Income vs Expenses Trend</h3>
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={undefined}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
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
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Monthly Comparison</h3>
            <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={undefined}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
