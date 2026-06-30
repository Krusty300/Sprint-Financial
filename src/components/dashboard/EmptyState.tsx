import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface EmptyStateProps {
  type: 'no-data' | 'no-transactions' | 'no-budgets' | 'no-categories' | 'welcome';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className 
}: EmptyStateProps) {
  const getConfig = () => {
    switch (type) {
      case 'welcome':
        return {
          icon: <Sparkles className="h-12 w-12 text-primary" />,
          title: title || 'Welcome to Sprint Dashboard',
          description: description || 'Get started by adding your first transaction or budget to begin tracking your finances.',
          actionLabel: actionLabel || 'Add Your First Transaction',
        };
      case 'no-data':
        return {
          icon: <Wallet className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No Data Available',
          description: description || 'Start by adding some financial data to see your dashboard come to life.',
          actionLabel: actionLabel || 'Add Data',
        };
      case 'no-transactions':
        return {
          icon: <TrendingUp className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No Transactions Yet',
          description: description || 'Your transaction history will appear here once you start tracking your spending.',
          actionLabel: actionLabel || 'Add Transaction',
        };
      case 'no-budgets':
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No Budgets Set',
          description: description || 'Create budgets to track your spending and stay on top of your financial goals.',
          actionLabel: actionLabel || 'Create Budget',
        };
      case 'no-categories':
        return {
          icon: <Wallet className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No Categories',
          description: description || 'Add categories to organize your transactions and get better insights.',
          actionLabel: actionLabel || 'Add Category',
        };
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-muted-foreground" />,
          title: title || 'No Data',
          description: description || 'No data available at this time.',
          actionLabel: actionLabel || 'Refresh',
        };
    }
  };

  const config = getConfig();

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 animate-pulse">
          {config.icon}
        </div>
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {config.description}
        </p>
        {onAction && (
          <Button 
            onClick={onAction}
            className="group"
          >
            {config.actionLabel}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
