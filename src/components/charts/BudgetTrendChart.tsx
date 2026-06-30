'use client';

import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BudgetTrendData {
  month: string;
  budget: number;
  spent: number;
  variance: number;
  percentageUsed: number;
  projected?: number;
}

interface BudgetTrendChartProps {
  data: BudgetTrendData[];
  title?: string;
  showProjection?: boolean;
  categories?: string[];
}

export function BudgetTrendChart({ 
  data, 
  title = "Budget Performance Trends", 
  showProjection = true,
  categories = []
}: BudgetTrendChartProps) {
  const { formatCurrency } = useCurrency();
  // Validate data
  const validatedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => 
      item && 
      typeof item.budget === 'number' && item.budget >= 0 &&
      typeof item.spent === 'number' && item.spent >= 0 &&
      typeof item.variance === 'number' &&
      typeof item.percentageUsed === 'number' &&
      item.month
    );
  }, [data]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    if (validatedData.length === 0) return { trend: 'stable', avgVariance: 0, totalOverspend: 0 };

    const recentMonths = validatedData.slice(-3); // Last 3 months
    const avgVariance = recentMonths.reduce((sum, month) => sum + month.variance, 0) / recentMonths.length;
    const totalOverspend = validatedData.filter(m => m.spent > m.budget).length;
    
    let trend = 'stable';
    if (avgVariance > 10) trend = 'increasing';
    else if (avgVariance < -10) trend = 'decreasing';

    return { trend, avgVariance, totalOverspend };
  }, [validatedData]);

  // Generate projection data
  const projectedData = useMemo(() => {
    if (!showProjection || validatedData.length < 2) return [];

    const lastTwoMonths = validatedData.slice(-2);
    const avgSpending = lastTwoMonths.reduce((sum, m) => sum + m.spent, 0) / lastTwoMonths.length;
    const avgBudget = lastTwoMonths.reduce((sum, m) => sum + m.budget, 0) / lastTwoMonths.length;
    
    // Project next 3 months
    const projections = [];
    for (let i = 1; i <= 3; i++) {
      const lastMonth = new Date(validatedData[validatedData.length - 1].month);
      const projectedMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + i, 1);
      
      projections.push({
        month: projectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        budget: avgBudget,
        spent: avgSpending,
        variance: avgSpending - avgBudget,
        percentageUsed: (avgSpending / avgBudget) * 100,
        projected: true
      });
    }
    
    return projections;
  }, [validatedData, showProjection]);

  const allData = [...validatedData, ...projectedData];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Budget:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(data.budget)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Spent:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-red-600' : 
                data.percentageUsed >= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {formatCurrency(data.spent)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Variance:</span>
              <span className={`font-medium ${
                data.variance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {data.variance > 0 ? '+' : ''}{formatCurrency(data.variance)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Used:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-red-600' : 
                data.percentageUsed >= 80 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {data.percentageUsed.toFixed(1)}%
              </span>
            </div>
            {data.projected && (
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Projected</span>
                <span className="text-muted-foreground">Forecast</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getTrendIcon = () => {
    switch (trendStats.trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trendStats.trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      default: return 'text-blue-600';
    }
  };

  // Handle empty data case
  if (validatedData.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trend data available</p>
            <p className="text-sm">Add budgets over multiple months to see trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex items-center gap-2">
            {showProjection && (
              <Badge variant="outline" className="text-xs">
                {projectedData.length} months projected
              </Badge>
            )}
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <span className={`text-sm font-medium ${getTrendColor()}`}>
                {trendStats.trend.charAt(0).toUpperCase() + trendStats.trend.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <AreaChart data={allData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                name="Budget"
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
                name="Spent"
              />
              {showProjection && projectedData.length > 0 && (
                <Area 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.1}
                  strokeDasharray="5 5"
                  name="Projected"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Analysis */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Average Budget
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(data.reduce((sum, m) => sum + m.budget, 0) / data.length)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Per month
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
              Average Spending
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(data.reduce((sum, m) => sum + m.spent, 0) / data.length)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              Per month
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Budget Variance
            </div>
            <div className={`text-lg font-bold ${
              trendStats.avgVariance > 0 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'
            }`}>
              {trendStats.avgVariance > 0 ? '+' : ''}{formatCurrency(trendStats.avgVariance)}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Average variance
            </div>
          </div>
        </div>

        {/* Overspending Analysis */}
        {trendStats.totalOverspend > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                Overspending Alert
              </span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">
              You've exceeded your budget in {trendStats.totalOverspend} out of {data.length} months. 
              Consider adjusting your budget or reviewing spending habits.
            </p>
          </div>
        )}

        {/* Projection Insights */}
        {showProjection && projectedData.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Projection Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                  Next Month Projection
                </div>
                <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                  {formatCurrency(projectedData[0]?.spent || 0)}
                </div>
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  Based on current trends
                </div>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                  3-Month Projection
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(projectedData[projectedData.length - 1]?.spent || 0)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Forecasted spending
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Budget Performance
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={trendStats.trend === 'increasing' ? 'destructive' : 
                       trendStats.trend === 'decreasing' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {trendStats.trend === 'increasing' ? 'Needs Attention' : 
                 trendStats.trend === 'decreasing' ? 'Improving' : 'Stable'}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {trendStats.trend === 'increasing' 
              ? 'Your spending is trending upward. Consider reviewing your budget.'
              : trendStats.trend === 'decreasing'
                ? 'Great job! Your spending is trending downward.'
                : 'Your spending is stable. Keep monitoring your budget.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
