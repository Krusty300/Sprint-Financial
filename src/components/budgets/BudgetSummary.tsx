'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrencyCountUp } from '@/hooks/useCountUp';
import { TrendingUp, AlertCircle, Target } from 'lucide-react';

interface BudgetSummaryProps {
  budgets: Budget[];
  totalSpent: number;
  totalBudget: number;
  overBudgetCount: number;
  nearLimitCount: number;
}

export function BudgetSummary({
  budgets,
  totalSpent,
  totalBudget,
  overBudgetCount,
  nearLimitCount,
}: BudgetSummaryProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();

  // Guard against invalid data
  const safeTotalSpent = Number(totalSpent) || 0;
  const safeTotalBudget = Number(totalBudget) || 0;
  const safeOverBudgetCount = Number(overBudgetCount) || 0;
  const safeNearLimitCount = Number(nearLimitCount) || 0;
  const safeBudgetsLength = Array.isArray(budgets) ? budgets.length : 0;

  const totalRemaining = safeTotalBudget - safeTotalSpent;
  const overallPercentage = safeTotalBudget > 0 ? (safeTotalSpent / safeTotalBudget) * 100 : 0;
  const isOverallOverBudget = safeTotalSpent > safeTotalBudget;

  // Animated number counting
  const { formatted: animatedTotalBudget } = useCurrencyCountUp(safeTotalBudget, { formatCurrency, duration: 800 });
  const { formatted: animatedTotalSpent } = useCurrencyCountUp(safeTotalSpent, { formatCurrency, duration: 800 });
  const { formatted: animatedTotalRemaining } = useCurrencyCountUp(totalRemaining, { formatCurrency, duration: 800 });

  const getOverallStatus = () => {
    if (isOverallOverBudget) {
      return {
        text: 'Over Budget',
        color: 'destructive' as const,
        icon: <AlertCircle className="h-4 w-4" />,
      };
    }
    if (overallPercentage >= 80) {
      return {
        text: 'Near Limit',
        color: 'secondary' as const,
        icon: <AlertCircle className="h-4 w-4" />,
      };
    }
    return {
      text: 'On Track',
      color: 'default' as const,
      icon: <TrendingUp className="h-4 w-4" />,
    };
  };

  const status = getOverallStatus();

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl animate-slide-up" style={{ animationDelay: '0ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Budget</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="text-xl sm:text-2xl font-bold tabular-nums">{animatedTotalBudget}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {safeBudgetsLength} budget{safeBudgetsLength !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Spent</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className={`text-xl sm:text-2xl font-bold tabular-nums ${isOverallOverBudget ? 'text-destructive' : ''}`}>
            {animatedTotalSpent}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {overallPercentage.toFixed(1)}% of budget
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Remaining</CardTitle>
          <Target className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className={`text-xl sm:text-2xl font-bold tabular-nums ${totalRemaining < 0 ? 'text-destructive' : 'text-success'}`}>
            {animatedTotalRemaining}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {totalRemaining >= 0 ? 'Available' : 'Over budget'}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl animate-slide-up" style={{ animationDelay: '300ms' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Status</CardTitle>
          {status.icon}
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Badge variant={status.color} className="text-[10px] sm:text-xs">
              {status.text}
            </Badge>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
            {safeOverBudgetCount > 0 && `${safeOverBudgetCount} over budget`}
            {safeOverBudgetCount > 0 && safeNearLimitCount > 0 && ' • '}
            {safeNearLimitCount > 0 && `${safeNearLimitCount} near limit`}
            {safeOverBudgetCount === 0 && safeNearLimitCount === 0 && 'All budgets on track'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
