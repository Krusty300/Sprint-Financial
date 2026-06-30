'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Budget } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { AlertTriangle } from 'lucide-react';

interface DeleteBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onConfirm: () => void;
}

export function DeleteBudgetDialog({
  open,
  onOpenChange,
  budget,
  onConfirm,
}: DeleteBudgetDialogProps) {
  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();
  
  if (!budget) return null;

  // Map category ID to name
  const category = categories.find(c => c.id === budget.category);
  const categoryName = category?.name || budget.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] mx-4" aria-describedby="delete-budget-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Budget</DialogTitle>
          </div>
          <DialogDescription id="delete-budget-dialog-description">
            Are you sure you want to delete the budget for "{categoryName}"? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{categoryName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Amount</span>
              <span className="font-medium">{formatCurrency(budget.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Period</span>
              <span className="font-medium capitalize">{budget.period}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            Delete Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
