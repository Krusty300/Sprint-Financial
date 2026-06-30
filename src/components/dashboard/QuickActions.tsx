'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import { 
  Plus, 
  Wallet, 
  TrendingUp, 
  FileText, 
  Target,
  ArrowRight
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => void;
  color: string;
}

export function QuickActions() {
  const router = useRouter();
  const { openQuickAdd } = useQuickAdd();

  const quickActions: QuickAction[] = [
    {
      id: 'add-expense',
      label: 'Add Expense',
      icon: <Plus className="h-5 w-5" />,
      description: 'Quickly add a new expense',
      action: () => openQuickAdd(),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'check-budget',
      label: 'Check Budget',
      icon: <Wallet className="h-5 w-5" />,
      description: 'View your budget status',
      action: () => router.push('/budgets'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'view-reports',
      label: 'View Reports',
      icon: <FileText className="h-5 w-5" />,
      description: 'Analyze your finances',
      action: () => router.push('/reports'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'track-goals',
      label: 'Track Goals',
      icon: <Target className="h-5 w-5" />,
      description: 'Monitor financial goals',
      action: () => router.push('/reports'),
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-base sm:text-lg">Quick Actions</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto flex-col py-3 sm:py-4 px-2 sm:px-3 gap-1 sm:gap-2 hover:bg-accent"
              onClick={action.action}
            >
              <div className={`p-1.5 sm:p-2 rounded-full ${action.color} text-white`}>
                <div className="h-4 w-4 sm:h-5 sm:w-5">
                  {action.icon}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs sm:text-sm font-medium">{action.label}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          className="w-full mt-3 sm:mt-4 text-xs sm:text-sm"
          onClick={() => router.push('/accounts')}
        >
          View All Features
          <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
