'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedProgress } from '@/components/ui/AnimatedProgress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Budget } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Edit, Trash2, AlertCircle, TrendingUp, TrendingDown, Calendar, RotateCcw, Archive } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCurrencyCountUp, usePercentageCountUp } from '@/hooks/useCountUp';
import { getPeriodDisplayText } from '@/utils/period-aware-calculations';
import { memo, useMemo, useState, useEffect, useRef } from 'react';

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  remaining: number;
  percentageUsed: number;
  onEdit: () => void;
  onDelete: () => void;
  onArchive?: () => void;
}

export const BudgetCard = memo(function BudgetCard({ 
  budget, 
  spent, 
  remaining, 
  percentageUsed, 
  onEdit, 
  onDelete,
  onArchive 
}: BudgetCardProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const { categories } = useCategories();
  
  // Guard against undefined budget
  if (!budget) {
    return null;
  }
  
  const isOverBudget = percentageUsed > 100;
  const isNearLimit = percentageUsed >= 80 && percentageUsed <= 100;

  // Animation state for status changes only
  const [animateStatus, setAnimateStatus] = useState(false);
  const prevStatusRef = useRef<'on-track' | 'near-limit' | 'over-budget'>(
    isOverBudget ? 'over-budget' : isNearLimit ? 'near-limit' : 'on-track'
  );

  // Animate status changes when they actually change
  useEffect(() => {
    const currentStatus = isOverBudget ? 'over-budget' : isNearLimit ? 'near-limit' : 'on-track';
    if (currentStatus !== prevStatusRef.current) {
      setAnimateStatus(true);
      prevStatusRef.current = currentStatus;
      setTimeout(() => setAnimateStatus(false), 300);
    }
  }, [isOverBudget, isNearLimit]);

  // Animated number counting
  const { formatted: animatedSpent } = useCurrencyCountUp(spent, { formatCurrency, duration: 600 });
  const { formatted: animatedRemaining } = useCurrencyCountUp(remaining, { formatCurrency, duration: 600 });
  const { percentage: animatedPercentage } = usePercentageCountUp(percentageUsed, { duration: 600 });

  // Memoize category lookup to avoid repeated array searches
  const categoryName = useMemo(() => {
    if (!budget?.category) return 'Unknown';
    const category = categories.find(c => c.id === budget.category);
    return category?.name || budget.category || 'Unknown';
  }, [categories, budget?.category]);
  
  // Memoize status calculations
  const statusColor = useMemo(() => {
    if (isOverBudget) return 'destructive';
    if (isNearLimit) return 'secondary';
    return 'default';
  }, [isOverBudget, isNearLimit]);

  const statusText = useMemo(() => {
    if (isOverBudget) return 'Over Budget';
    if (isNearLimit) return 'Near Limit';
    return 'On Track';
  }, [isOverBudget, isNearLimit]);

  const statusIcon = useMemo(() => {
    if (isOverBudget) return <TrendingDown className="h-3 w-3" />;
    if (isNearLimit) return <AlertCircle className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  }, [isOverBudget, isNearLimit]);

  
  return (
    <Card className={`relative hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl ${animateStatus ? 'status-change' : ''}`}>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg truncate">{categoryName}</CardTitle>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{getPeriodDisplayText(budget)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Badge 
              variant={statusColor} 
              className={`flex items-center gap-1 transition-all duration-300 text-xs ${animateStatus ? 'scale-110' : ''}`}
            >
              {statusIcon}
              <span className="hidden sm:inline">{statusText}</span>
            </Badge>
            {budget.rolloverEnabled && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs hidden sm:flex">
                <RotateCcw className="h-3 w-3" />
                Rollover
              </Badge>
            )}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              {onArchive && !budget.isArchived && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onArchive}
                  className="h-8 w-8 p-0"
                >
                  <Archive className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium tabular-nums">{formatCurrency(budget.amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className={`font-medium tabular-nums ${isOverBudget ? 'text-destructive' : ''}`}>
              {animatedSpent}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Remaining</span>
            <span className={`font-medium tabular-nums ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
              {animatedRemaining}
            </span>
          </div>
          {budget.rolloverEnabled && budget.rolloverAmount !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rollover</span>
              <span className={`font-medium ${budget.rolloverAmount > 0 ? 'text-success' : 'text-destructive'}`}>
                {budget.rolloverAmount > 0 ? '+' : ''}{formatCurrency(budget.rolloverAmount)}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className={`font-medium tabular-nums ${isOverBudget ? 'text-destructive' : ''}`}>
              {animatedPercentage}
            </span>
          </div>
          <AnimatedProgress 
            value={Math.min(percentageUsed, 100)} 
            variant="striped"
            color={isOverBudget ? 'error' : isNearLimit ? 'warning' : 'success'}
            size="md"
            showLabel={false}
          />
        </div>

        {isOverBudget && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>You've exceeded your budget by {formatCurrency(Math.abs(remaining))}</span>
          </div>
        )}

        {isNearLimit && !isOverBudget && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            resolvedTheme === 'dark' ? 'bg-warning/20 text-warning' : 'bg-warning/10 text-warning'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span>You have {formatCurrency(remaining)} remaining</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
