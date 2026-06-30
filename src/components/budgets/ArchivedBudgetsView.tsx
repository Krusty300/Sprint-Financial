'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Budget } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { Archive, Trash2, Calendar } from 'lucide-react';
import { calculatePeriodSpending } from '@/utils/period-aware-calculations';
import { toast } from 'sonner';

interface ArchivedBudgetsViewProps {
  budgets: Budget[];
  transactions: any[];
  onRestore: (budget: Budget) => Promise<void>;
  onDelete: (budget: Budget) => Promise<void>;
}

export function ArchivedBudgetsView({ 
  budgets, 
  transactions, 
  onRestore, 
  onDelete 
}: ArchivedBudgetsViewProps) {
  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();

  const archivedBudgetsWithSpending = budgets
    .filter(b => b.isArchived)
    .map(budget => {
      const safeTransactions = transactions || [];
      const spent = calculatePeriodSpending(budget, safeTransactions);
      const remaining = budget.amount - spent;
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        budget,
        spent,
        remaining,
        percentageUsed,
      };
    });

  const handleDeleteAll = async () => {
    if (confirm('Are you sure you want to delete all archived budgets? This cannot be undone.')) {
      try {
        await Promise.all(archivedBudgetsWithSpending.map(({ budget }) => onDelete(budget)));
        toast.success('All archived budgets deleted');
      } catch (error) {
        toast.error('Failed to delete all archived budgets');
      }
    }
  };

  if (archivedBudgetsWithSpending.length === 0) {
    return (
      <Card className="text-center py-8 sm:py-12 rounded-xl">
        <div className="space-y-4 px-4">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
            <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold">No archived budgets</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Archived budgets will appear here. Archive budgets you don't want to delete but aren't currently using.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {archivedBudgetsWithSpending.length} archived budget{archivedBudgetsWithSpending.length !== 1 ? 's' : ''}
        </p>
        {archivedBudgetsWithSpending.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAll}
            className="w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {archivedBudgetsWithSpending.map(({ budget, spent, remaining, percentageUsed }, index) => (
          <Card key={`archived-${budget.id}-${index}`} className="opacity-75 hover:opacity-100 transition-opacity">
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base truncate">
                    {categories?.find(c => c.id === budget.category)?.name || budget.category}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{budget.period}</span>
                  </div>
                  {budget.archivedAt && (
                    <div className="text-xs text-muted-foreground">
                      Archived {new Date(budget.archivedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="flex-shrink-0 text-xs">
                  Archived
                </Badge>
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
                  <span className="font-medium tabular-nums">{formatCurrency(spent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className={`font-medium tabular-nums ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(budget)}
                  className="flex-1"
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Restore
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(budget)}
                  className="flex-1"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
