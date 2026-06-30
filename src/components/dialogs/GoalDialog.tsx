'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialGoal } from '@/lib/types';
import { toast } from 'sonner';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: FinancialGoal | null;
  onSave: (goal: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
}

export function GoalDialog({ open, onOpenChange, goal, onSave }: GoalDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'savings' as FinancialGoal['category'],
    priority: 'medium' as FinancialGoal['priority'],
  });

  // Reset form when dialog opens or goal changes
  useEffect(() => {
    if (open) {
      if (goal) {
        setFormData({
          name: goal.name,
          targetAmount: goal.targetAmount.toString(),
          currentAmount: goal.currentAmount.toString(),
          deadline: goal.deadline,
          category: goal.category,
          priority: goal.priority,
        });
      } else {
        setFormData({
          name: '',
          targetAmount: '',
          currentAmount: '',
          deadline: '',
          category: 'savings',
          priority: 'medium',
        });
      }
    }
  }, [open, goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount);
    const currentAmount = parseFloat(formData.currentAmount || '0');

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    if (isNaN(currentAmount) || currentAmount < 0) {
      toast.error('Please enter a valid current amount');
      return;
    }

    const goalData = {
      name: formData.name,
      targetAmount,
      currentAmount,
      deadline: formData.deadline,
      category: formData.category,
      priority: formData.priority,
    };

    onSave(goalData);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: 'savings',
      priority: 'medium',
    });

    toast.success(goal ? 'Goal updated successfully!' : 'Goal created successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="goal-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {goal ? 'Edit Financial Goal' : 'Add Financial Goal'}
          </DialogTitle>
          <DialogDescription id="goal-dialog-description">
            Set a financial goal to track your progress towards saving for specific targets.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAmount">Target Amount *</Label>
              <Input
                id="targetAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="10000.00"
                value={formData.targetAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentAmount">Current Amount</Label>
              <Input
                id="currentAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="2500.00"
                value={formData.currentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Target Date *</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value: FinancialGoal['category']) => 
                setFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="debt_reduction">Debt Reduction</SelectItem>
                  <SelectItem value="expense_limit">Expense Limit</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: FinancialGoal['priority']) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
