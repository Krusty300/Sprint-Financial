'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Activity,
  Trash2,
  RefreshCw,
  FileText,
  Calendar
} from 'lucide-react';
import { settingsErrorValidator, ErrorAnalysis } from '@/utils/settingsErrorValidation';
import { toast } from 'sonner';

interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  recentErrors: ErrorAnalysis[];
  criticalErrors: ErrorAnalysis[];
}

export function ErrorAnalysisDashboard() {
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showClearHistoryDialog, setShowClearHistoryDialog] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    try {
      const stats = settingsErrorValidator.getErrorAnalysis();
      setErrorStats(stats);
    } catch (error) {
      toast.error('Failed to refresh error statistics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const clearErrorHistory = () => {
    setShowClearHistoryDialog(true);
  };

  const confirmClearHistory = () => {
    try {
      settingsErrorValidator.clearErrorHistory();
      refreshStats();
      toast.success('Error history cleared successfully');
      setShowClearHistoryDialog(false);
    } catch (error) {
      toast.error('Failed to clear error history');
    }
  };

  const resolveError = (timestamp: Date) => {
    try {
      const success = settingsErrorValidator.resolveError(timestamp);
      if (success) {
        refreshStats();
        toast.success('Error marked as resolved');
      } else {
        toast.error('Error not found in history');
      }
    } catch (error) {
      toast.error('Failed to resolve error');
    }
  };

  useEffect(() => {
    refreshStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      theme: 'bg-blue-100 text-blue-800',
      currency: 'bg-green-100 text-green-800',
      import: 'bg-purple-100 text-purple-800',
      export: 'bg-orange-100 text-orange-800',
      data: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const filteredErrors = errorStats?.recentErrors.filter(error => 
    selectedCategory === 'all' || error.category === selectedCategory
  ) || [];

  if (!errorStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="mr-2 h-5 w-5" />
            Error Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading error analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Error Analysis Dashboard
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStats}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearErrorHistory}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{errorStats.totalErrors}</div>
                <div className="text-sm text-muted-foreground">Total Errors</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{errorStats.criticalErrors.length}</div>
                <div className="text-sm text-muted-foreground">Critical Errors</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {Object.values(errorStats.errorsByCategory).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-muted-foreground">By Category</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {errorStats.recentErrors.filter(e => e.resolved).length}
                </div>
                <div className="text-sm text-muted-foreground">Resolved</div>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Errors by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="justify-start"
              >
                All ({errorStats.totalErrors})
              </Button>
              {Object.entries(errorStats.errorsByCategory).map(([category, count]) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="justify-start"
                >
                  <span className={`px-2 py-1 rounded text-xs mr-2 ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {/* Recent Errors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Recent Errors 
              {selectedCategory !== 'all' && (
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getCategoryColor(selectedCategory)}`}>
                  {selectedCategory}
                </span>
              )}
            </h3>
            
            {filteredErrors.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No errors found for the selected category.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${error.resolved ? 'bg-muted/30' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(error.error.severity)}
                          <Badge variant={getSeverityBadgeVariant(error.error.severity)}>
                            {error.error.severity}
                          </Badge>
                          <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(error.category)}`}>
                            {error.category}
                          </span>
                          {error.resolved && (
                            <Badge variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        <div>
                          <p className="font-medium">{error.error.message}</p>
                          {error.error.code && (
                            <p className="text-sm text-muted-foreground">Code: {error.error.code}</p>
                          )}
                          {error.context && (
                            <details className="mt-2">
                              <summary className="text-sm text-muted-foreground cursor-pointer">
                                Context
                              </summary>
                              <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                          <div>Field: {error.error.field}</div>
                        </div>
                      </div>
                      
                      {!error.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveError(error.timestamp)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clear History Confirmation Dialog */}
      <AlertDialog open={showClearHistoryDialog} onOpenChange={setShowClearHistoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Error History?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all error logs and analysis data. 
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearHistory}>Clear History</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
