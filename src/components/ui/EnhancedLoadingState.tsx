'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface EnhancedLoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  success?: boolean;
  successMessage?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay' | 'inline';
  showRetry?: boolean;
  onRetry?: () => void;
  loadingMessage?: string;
  progress?: number;
}

export function EnhancedLoadingState({
  isLoading,
  error = null,
  success = false,
  successMessage,
  children,
  fallback,
  className,
  size = 'md',
  variant = 'default',
  showRetry = true,
  onRetry,
  loadingMessage = 'Loading...',
  progress
}: EnhancedLoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const containerClasses = {
    default: 'flex items-center justify-center p-4',
    overlay: 'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40',
    inline: 'flex items-center gap-2'
  };

  if (error) {
    return (
      <div className={cn(containerClasses[variant], className)}>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Something went wrong
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>
              
              {showRetry && onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn(containerClasses[variant], className)}>
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className={sizeClasses[size]} />
          {successMessage && (
            <span className="text-sm font-medium">{successMessage}</span>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    const LoadingContent = () => (
      <div className="flex items-center gap-2">
        <Loader2 className={cn('animate-spin', sizeClasses[size])} />
        <span className="text-sm text-muted-foreground">{loadingMessage}</span>
        {progress !== undefined && (
          <span className="text-xs text-muted-foreground">({Math.round(progress)}%)</span>
        )}
      </div>
    );

    if (variant === 'overlay') {
      return (
        <div className={cn(containerClasses[variant], className)}>
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <LoadingContent />
                {progress !== undefined && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className={cn(containerClasses[variant], className)}>
        <LoadingContent />
        {progress !== undefined && variant === 'default' && (
          <div className="w-full max-w-sm space-y-2 mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

interface ButtonLoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  loadingText?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  onClick?: () => void;
}

export function ButtonLoadingState({
  isLoading,
  children,
  disabled = false,
  loadingText,
  className,
  variant = 'default',
  size = 'default',
  onClick
}: ButtonLoadingStateProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn('relative', className)}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {isLoading ? (loadingText || 'Loading...') : children}
    </Button>
  );
}

interface FormLoadingStateProps {
  isLoading: boolean;
  error?: Error | null;
  success?: boolean;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormLoadingState({
  isLoading,
  error,
  success,
  successMessage,
  children,
  className
}: FormLoadingStateProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">{error.message}</span>
        </div>
      )}
      
      {success && successMessage && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-md">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-success">{successMessage}</span>
        </div>
      )}
      
      <div className={cn('relative', isLoading && 'opacity-50 pointer-events-none')}>
        {children}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
