'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { CircularProgress } from '@/components/ui/ProgressIndicator';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface BulkOperationProgressProps {
  operation: string;
  total: number;
  completed: number;
  failed: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

export function BulkOperationProgress({
  operation,
  total,
  completed,
  failed,
  status,
  error
}: BulkOperationProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'running':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Preparing...';
      case 'running':
        return `Processing ${completed} of ${total}...`;
      case 'completed':
        return `Completed ${completed} of ${total}`;
      case 'error':
        return `Failed: ${error || 'Unknown error'}`;
      case 'cancelled':
        return `Cancelled at ${completed} of ${total}`;
      default:
        return '';
    }
  };

  return (
    <Card className="border-l-4 border-l-primary rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{operation}</span>
          </div>
          <div className="flex items-center gap-2">
            {failed > 0 && (
              <Badge variant="destructive" className="text-xs">
                {failed} failed
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {total} total
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3">
          <ProgressIndicator
            value={completed}
            max={total}
            color={getStatusColor()}
            showLabel={false}
            size="sm"
          />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStatusText()}</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface CompactBulkProgressProps {
  completed: number;
  total: number;
  status: 'pending' | 'running' | 'completed' | 'error' | 'cancelled';
}

export function CompactBulkProgress({
  completed,
  total,
  status
}: CompactBulkProgressProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3">
      <CircularProgress
        value={percentage}
        size={24}
        strokeWidth={3}
        showLabel={false}
        color={status === 'error' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
      />
      <div className="flex-1">
        <ProgressIndicator
          value={completed}
          max={total}
          color={status === 'error' ? 'error' : 'primary'}
          showLabel={false}
          size="sm"
        />
      </div>
      <span className="text-sm text-muted-foreground min-w-12 text-right">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

export function BulkOperationSummary({
  operation,
  total,
  completed,
  failed,
  duration
}: {
  operation: string;
  total: number;
  completed: number;
  failed: number;
  duration?: number;
}) {
  const successRate = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <Card className="bg-green-50 border-green-200 rounded-lg">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-medium text-green-800">{operation} Complete</span>
          </div>
          {duration && (
            <span className="text-sm text-green-600">
              {duration}ms
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-800">{completed}</div>
            <div className="text-green-600">Success</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-800">{failed}</div>
            <div className="text-red-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-800">{successRate.toFixed(1)}%</div>
            <div className="text-green-600">Success Rate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
