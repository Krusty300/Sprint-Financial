import { useState, useEffect, useCallback } from 'react';
import { FinancialGoal } from '@/lib/types';

export function useGoals() {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load goals from localStorage on mount
  useEffect(() => {
    const loadGoals = () => {
      try {
        const storedGoals = localStorage.getItem('finance-tracker-goals');
        if (storedGoals) {
          const parsedGoals = JSON.parse(storedGoals);
          setGoals(parsedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  // Save goals to localStorage whenever they change
  useEffect(() => {
    if (goals.length > 0) {
      try {
        localStorage.setItem('finance-tracker-goals', JSON.stringify(goals));
      } catch (error) {
        console.error('Error saving goals:', error);
      }
    }
  }, [goals]);

  const addGoal = useCallback((goalData: Omit<FinancialGoal, 'id' | 'createdAt'>) => {
      try {
        const newGoal: FinancialGoal = {
          ...goalData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };

        setGoals(prev => [...prev, newGoal]);
        return newGoal;
      } catch (error) {
        console.error('Error adding goal:', error);
        throw error;
      }
    }, []);

  const updateGoal = useCallback((id: string, updates: Partial<FinancialGoal>) => {
      try {
        setGoals(prev => 
          prev.map(goal => 
            goal.id === id ? { ...goal, ...updates } : goal
          )
        );
        
        // Update localStorage
        const updatedGoals = goals.map(goal => 
          goal.id === id ? { ...goal, ...updates } : goal
        );
        localStorage.setItem('finance-tracker-goals', JSON.stringify(updatedGoals));
        
        return goals.find(g => g.id === id);
      } catch (error) {
        console.error('Error updating goal:', error);
        throw error;
      }
    }, [goals]);

  const deleteGoal = useCallback((id: string) => {
      try {
        setGoals(prev => prev.filter(goal => goal.id !== id));
        
        // Update localStorage
        const updatedGoals = goals.filter(goal => goal.id !== id);
        localStorage.setItem('finance-tracker-goals', JSON.stringify(updatedGoals));
        
        return true;
      } catch (error) {
        console.error('Error deleting goal:', error);
        throw error;
      }
    }, [goals]);

  const getGoalsByCategory = useCallback((category: FinancialGoal['category']) => {
      return goals.filter(goal => goal.category === category);
    }, [goals]);

  const getGoalsByPriority = useCallback((priority: FinancialGoal['priority']) => {
      return goals.filter(goal => goal.priority === priority);
    }, [goals]);

  const getOverdueGoals = useCallback(() => {
      const now = new Date();
      return goals.filter(goal => {
        const deadlineDate = new Date(goal.deadline);
        return deadlineDate < now;
      });
    }, [goals]);

  const getCompletedGoals = useCallback(() => {
      return goals.filter(goal => goal.currentAmount >= goal.targetAmount);
    }, [goals]);

  return {
    goals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalsByCategory,
    getGoalsByPriority,
    getOverdueGoals,
    getCompletedGoals,
    refreshGoals: () => {
      try {
        const storedGoals = localStorage.getItem('finance-tracker-goals');
        if (storedGoals) {
          const parsedGoals = JSON.parse(storedGoals);
          setGoals(parsedGoals);
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    },
  };
}
