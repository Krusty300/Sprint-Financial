import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { FinancialGoal } from '@/lib/types';
import { useGoals } from './useGoals';

export interface UseGoalActionsReturn {
  showGoalDialog: boolean;
  showDeleteDialog: boolean;
  editingGoal: FinancialGoal | null;
  goalToDelete: FinancialGoal | null;
  handleGoalAction: (action: 'add' | 'edit' | 'delete', goal?: FinancialGoal) => void;
  handleSaveGoal: (goalData: Omit<FinancialGoal, 'id' | 'createdAt'>) => void;
  handleDeleteGoal: () => void;
  closeGoalDialog: () => void;
  closeDeleteDialog: () => void;
}

/**
 * Custom hook for managing goal-related actions
 * Handles add, edit, and delete operations with proper state management
 */
export function useGoalActions(): UseGoalActionsReturn {
  const { addGoal, updateGoal, deleteGoal } = useGoals();
  
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  const handleGoalAction = useCallback((action: 'add' | 'edit' | 'delete', goal?: FinancialGoal) => {
    switch (action) {
      case 'add':
        setEditingGoal(null);
        setShowGoalDialog(true);
        break;
      case 'edit':
        if (goal) {
          setEditingGoal(goal);
          setShowGoalDialog(true);
        }
        break;
      case 'delete':
        if (goal) {
          setGoalToDelete(goal);
          setShowDeleteDialog(true);
        }
        break;
    }
  }, []);

  const handleSaveGoal = useCallback((goalData: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
    try {
      if (editingGoal) {
        updateGoal(editingGoal.id, goalData);
        toast.success('Goal updated successfully!');
      } else {
        addGoal(goalData);
        toast.success('Goal added successfully!');
      }
      setShowGoalDialog(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(`Failed to save goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [editingGoal, addGoal, updateGoal]);

  const handleDeleteGoal = useCallback(() => {
    if (goalToDelete) {
      try {
        deleteGoal(goalToDelete.id);
        toast.success('Goal deleted successfully!');
        setGoalToDelete(null);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error(`Failed to delete goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }, [goalToDelete, deleteGoal]);

  const closeGoalDialog = useCallback(() => {
    setShowGoalDialog(false);
    setEditingGoal(null);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setGoalToDelete(null);
  }, []);

  return {
    showGoalDialog,
    showDeleteDialog,
    editingGoal,
    goalToDelete,
    handleGoalAction,
    handleSaveGoal,
    handleDeleteGoal,
    closeGoalDialog,
    closeDeleteDialog
  };
}
