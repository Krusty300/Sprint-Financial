'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface PageLoaderProps {
  isLoading?: boolean;
  isRefreshing?: boolean;
  progress?: number;
  stage?: string;
  error?: Error | null;
  title?: string;
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export function PageLoader({
  isLoading = false,
  isRefreshing = false,
  progress = 0,
  stage = 'Loading...',
  error = null,
  title = 'Loading Data',
  message = 'Please wait while we load your data',
  showRetry = false,
  onRetry
}: PageLoaderProps) {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive mb-2">
                  Loading Failed
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {error.message || 'An unknown error occurred while loading data'}
                </p>
              </div>
              
              {showRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && !isRefreshing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center space-y-4">
          {/* Loading Icon */}
          <div className="mx-auto w-12 h-12 relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          
          {/* Title and Message */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isRefreshing ? 'Refreshing Data' : title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          {(progress > 0 || stage !== 'Loading...') && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stage}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Loading Details */}
          <div className="text-xs text-muted-foreground space-y-1">
            {isRefreshing && (
              <p>Updating your data with the latest changes...</p>
            )}
            <p className="flex items-center justify-center gap-1">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              This should only take a moment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for page content
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-6">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-muted rounded animate-pulse"></div>
      </div>

      {/* Content Skeleton */}
      <div className="grid gap-6">
        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 space-y-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-8 w-32 bg-muted rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Table/List Skeleton */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-3 border-b">
              <div className="h-10 w-10 bg-muted rounded animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-3/4 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Loading overlay for specific sections
 */
export function SectionLoader({ 
  isLoading, 
  message = 'Loading...' 
}: { 
  isLoading: boolean; 
  message?: string; 
}) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-40 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message}
      </div>
    </div>
  );
}
