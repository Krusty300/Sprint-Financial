'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Target
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action, secondaryAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon && (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        
        <div className="flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyTransactionsState() {
  return (
    <EmptyState
      title="No transactions yet"
      description="Start tracking your finances by adding your first income or expense transaction."
      icon={<FileText className="w-8 h-8 text-muted-foreground" />}
      action={{
        label: "Add First Transaction",
        onClick: () => {
          // Trigger transaction dialog
          const event = new CustomEvent('open-transaction-dialog');
          document.dispatchEvent(event);
        },
        icon: <Plus className="w-4 h-4" />
      }}
    />
  );
}

export function NoSearchResultsState() {
  return (
    <EmptyState
      title="No transactions found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      icon={<Search className="w-8 h-8 text-muted-foreground" />}
      secondaryAction={{
        label: "Clear Filters",
        onClick: () => {
          // Clear all filters
          const event = new CustomEvent('clear-all-filters');
          document.dispatchEvent(event);
        }
      }}
    />
  );
}

export function NoFilterResultsState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      title="No transactions match your filters"
      description="Try adjusting your filter criteria or clear all filters to see all transactions."
      icon={<Filter className="w-8 h-8 text-muted-foreground" />}
      secondaryAction={{
        label: "Clear Filters",
        onClick: onClearFilters || (() => {
          // Clear all filters
          const event = new CustomEvent('clear-all-filters');
          document.dispatchEvent(event);
        })
      }}
    />
  );
}

export function EmptyChartsState() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingUp className="w-8 h-8 text-muted-foreground mb-3" />
          <h4 className="font-medium mb-2">No Income Data</h4>
          <p className="text-sm text-muted-foreground">Add income transactions to see spending trends</p>
        </CardContent>
      </Card>
      
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <TrendingDown className="w-8 h-8 text-muted-foreground mb-3" />
          <h4 className="font-medium mb-2">No Expense Data</h4>
          <p className="text-sm text-muted-foreground">Add expense transactions to see category breakdown</p>
        </CardContent>
      </Card>
      
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Wallet className="w-8 h-8 text-muted-foreground mb-3" />
          <h4 className="font-medium mb-2">No Cash Flow Data</h4>
          <p className="text-sm text-muted-foreground">Add transactions to see cash flow analysis</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmptySelectionState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
      <Target className="w-8 h-8 text-muted-foreground mb-3" />
      <h4 className="font-medium mb-2">No transactions selected</h4>
      <p className="text-sm text-muted-foreground mb-4">Select transactions using the checkboxes to perform bulk actions</p>
      <div className="flex gap-2">
        <Badge variant="outline" className="text-xs">
          Select multiple items
        </Badge>
        <Badge variant="outline" className="text-xs">
          Use bulk actions
        </Badge>
      </div>
    </div>
  );
}
