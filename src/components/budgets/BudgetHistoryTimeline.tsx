'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BudgetHistoryEntry } from '@/hooks/useBudgetHistory';
import { Clock, Edit, Archive, RotateCcw, Trash2, Plus } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface BudgetHistoryTimelineProps {
  history: BudgetHistoryEntry[];
  onClose?: () => void;
}

export function BudgetHistoryTimeline({ history, onClose }: BudgetHistoryTimelineProps) {
  const { formatCurrency } = useCurrency();

  const getChangeIcon = (changeType: BudgetHistoryEntry['changeType']) => {
    switch (changeType) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-orange-500" />;
      case 'restored':
        return <RotateCcw className="h-4 w-4 text-purple-500" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
    }
  };

  const getChangeColor = (changeType: BudgetHistoryEntry['changeType']) => {
    switch (changeType) {
      case 'created':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'updated':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'restored':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'deleted':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatChangeDescription = (entry: BudgetHistoryEntry) => {
    const changes: string[] = [];

    if (entry.changes.amount) {
      changes.push(`amount: ${formatCurrency(entry.changes.amount.from)} → ${formatCurrency(entry.changes.amount.to)}`);
    }
    if (entry.changes.period) {
      changes.push(`period: ${entry.changes.period.from} → ${entry.changes.period.to}`);
    }
    if (entry.changes.category) {
      changes.push(`category: ${entry.changes.category.from} → ${entry.changes.category.to}`);
    }
    if (entry.changes.rolloverEnabled !== undefined) {
      changes.push(`rollover: ${entry.changes.rolloverEnabled.from ? 'enabled' : 'disabled'} → ${entry.changes.rolloverEnabled.to ? 'enabled' : 'disabled'}`);
    }

    return changes.length > 0 ? changes.join(', ') : 'No changes recorded';
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Budget History</CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No history recorded for this budget yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Budget History</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.slice().reverse().map((entry, index) => (
            <div key={entry.id} className="relative pl-6 pb-4 last:pb-0">
              {index !== history.length - 1 && (
                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border" />
              )}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getChangeIcon(entry.changeType)}
                    <Badge variant="outline" className={getChangeColor(entry.changeType)}>
                      {entry.changeType.charAt(0).toUpperCase() + entry.changeType.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatChangeDescription(entry)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
