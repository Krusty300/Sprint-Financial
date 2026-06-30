'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CashFlowItem {
  name: string;
  amount: number;
  type: 'income' | 'expense' | 'net';
  color?: string;
}

interface CashFlowChartProps {
  income: number;
  expenses: number;
  categories?: Array<{
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
  title?: string;
  showDetails?: boolean;
}

export function CashFlowChart({ 
  income, 
  expenses, 
  categories = [], 
  title = "Cash Flow Analysis",
  showDetails = true 
}: CashFlowChartProps) {
  const { formatCurrency } = useCurrency();
  const { chartData, finalBalance } = useMemo(() => {
    const data: CashFlowItem[] = [];
    let runningTotal = 0;

    // Add starting income
    data.push({
      name: 'Starting Income',
      amount: income,
      type: 'income',
      color: '#10b981'
    });
    runningTotal += income;

    // Add expense categories if provided
    if (showDetails && categories.length > 0) {
      categories
        .filter(cat => cat.type === 'expense')
        .forEach(category => {
          data.push({
            name: category.category,
            amount: -category.amount,
            type: 'expense',
            color: '#ef4444'
          });
          runningTotal -= category.amount;
        });
    } else {
      // Add total expenses as single item
      data.push({
        name: 'Total Expenses',
        amount: -expenses,
        type: 'expense',
        color: '#ef4444'
      });
      runningTotal -= expenses;
    }

    // Add final net
    data.push({
      name: 'Net Cash Flow',
      amount: runningTotal,
      type: 'net',
      color: runningTotal >= 0 ? '#3b82f6' : '#dc2626'
    });

    return { chartData: data, finalBalance: runningTotal };
  }, [income, expenses, categories, showDetails]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className={`text-sm font-medium ${
            data.type === 'income' ? 'text-green-600' : 
            data.type === 'expense' ? 'text-red-600' : 
            data.amount >= 0 ? 'text-blue-600' : 'text-red-600'
          }`}>
            {data.type === 'income' ? '+' : 
             data.type === 'expense' ? '-' : 
             data.amount >= 0 ? '+' : ''}
            {formatCurrency(Math.abs(data.amount))}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.type === 'income' ? 'Income' : 
             data.type === 'expense' ? 'Expense' : 
             'Net Result'}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props;
    
    if (payload.type === 'net') {
      // Create a different style for net result
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            opacity={0.8}
          />
          <rect
            x={x}
            y={y}
            width={width}
            height={2}
            fill={payload.amount >= 0 ? '#10b981' : '#ef4444'}
          />
        </g>
      );
    }
    
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  };

  const savingsRate = income > 0 ? ((income - expenses) / income * 100) : 0;
  const isPositiveCashFlow = finalBalance >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showDetails ? "default" : "outline"}
              size="sm"
              onClick={() => {/* Toggle details - would need state */}}
            >
              {showDetails ? "Detailed" : "Summary"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                shape={CustomBar}
                fill="#8884d8"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Summary */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Total Income
            </div>
            <div className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(income)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">Inflow</span>
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Total Expenses
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(expenses)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">Outflow</span>
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Net Cash Flow
            </div>
            <div className={`text-lg font-bold ${isPositiveCashFlow ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
              {isPositiveCashFlow ? '+' : ''}{formatCurrency(finalBalance)}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {isPositiveCashFlow ? (
                <TrendingUp className="h-3 w-3 text-blue-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs ${isPositiveCashFlow ? 'text-blue-600' : 'text-red-600'}`}>
                {isPositiveCashFlow ? 'Positive' : 'Negative'}
              </span>
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Savings Rate
            </div>
            <div className={`text-lg font-bold ${savingsRate >= 20 ? 'text-purple-700 dark:text-purple-300' : 'text-orange-700 dark:text-orange-300'}`}>
              {savingsRate.toFixed(1)}%
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <Badge 
                variant={savingsRate >= 20 ? "default" : "secondary"} 
                className="text-xs"
              >
                {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {showDetails && categories.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 6)
                .map((category) => (
                  <div 
                    key={category.category}
                    className="flex items-center justify-between p-2 rounded bg-muted/50"
                  >
                    <span className="text-sm font-medium">{category.category}</span>
                    <span className={`text-sm font-medium ${
                      category.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {category.type === 'income' ? '+' : '-'}
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={isPositiveCashFlow ? "default" : "destructive"} className="text-xs">
                {isPositiveCashFlow ? 'Healthy Cash Flow' : 'Negative Cash Flow'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {isPositiveCashFlow 
                  ? 'Your income exceeds expenses' 
                  : 'Your expenses exceed income'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Cash Flow Margin
              </div>
              <div className={`text-sm font-medium ${isPositiveCashFlow ? 'text-green-600' : 'text-red-600'}`}>
                {income > 0 ? ((finalBalance / income) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
