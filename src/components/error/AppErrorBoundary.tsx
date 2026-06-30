'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Show toast notification
    toast.error('Something went wrong. The app has recovered safely.', {
      duration: 5000,
      action: {
        label: 'Details',
        onClick: () => this.showErrorDetails()
      }
    });

    // Log error details for debugging
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    };

    try {
      // Store error in localStorage for debugging
      const existingErrors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      existingErrors.push(errorData);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('app-errors', JSON.stringify(existingErrors));
    } catch (storageError) {
      console.error('Failed to store error details:', storageError);
    }
  };

  private showErrorDetails = () => {
    const { error, errorInfo, errorId } = this.state;
    if (!error) return;

    const details = `
Error ID: ${errorId}
Message: ${error.message}
Stack: ${error.stack || 'No stack available'}
Component Stack: ${errorInfo?.componentStack || 'No component stack available'}
Timestamp: ${new Date().toISOString()}
    `.trim();

    console.group(`🚨 App Error Details (${errorId})`);
    console.error(details);
    console.groupEnd();

    // Try to copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(details).then(() => {
        toast.success('Error details copied to clipboard');
      }).catch(() => {
        toast.error('Failed to copy error details');
      });
    }
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleClearStorage = () => {
    try {
      // Clear only app-specific data, not browser data
      const keysToKeep = ['theme', 'currency', 'onboarding-completed'];
      const allKeys = Object.keys(localStorage);
      
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key) && !key.startsWith('finance-tracker-')) {
          localStorage.removeItem(key);
        }
      });

      toast.success('App data cleared. Please refresh the page.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      toast.error('Failed to clear app data');
    }
  };

  private handleHardReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      toast.success('All data cleared. Please refresh the page.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to hard reset:', error);
      toast.error('Failed to clear all data');
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
              <p className="text-muted-foreground mt-2">
                The app encountered an error but has recovered safely.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Error Details:</h4>
                <p className="text-sm text-muted-foreground">
                  <strong>Error ID:</strong> {this.state.errorId}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Message:</strong> {this.state.error?.message || 'Unknown error'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This error has been logged for debugging purposes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.showErrorDetails}
                  className="flex-1"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  View Details
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 text-sm">Recovery Options:</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleClearStorage}
                    className="w-full justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear App Data & Refresh
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={this.handleHardReset}
                    className="w-full justify-start"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data & Refresh
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                If the problem persists, please check the browser console for more details.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary in functional components
export const useErrorHandler = () => {
  const showError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    toast.error(`Something went wrong${context ? ` in ${context}` : ''}`, {
      duration: 5000
    });
  };

  const showWarning = (message: string, context?: string) => {
    console.warn(`Warning in ${context || 'component'}:`, message);
    toast.warning(message, {
      duration: 3000
    });
  };

  return {
    showError,
    showWarning
  };
};
