'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wallet } from 'lucide-react';

interface AccountErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface AccountErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class AccountErrorBoundary extends React.Component<AccountErrorBoundaryProps, AccountErrorBoundaryState> {
  constructor(props: AccountErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AccountErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Account Error Boundary caught an error:', error, errorInfo);
    
    // Log error details for debugging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    // Store error in localStorage for error tracking
    try {
      const errorHistory = JSON.parse(localStorage.getItem('account-error-history') || '[]');
      errorHistory.push(errorDetails);
      // Keep only last 10 errors
      if (errorHistory.length > 10) {
        errorHistory.shift();
      }
      localStorage.setItem('account-error-history', JSON.stringify(errorHistory));
    } catch (e) {
      console.warn('Failed to store error history:', e);
    }
    
    this.setState({ error, errorInfo });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      // Get user-friendly error message
      const getErrorMessage = () => {
        if (!this.state.error) return 'An unexpected error occurred while loading account data.';
        
        const errorMsg = this.state.error.message.toLowerCase();
        
        if (errorMsg.includes('render') || errorMsg.includes('component')) {
          return 'There was an error rendering the account interface. This might be due to a temporary UI issue.';
        }
        if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          return 'There was a network error while loading account data. Please check your connection.';
        }
        if (errorMsg.includes('timeout')) {
          return 'The request timed out while loading account data. Please try again.';
        }
        
        return 'Something went wrong while loading account data. This might be due to invalid account data or a temporary issue.';
      };

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Account Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {getErrorMessage()}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-mono">Error Details (Development)</summary>
                <pre className="mt-2 whitespace-pre-wrap bg-muted/50 p-2 rounded">
                  {this.state.error.message}
                  {this.state.error.stack && `\n\nStack:\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
            
            <Button onClick={this.reset} size="sm" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Default error fallback component for account operations
export function AccountErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  // Determine user-friendly error message based on error type
  const getErrorMessage = () => {
    if (!error) return 'An unexpected error occurred while processing account data.';
    
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('balance') || errorMsg.includes('number')) {
      return 'There was an error calculating account balances. This might be due to invalid or corrupted balance data.';
    }
    if (errorMsg.includes('currency') || errorMsg.includes('conversion')) {
      return 'There was an error with currency conversion. Please check your account currency settings.';
    }
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return 'There was a network error while loading account data. Please check your connection and try again.';
    }
    if (errorMsg.includes('storage') || errorMsg.includes('database')) {
      return 'There was an error accessing stored account data. Your data might be corrupted.';
    }
    
    return 'There was an error processing account data. This could be due to corrupted account information or invalid calculations.';
  };

  // Get actionable suggestions based on error type
  const getSuggestions = () => {
    if (!error) return ['Refresh the page', 'Check your internet connection'];
    
    const errorMsg = error.message.toLowerCase();
    
    if (errorMsg.includes('balance') || errorMsg.includes('number')) {
      return [
        'Check if any account has invalid balance values',
        'Verify account data integrity',
        'Try removing and re-adding problematic accounts'
      ];
    }
    if (errorMsg.includes('currency') || errorMsg.includes('conversion')) {
      return [
        'Verify account currency settings',
        'Check currency conversion rates',
        'Ensure all accounts have valid currency codes'
      ];
    }
    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
      return [
        'Check your internet connection',
        'Refresh the page',
        'Try again in a few moments'
      ];
    }
    if (errorMsg.includes('storage') || errorMsg.includes('database')) {
      return [
        'Clear browser cache and localStorage',
        'Refresh the page',
        'Contact support if the issue persists'
      ];
    }
    
    return ['Refresh the page', 'Check your internet connection', 'Try again later'];
  };

  const suggestions = getSuggestions();

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Wallet className="h-5 w-5" />
          Account Calculation Error
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {getErrorMessage()}
        </p>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested fixes:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-mono">Error Details (Development)</summary>
            <pre className="mt-2 whitespace-pre-wrap bg-muted/50 p-2 rounded">
              {error.message}
              {error.stack && `\n\nStack:\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <Button onClick={reset} size="sm" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
