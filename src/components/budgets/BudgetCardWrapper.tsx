'use client';

import { useItemAnimation } from '@/hooks/useUpdateAnimation';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Budget } from '@/lib/types';

interface BudgetCardWrapperProps {
  budget: Budget;
  spent: number;
  remaining: number;
  percentageUsed: number;
  updatedBudgetId: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

export function BudgetCardWrapper({ 
  budget, 
  spent, 
  remaining, 
  percentageUsed, 
  updatedBudgetId,
  onEdit, 
  onDelete, 
  onArchive,
  isSelected,
  onSelect,
  index 
}: BudgetCardWrapperProps) {
  const { shouldAnimate } = useItemAnimation(budget.id, updatedBudgetId);
  return (
    <div className={`relative ${shouldAnimate ? 'flash-success' : ''}`}>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="absolute top-2 right-2 z-10"
      />
      <BudgetCard
        budget={budget}
        spent={spent}
        remaining={remaining}
        percentageUsed={percentageUsed}
        onEdit={onEdit}
        onDelete={onDelete}
        onArchive={onArchive}
      />
    </div>
  );
}
