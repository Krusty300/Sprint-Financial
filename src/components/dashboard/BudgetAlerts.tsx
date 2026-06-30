'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Target
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DashboardStats } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface BudgetAlertsProps {
  stats: DashboardStats | null;
}

export function BudgetAlerts({ stats }: BudgetAlertsProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { budgetBreakdown, budgetHealth } = stats || { budgetBreakdown: [], budgetHealth: {} };

  // Get critical and warning budgets
  const overBudgetBudgets = budgetBreakdown.filter((b: any) => b.status === 'over-budget');
  const nearLimitBudgets = budgetBreakdown.filter((b: any) => b.status === 'near-limit');

  const handleReviewBudgets = () => {
    router.push('/budgets');
  };

  const hasAlerts = overBudgetBudgets.length > 0 || nearLimitBudgets.length > 0;

  if (!hasAlerts && budgetHealth === 'healthy') {
    return (
      <Card className={`border-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-success/10 border-success/30' : 'bg-success/5 border-success/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="h-5 w-5" />
            Budget Health - Excellent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-success text-sm">
            Great job! All your budgets are on track. Keep up the good work!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {overBudgetBudgets.length > 0 && (
        <Card className={`border-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-destructive/10 border-destructive/30' : 'bg-destructive/5 border-destructive/20'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-sm mb-4">
              You've exceeded your budget in {overBudgetBudgets.length} categor{overBudgetBudgets.length === 1 ? 'y' : 'ies'}. 
              Consider adjusting your spending or budget limits.
            </p>
            <div className="space-y-3">
              {overBudgetBudgets.map((budget: any) => (
                <div key={budget.category} className={`flex items-center justify-between p-3 ${resolvedTheme === 'dark' ? 'bg-card' : 'bg-background'} rounded-lg border-destructive/20`}>
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <div>
                      <div className="font-medium text-sm">{budget.category}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="text-xs font-bold tabular-nums">
                      +{formatCurrency(budget.spent - budget.budget)}
                    </Badge>
                    <div className="text-xs text-destructive mt-1 tabular-nums">
                      {budget.percentageUsed.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-destructive/20">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={handleReviewBudgets}
              >
                <Target className="h-4 w-4 mr-2" />
                Review Budgets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {nearLimitBudgets.length > 0 && (
        <Card className={`border-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-warning/10 border-warning/30' : 'bg-warning/5 border-warning/20'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-5 w-5" />
              Budget Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-warning text-sm mb-4">
              {nearLimitBudgets.length} categor{nearLimitBudgets.length === 1 ? 'y is' : 'ies are'} approaching their budget limits. 
              Monitor your spending closely.
            </p>
            <div className="space-y-3">
              {nearLimitBudgets.map((budget: any) => (
                <div key={budget.category} className={`flex items-center justify-between p-3 ${resolvedTheme === 'dark' ? 'bg-card' : 'bg-background'} rounded-lg border-warning/20`}>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <div>
                      <div className="font-medium text-sm">{budget.category}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs font-bold tabular-nums">
                      {formatCurrency(budget.budget - budget.spent)} left
                    </Badge>
                    <div className="text-xs text-warning mt-1 tabular-nums">
                      {budget.percentageUsed.toFixed(1)}% used
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-warning/20">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-warning border-warning/20 hover:bg-warning/10"
                onClick={handleReviewBudgets}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Health Summary */}
      <Card className={`border-2 rounded-lg ${resolvedTheme === 'dark' ? 'bg-info/10 border-info/30' : 'bg-info/5 border-info/20'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-info">
            <Target className="h-5 w-5" />
            Budget Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {budgetBreakdown.filter(b => b.status === 'on-track').length}
              </div>
              <div className="text-xs text-muted-foreground">On Track</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {budgetBreakdown.filter(b => b.status === 'near-limit').length}
              </div>
              <div className="text-xs text-muted-foreground">Warning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {budgetBreakdown.filter(b => b.status === 'over-budget').length}
              </div>
              <div className="text-xs text-muted-foreground">Over Budget</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-info/20">
            <div className="flex items-center justify-between">
              <span className="text-sm text-info">Overall Budget Health</span>
              <Badge 
                variant={budgetHealth === 'healthy' ? 'default' : 
                         budgetHealth === 'warning' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {budgetHealth === 'healthy' ? 'Healthy' : 
                 budgetHealth === 'warning' ? 'Warning' : 'Critical'}
              </Badge>
            </div>
            <p className="text-xs text-info mt-2">
              {budgetHealth === 'healthy' 
                ? 'All budgets are performing well within limits.'
                : budgetHealth === 'warning'
                  ? 'Some budgets need attention to avoid overspending.'
                  : 'Immediate action required to control overspending.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
