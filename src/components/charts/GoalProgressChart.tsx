'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'savings' | 'debt_reduction' | 'expense_limit' | 'investment';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface GoalProgressChartProps {
  goals: Goal[];
  title?: string;
  showAddGoal?: boolean;
  onGoalAction?: (action: 'add' | 'edit' | 'delete', goal?: Goal) => void;
}

export function GoalProgressChart({ 
  goals, 
  title = "Financial Goals", 
  showAddGoal = true,
  onGoalAction 
}: GoalProgressChartProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getStatus = (goal: Goal) => {
    const progress = calculateProgress(goal);
    const daysRemaining = getDaysRemaining(goal.deadline);
    
    if (progress >= 100) return 'completed';
    if (daysRemaining === 0) return 'overdue';
    if (daysRemaining <= 7) return 'due_soon';
    if (progress >= 80) return 'on_track';
    if (progress >= 50) return 'in_progress';
    return 'behind';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'on_track': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'due_soon': return 'bg-orange-100 text-orange-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'behind': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'on_track': return <TrendingUp className="h-4 w-4" />;
      case 'due_soon': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'behind': return <TrendingDown className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'savings': return 'bg-green-500';
      case 'debt_reduction': return 'bg-red-500';
      case 'expense_limit': return 'bg-blue-500';
      case 'investment': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    // Sort by status first, then by priority
    const statusOrder = {
      'overdue': 0,
      'due_soon': 1,
      'behind': 2,
      'in_progress': 3,
      'on_track': 4,
      'completed': 5
    };
    
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    
    const statusDiff = statusOrder[getStatus(a)] - statusOrder[getStatus(b)];
    if (statusDiff !== 0) return statusDiff;
    
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const stats = {
    total: goals.length,
    completed: goals.filter(g => getStatus(g) === 'completed').length,
    inProgress: goals.filter(g => ['in_progress', 'on_track'].includes(getStatus(g))).length,
    behind: goals.filter(g => ['behind', 'due_soon', 'overdue'].includes(getStatus(g))).length,
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalProgress: goals.reduce((sum, g) => sum + g.currentAmount, 0)
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {showAddGoal && (
            <Button size="sm" onClick={() => onGoalAction?.('add')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Completed
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.completed}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              {((stats.completed / stats.total) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              In Progress
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.inProgress}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {((stats.inProgress / stats.total) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Behind
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {stats.behind}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {((stats.behind / stats.total) * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Overall Progress
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.totalTarget > 0 ? ((stats.totalProgress / stats.totalTarget) * 100).toFixed(0) : '0'}%
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.totalProgress)} / {formatCurrency(stats.totalTarget)}
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {sortedGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No financial goals set yet</p>
              {showAddGoal && (
                <Button size="sm" className="mt-2" onClick={() => onGoalAction?.('add')}>
                  Add Your First Goal
                </Button>
              )}
            </div>
          ) : (
            sortedGoals.map(goal => {
              const progress = calculateProgress(goal);
              const status = getStatus(goal);
              const daysRemaining = getDaysRemaining(goal.deadline);
              
              return (
                <div 
                  key={goal.id}
                  className={`p-4 rounded-lg border ${
                    selectedGoal === goal.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{goal.name}</h3>
                        <Badge className={getPriorityColor(goal.priority)}>
                          {goal.priority}
                        </Badge>
                        <Badge className={getStatusColor(status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(status)}
                            <span className="capitalize">
                              {status.replace('_', ' ')}
                            </span>
                          </div>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getCategoryColor(goal.category)}`}></div>
                          <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{daysRemaining} days left</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {onGoalAction && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGoalAction('edit', goal)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGoalAction('delete', goal)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(goal.currentAmount)}</span>
                      <span>{formatCurrency(goal.targetAmount)}</span>
                    </div>
                  </div>
                  
                  {/* Target Date */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Target Date</span>
                    <span>{formatDate(goal.deadline)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        {goals.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {stats.completed === stats.total 
                  ? '🎉 All goals completed! Great job!' 
                  : stats.behind > 0 
                    ? `⚠️ ${stats.behind} goal${stats.behind > 1 ? 's' : ''} need attention`
                    : `📈 ${stats.inProgress} goal${stats.inProgress > 1 ? 's' : ''} in progress`
                }
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onGoalAction?.('add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
