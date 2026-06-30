'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface BudgetProgressIndicatorProps {
  spent: number;
  budget: number;
  categoryName: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function BudgetProgressIndicator({
  spent,
  budget,
  categoryName,
  showDetails = true,
  compact = false,
}: BudgetProgressIndicatorProps) {
  const { formatCurrency } = useCurrency();
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  
  // Determine status and color
  const getStatus = () => {
    if (percentage >= 100) return { status: 'over-budget', color: 'bg-destructive', icon: AlertCircle };
    if (percentage >= 80) return { status: 'near-limit', color: 'bg-warning', icon: TrendingUp };
    return { status: 'on-track', color: 'bg-success', icon: CheckCircle2 };
  };

  const { status, color, icon: StatusIcon } = getStatus();

  if (compact) {
    return (
      <div className="space-y-2 p-3 rounded-lg border bg-card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium truncate flex-1">{categoryName}</span>
          <span className="text-muted-foreground ml-2 flex-shrink-0 tabular-nums font-bold">{percentage.toFixed(0)}%</span>
        </div>
        <Progress value={Math.min(percentage, 100)} className="h-2" />
      </div>
    );
  }

  return (
    <Card className="border-l-4" style={{ borderLeftColor: status === 'over-budget' ? '#ef4444' : status === 'near-limit' ? '#f59e0b' : '#22c55e' }}>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="font-medium">{categoryName}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums">{formatCurrency(spent)}</div>
              <div className="text-xs text-muted-foreground tabular-nums">of {formatCurrency(budget)}</div>
            </div>
          </div>
          
          <Progress 
            value={Math.min(percentage, 100)} 
            className="h-2"
          />
          
          {showDetails && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{percentage.toFixed(0)}% used</span>
              <span className={status === 'over-budget' ? 'text-destructive' : status === 'near-limit' ? 'text-warning' : 'text-success'}>
                {status === 'over-budget' ? 'Over budget' : status === 'near-limit' ? 'Near limit' : 'On track'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
