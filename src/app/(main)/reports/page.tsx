'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useTransactions } from '@/hooks/useTransactions';
import { useRealtime } from '@/hooks/useRealtime';
import { useReportExport } from '@/hooks/useReportExport';
import { useGoalActions } from '@/hooks/useGoalActions';
import { useExportDialog } from '@/hooks/useExportDialog';
import { useGoals } from '@/hooks/useGoals';
import { MonthlyTrendsReport } from '@/components/reports/MonthlyTrendsReport';
import { CategoryBreakdownReport } from '@/components/reports/CategoryBreakdownReport';
import { FinancialSummaryReport } from '@/components/reports/FinancialSummaryReport';
import { EnhancedPieChart } from '@/components/charts/EnhancedPieChart';
import { ComparisonChart } from '@/components/charts/ComparisonChart';
import { CashFlowChart } from '@/components/charts/CashFlowChart';
import { SpendingHeatMap } from '@/components/charts/SpendingHeatMap';
import { GoalProgressChart } from '@/components/charts/GoalProgressChart';
import { ReportErrorBoundary, ReportErrorFallback } from '@/components/error/ReportErrorBoundary';
import { GoalDialog } from '@/components/dialogs/GoalDialog';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { 
  FileDown, 
  FileText, 
  Table, 
  Database, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Target, 
  RefreshCw,
  Download,
  MoreVertical,
  Plus,
  BookOpen,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const { stats, loading, refreshStats } = useDashboardStats();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const { goals } = useGoals();
  const { subscribe } = useRealtime();
  
  // Use custom hooks for state management
  const goalActions = useGoalActions();
  const exportDialog = useExportDialog();
  
  const { isExporting, exportProgress, exportReport, quickExport } = useReportExport();
  
  // Local state for refresh, initial load, and active tab
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshStats();
      toast.success('Reports refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh reports');
      console.error('Error refreshing reports:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = async () => {
    await exportReport(stats, exportDialog.exportFormat, {
      includeCharts: exportDialog.includeCharts,
      sections: exportDialog.selectedSections as any
    });
    exportDialog.closeExportDialog();
  };

  const handleQuickExport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    await quickExport(stats, format);
  };

  // Handle initial loading state to prevent flash
  useEffect(() => {
    if (!loading && !transactionsLoading && stats && transactions) {
      // Data is loaded, set initial load to false after a small delay
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, transactionsLoading, stats, transactions]);
  
  // Compute recommendation conditions for better readability
  const savingsRate = stats && stats.monthlyIncome > 0 
    ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) 
    : 0;
  
  const shouldReduceExpenses = stats && stats.monthlyExpenses > stats.monthlyIncome;
  const shouldIncreaseSavings = savingsRate < 10 && stats && stats.monthlyIncome > 0;
  const shouldDiversifySpending = stats && stats.categoryBreakdown.length > 0 && stats.categoryBreakdown[0].percentage > 40;
  const shouldBuildEmergencyFund = stats && stats.netWorth < 0;
  const shouldInvestForGrowth = stats && stats.monthlyIncome > 0 && stats.monthlyExpenses < stats.monthlyIncome && savingsRate >= 20;
  const hasExcellentFinancialHealth = stats && stats.monthlyIncome > 0 && stats.monthlyExpenses < stats.monthlyIncome && savingsRate >= 20 && stats.netWorth >= 0;

  // Listen for real-time events that should refresh reports
  useEffect(() => {
    console.log('Reports: Setting up real-time event listeners');
    
    const unsubscribers = [
      subscribe('transaction', (event) => {
        console.log('Reports: Transaction event received', event);
        // Refresh reports when transactions change
        const timer = setTimeout(() => {
          refreshStats();
        }, 200); // Small delay to ensure data is updated
        return () => clearTimeout(timer);
      }),
      
      subscribe('budget', (event) => {
        console.log('Reports: Budget event received', event);
        // Refresh reports when budgets change
        const timer = setTimeout(() => {
          refreshStats();
        }, 200);
        return () => clearTimeout(timer);
      }),
      
      subscribe('account', (event) => {
        console.log('Reports: Account event received', event);
        // Refresh reports when accounts change
        const timer = setTimeout(() => {
          refreshStats();
        }, 200);
        return () => clearTimeout(timer);
      }),
      
      subscribe('category', (event) => {
        console.log('Reports: Category event received', event);
        // Refresh reports when categories change
        const timer = setTimeout(() => {
          refreshStats();
        }, 200);
        return () => clearTimeout(timer);
      })
    ];

    return () => {
      console.log('Reports: Cleaning up real-time event listeners');
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [subscribe, refreshStats]);

  if (loading || isInitialLoad) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Detailed insights into your financial patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton size="sm" variant="outline" showLabel={false} />
            <Button disabled size="sm">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Refreshing...</span>
            </Button>
          </div>
        </div>

        {/* Enhanced loading skeleton with progress indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Progress value={33} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">Loading financial data...</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6">
          {/* Summary cards skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="rounded-lg">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart skeletons with mobile responsiveness */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="rounded-lg">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48 sm:h-64 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-lg">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 sm:h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats && !loading && !isInitialLoad) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Detailed insights into your financial patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FavoriteButton size="sm" variant="outline" showLabel={false} />
            <Button onClick={handleRefresh} size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Enhanced empty state with CTAs and educational content */}
        <Card className="text-center py-8 sm:py-12 rounded-lg">
          <CardContent className="space-y-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-semibold">No financial data available</h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                Start tracking your finances by adding transactions, accounts, and budgets to generate comprehensive reports.
              </p>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = '/transactions'} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
              <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
            
            {/* Educational content */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium mb-1">Getting Started with Reports</h4>
                  <p className="text-sm text-muted-foreground">
                    Once you add transactions, you'll see:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Financial health score and key metrics</li>
                    <li>Spending patterns and category breakdowns</li>
                    <li>Monthly trends and cash flow analysis</li>
                    <li>Personalized insights and recommendations</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render main content when we have valid data
  if (!stats || loading || isInitialLoad) {
    return null; // This will be handled by the loading/no data states above
  }

  // At this point, stats is guaranteed to be non-null

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with mobile responsiveness */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Detailed insights into your financial patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton size="sm" variant="outline" showLabel={false} />
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            size="sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          {/* Mobile export menu button */}
          <div className="relative md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={exportDialog.toggleMobileExportMenu}
            >
              <Download className="h-4 w-4" />
            </Button>
            {exportDialog.showMobileExportMenu && (
              <div className="absolute right-0 top-full mt-2 bg-background border rounded-lg shadow-lg p-2 z-50 min-w-[150px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleQuickExport('pdf');
                  }}
                  className="w-full justify-start"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleQuickExport('excel');
                  }}
                  className="w-full justify-start"
                >
                  <Table className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleQuickExport('csv');
                  }}
                  className="w-full justify-start"
                >
                  <Database className="mr-2 h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleQuickExport('json');
                  }}
                  className="w-full justify-start"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  JSON
                </Button>
                <div className="border-t my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    exportDialog.openExportDialog();
                  }}
                  className="w-full justify-start"
                >
                  <MoreVertical className="mr-2 h-4 w-4" />
                  Advanced
                </Button>
              </div>
            )}
          </div>
          
          {/* Desktop Quick Export Buttons */}
          <div className="hidden md:flex gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('pdf')}
              title="Export as PDF"
              disabled={isExporting}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('excel')}
              title="Export as Excel"
              disabled={isExporting}
            >
              <Table className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('csv')}
              title="Export as CSV"
              disabled={isExporting}
            >
              <Database className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleQuickExport('json')}
              title="Export as JSON"
              disabled={isExporting}
            >
              <FileDown className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={exportDialog.openExportDialog} 
            size="sm"
            className="hidden sm:flex"
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Advanced Export</span>
          </Button>
        </div>
      </div>
      
      {/* Export progress indicator */}
      {isExporting && (
        <Card className="border-primary/50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Exporting report...</span>
                </div>
                <span className="text-sm text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs 
        defaultValue="summary" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-6"
      >
        {/* Mobile-responsive tab navigation */}
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
          <TabsTrigger value="summary" className="flex items-center gap-1 sm:gap-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Summary</span>
            <span className="sm:hidden">Sum</span>
          </TabsTrigger>
          <TabsTrigger value="visualizations" className="flex items-center gap-1 sm:gap-2">
            <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Visualizations</span>
            <span className="sm:hidden">Vis</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1 sm:gap-2">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Trends</span>
            <span className="sm:hidden">Trd</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-1 sm:gap-2">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cat</span>
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-1 sm:gap-2">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Patterns</span>
            <span className="sm:hidden">Pat</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1 sm:gap-2">
            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Insights</span>
            <span className="sm:hidden">Ins</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-6">
          <FinancialSummaryReport stats={stats} />
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6">
            <div className="min-h-[300px] sm:min-h-[400px]">
              <CategoryBreakdownReport categoryBreakdown={stats.categoryBreakdown} />
            </div>
            <div className="min-h-[300px] sm:min-h-[400px]">
              <MonthlyTrendsReport monthlyTrend={stats.monthlyTrend} />
            </div>
            <div className="min-h-[300px] sm:min-h-[400px]">
              <CashFlowChart 
                income={stats.monthlyIncome}
                expenses={stats.monthlyExpenses}
                categories={stats.categoryBreakdown
                  .filter(cat => cat.amount !== 0)
                  .map(cat => ({
                    category: cat.category,
                    amount: Math.abs(cat.amount),
                    type: cat.amount > 0 ? 'income' : 'expense' as const
                  }))}
                title="Cash Flow Analysis"
                showDetails={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid gap-6">
            <CategoryBreakdownReport categoryBreakdown={stats.categoryBreakdown} />
            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                    stats.categoryBreakdown.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{category.category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category.percentage}% of total expenses
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(category.amount)}</div>
                          <div className="text-sm text-muted-foreground">{category.percentage}%</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No category data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6">
            <div className="min-h-[300px] sm:min-h-[400px]">
              <SpendingHeatMap 
                data={transactions.map((t: any) => ({
                  amount: Math.abs(t.amount),
                  date: t.date,
                  category: t.category,
                  dayOfWeek: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
                  week: Math.ceil(new Date(t.date).getDate() / 7),
                  month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' })
                }))}
                title="Spending Patterns Heat Map"
                period="month"
              />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Spending Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Average Daily Spending</h4>
                      <p className="text-2xl font-bold">
                        {stats.monthlyExpenses > 0 ? formatCurrency(stats.monthlyExpenses / 30) : formatCurrency(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Per day this month</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Highest Spending Day</h4>
                      <p className="text-2xl font-bold">
                        {transactions.length > 0 ? formatCurrency(Math.max(...transactions.filter(t => t && t.type === 'expense' && typeof t.amount === 'number' && !isNaN(t.amount)).map((t: any) => Math.abs(t.amount)))) : formatCurrency(0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Single expense transaction</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6">
            <div className="min-h-[300px] sm:min-h-[400px]">
              <ComparisonChart 
                data={stats.monthlyTrend}
                title="Monthly Trends Analysis"
              />
            </div>
            <div className="min-h-[300px] sm:min-h-[400px]">
              <SpendingHeatMap 
                data={transactions.map((t: any) => ({
                  amount: Math.abs(t.amount),
                  date: t.date,
                  category: t.category,
                  dayOfWeek: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
                  week: Math.ceil(new Date(t.date).getDate() / 7),
                  month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' })
                }))}
                title="Spending Patterns Heat Map"
                period="month"
              />
            </div>
            <div className="min-h-[300px] sm:min-h-[400px]">
              <GoalProgressChart 
                goals={goals}
                title="Financial Goals Progress"
                showAddGoal={true}
                onGoalAction={goalActions.handleGoalAction}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6">
            {/* Financial Health Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Spending Pattern</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.monthlyExpenses > stats.monthlyIncome ? 
                        'Your expenses exceed your income. Consider reducing spending or increasing income.' :
                        stats.monthlyExpenses > stats.monthlyIncome * 0.8 ?
                          'Your expenses are close to your income. Build an emergency fund.' :
                          'You have a healthy expense ratio. Keep up the good work!'
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Savings Rate</h4>
                    <p className="text-sm text-muted-foreground">
                      {((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100).toFixed(1)}% of your income is saved. 
                      {(() => {
                        const savingsRate = stats.monthlyIncome > 0 ? 
                          ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome * 100) : 0;
                        
                        return savingsRate >= 20 ?
                          "Excellent! You're saving more than the recommended 20%." :
                          savingsRate >= 10 ?
                            "Good! Try to aim for 20% savings rate." :
                            "Consider increasing your savings rate for better financial health.";
                      })()}
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Top Expense Category</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.categoryBreakdown[0] ? 
                        `${stats.categoryBreakdown[0].category} accounts for ${stats.categoryBreakdown[0].percentage}% of your expenses. ` +
                        (stats.categoryBreakdown[0].percentage > 30 ? 
                          'This is a significant portion. Review if there are opportunities to optimize.' :
                          'This seems reasonable for your budget.')
                        : 'No expense data available.'
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Net Worth Trend</h4>
                    <p className="text-sm text-muted-foreground">
                      {stats.netWorth >= 0 ?
                        `Your net worth is ${formatCurrency(stats.netWorth)}. ` +
                        (stats.netWorth > 10000 ? 
                          'Great! You have a solid financial foundation.' :
                          'Keep building your net worth through consistent saving.')
                        : `Your net worth is ${formatCurrency(stats.netWorth)}. ` +
                          'Focus on reducing debt and building assets.'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shouldReduceExpenses && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-destructive/20 text-destructive' : 'bg-destructive/10 text-destructive'
                    }`}>
                      <Target className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-destructive">Reduce Expenses</h4>
                        <p className="text-sm text-muted-foreground">
                          Your expenses exceed income by {formatCurrency(stats.monthlyExpenses - stats.monthlyIncome)}. 
                          Create a budget to track and reduce unnecessary spending.
                        </p>
                      </div>
                    </div>
                  )}

                  {shouldIncreaseSavings && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-warning/20 text-warning' : 'bg-warning/10 text-warning'
                    }`}>
                      <Target className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-warning">Increase Savings</h4>
                        <p className="text-sm text-muted-foreground">
                          Your savings rate is below the recommended 20%. 
                          Try to save at least {formatCurrency(Math.max(0, stats.monthlyIncome * 0.2 - (stats.monthlyIncome - stats.monthlyExpenses)))} more per month.
                        </p>
                      </div>
                    </div>
                  )}

                  {shouldDiversifySpending && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
                    }`}>
                      <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-primary">Diversify Spending</h4>
                        <p className="text-sm text-muted-foreground">
                          {stats.categoryBreakdown[0].category} represents {stats.categoryBreakdown[0].percentage}% of expenses. 
                          Consider diversifying your spending categories.
                        </p>
                      </div>
                    </div>
                  )}

                  {shouldBuildEmergencyFund && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-warning/20 text-warning' : 'bg-warning/10 text-warning'
                    }`}>
                      <Target className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-warning">Build Emergency Fund</h4>
                        <p className="text-sm text-muted-foreground">
                          Focus on building an emergency fund of 3-6 months of expenses. 
                          Start with small, consistent savings.
                        </p>
                      </div>
                    </div>
                  )}

                  {shouldInvestForGrowth && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-success/20 text-success' : 'bg-success/10 text-success'
                    }`}>
                      <Target className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-success">Invest for Growth</h4>
                        <p className="text-sm text-muted-foreground">
                          With a healthy savings rate, consider investing for long-term growth. 
                          Explore investment options that match your risk tolerance.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show positive reinforcement when no issues */}
                  {hasExcellentFinancialHealth && (
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${
                      resolvedTheme === 'dark' ? 'bg-success/20 text-success' : 'bg-success/10 text-success'
                    }`}>
                      <Target className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="font-medium text-success">Excellent Financial Health</h4>
                        <p className="text-sm text-muted-foreground">
                          You're doing great! Keep maintaining your healthy savings rate and continue building your net worth.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advanced Export Dialog - Mobile responsive */}
      {exportDialog.showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Advanced Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <Select value={exportDialog.exportFormat} onValueChange={(value: any) => exportDialog.setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>PDF Report</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        <span>Excel Spreadsheet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        <span>CSV Data</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileDown className="h-4 w-4" />
                        <span>JSON Data</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Include Sections</label>
                <div className="space-y-2">
                  {['summary', 'categories', 'trends'].map((section) => (
                    <div key={section} className="flex items-center space-x-2">
                      <Checkbox 
                        id={section}
                        checked={exportDialog.selectedSections.includes(section)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            exportDialog.setSelectedSections([...exportDialog.selectedSections, section]);
                          } else {
                            exportDialog.setSelectedSections(exportDialog.selectedSections.filter((s: string) => s !== section));
                          }
                        }}
                      />
                      <label htmlFor={section} className="text-sm capitalize">
                        {section} {section === 'summary' ? '(Overview)' : section === 'categories' ? '(Spending by Category)' : '(Monthly Analysis)'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCharts"
                  checked={exportDialog.includeCharts}
                  onCheckedChange={(checked) => exportDialog.setIncludeCharts(checked === true)}
                />
                <label htmlFor="includeCharts" className="text-sm">
                  Include charts and visualizations (PDF only)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={exportDialog.closeExportDialog}
                  className="flex-1"
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleExportReport}
                  className="flex-1"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goal Dialog */}
      <GoalDialog
        open={goalActions.showGoalDialog}
        onOpenChange={goalActions.closeGoalDialog}
        goal={goalActions.editingGoal}
        onSave={goalActions.handleSaveGoal}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={goalActions.showDeleteDialog}
        onOpenChange={goalActions.closeDeleteDialog}
        onConfirm={goalActions.handleDeleteGoal}
        title="Delete Financial Goal"
        description="Are you sure you want to delete this financial goal? This action cannot be undone."
        itemName={goalActions.goalToDelete?.name}
        itemDetails={goalActions.goalToDelete ? 
          `Target: ${formatCurrency(goalActions.goalToDelete.targetAmount)} | Progress: ${formatCurrency(goalActions.goalToDelete.currentAmount)}` 
          : undefined
        }
      />
    </div>
  );
}
