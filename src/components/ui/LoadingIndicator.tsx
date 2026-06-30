'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingIndicator({ size = 'md', className, text }: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingState({ isLoading, children, fallback }: LoadingStateProps) {
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center py-4">
        <LoadingIndicator size="sm" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}

interface SkeletonItemProps {
  className?: string;
  showIcon?: boolean;
}

export function SkeletonItem({ className, showIcon = true }: SkeletonItemProps) {
  return (
    <div className={cn('flex items-center space-x-3 p-2', className)}>
      {showIcon && (
        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
      )}
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
