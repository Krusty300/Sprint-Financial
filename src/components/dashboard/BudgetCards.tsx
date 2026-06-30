'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Target,
  DollarSign,
  PieChart,
  Calendar
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DashboardStats } from '@/lib/types';

interface BudgetCardsProps {
  stats: DashboardStats | null;
}

export function BudgetCards({ stats }: BudgetCardsProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  
  // Validate stats data
  if (!stats || typeof stats !== 'object') {
    console.warn('Invalid stats data provided to BudgetCards:', stats);
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No budget data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const { budgetBreakdown, totalBudget, totalSpent, budgetHealth } = stats;

  // Validate numeric values
  const safeTotalBudget = typeof totalBudget === 'number' && !isNaN(totalBudget) ? totalBudget : 0;
  const safeTotalSpent = typeof totalSpent === 'number' && !isNaN(totalSpent) ? totalSpent : 0;

  const getHealthIcon = () => {
    switch (budgetHealth) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'critical': return <TrendingDown className="h-5 w-5 text-destructive" />;
      default: return <Target className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getHealthColor = () => {
    switch (budgetHealth) {
      case 'healthy': return resolvedTheme === 'dark' ? 'bg-success/20 border-success/30 text-success' : 'bg-success/10 border-success/20 text-success';
      case 'warning': return resolvedTheme === 'dark' ? 'bg-warning/20 border-warning/30 text-warning' : 'bg-warning/10 border-warning/20 text-warning';
      case 'critical': return resolvedTheme === 'dark' ? 'bg-destructive/20 border-destructive/30 text-destructive' : 'bg-destructive/10 border-destructive/20 text-destructive';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'near-limit': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'over-budget': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-success';
      case 'near-limit': return 'text-warning';
      case 'over-budget': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const overallPercentage = safeTotalBudget > 0 ? (safeTotalSpent / safeTotalBudget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Overview Card */}
      <Card className={`border-2 ${getHealthColor()} rounded-xl`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getHealthIcon()}
              Budget Overview
            </CardTitle>
            <Badge 
              variant={budgetHealth === 'healthy' ? 'default' : 
                       budgetHealth === 'warning' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {budgetHealth === 'healthy' ? 'On Track' : 
               budgetHealth === 'warning' ? 'Warning' : 'Critical'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
                {formatCurrency(safeTotalBudget)}
              </div>
              <div className="text-sm text-muted-foreground">Total Budget</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${getStatusColor(budgetHealth)}`}>
                {formatCurrency(safeTotalSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl sm:text-3xl font-bold tabular-nums ${getStatusColor(budgetHealth)}`}>
                {formatCurrency(safeTotalBudget - safeTotalSpent)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Budget Usage</span>
              <span className={`font-medium ${getStatusColor(budgetHealth)}`}>
                {overallPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(overallPercentage, 100)} 
              className={`h-2 ${budgetHealth === 'healthy' ? '[&>div]:bg-success' : budgetHealth === 'warning' ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetBreakdown.slice(0, 6).map((budget) => (
          <Card key={budget.category} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{budget.category}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{budget.period}</span>
                  </div>
                </div>
                {getStatusIcon(budget.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-bold tabular-nums">{formatCurrency(budget.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className={`font-bold tabular-nums ${getStatusColor(budget.status)}`}>
                    {formatCurrency(budget.spent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={`font-bold tabular-nums ${budget.remaining >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(budget.remaining)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Used</span>
                    <span className={`font-medium ${getStatusColor(budget.status)}`}>
                      {budget.percentageUsed.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budget.percentageUsed, 100)} 
                    className={`h-1 ${budget.status === 'on-track' ? '[&>div]:bg-success' : budget.status === 'near-limit' ? '[&>div]:bg-warning' : '[&>div]:bg-destructive'}`}
                  />
                </div>
                <div className="pt-2 border-t">
                  <Badge 
                    variant={budget.status === 'on-track' ? 'default' : 
                             budget.status === 'near-limit' ? 'secondary' : 'destructive'}
                    className="text-xs w-full justify-center"
                  >
                    {budget.status === 'over-budget' ? 'Over Budget' : 
                     budget.status === 'near-limit' ? 'Near Limit' : 'On Track'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-success">
              {budgetBreakdown.filter(b => b.status === 'on-track').length}
            </div>
            <div className="text-sm text-muted-foreground">On Track</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-warning">
              {budgetBreakdown.filter(b => b.status === 'near-limit').length}
            </div>
            <div className="text-sm text-muted-foreground">Near Limit</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">
              {budgetBreakdown.filter(b => b.status === 'over-budget').length}
            </div>
            <div className="text-sm text-muted-foreground">Over Budget</div>
          </CardContent>
        </Card>
        
        <Card className="text-center hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              {budgetBreakdown.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Budgets</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
