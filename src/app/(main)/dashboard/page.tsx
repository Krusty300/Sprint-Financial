'use client';

import { useEffect, useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { MonthlyTrendChart } from '@/components/dashboard/MonthlyTrendChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetCards } from '@/components/dashboard/BudgetCards';
import { BudgetAlerts } from '@/components/dashboard/BudgetAlerts';
import { SpendingHeatmap } from '@/components/dashboard/SpendingHeatmap';
import { BudgetProgressIndicator } from '@/components/dashboard/BudgetProgressIndicator';
import { AdvancedGridLayout } from '@/components/dashboard/AdvancedGridLayout';
import { createDashboardWidgets } from '@/components/dashboard/DashboardWidgetConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { seedSampleData } from '@/lib/seedData';
import { verifyDataPersistence, verifyLocalStorage } from '@/lib/dataVerification';
import { DashboardErrorBoundary, DashboardErrorFallback } from '@/components/error/DashboardErrorBoundary';
import { DashboardLayoutManager } from '@/components/dashboard/DashboardLayoutManager';
import { Button } from '@/components/ui/button';
import { Settings, LayoutGrid, Activity, Filter, Download, Eye } from 'lucide-react';
import { useRealtimeDashboard, useMockRealtimeDashboard } from '@/hooks/useRealtimeDashboard';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { InteractiveChart } from '@/components/dashboard/InteractiveChart';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { WidgetSkeleton } from '@/components/dashboard/WidgetSkeleton';
import { LoadingProgress } from '@/components/dashboard/LoadingProgress';
import { DashboardNotes } from '@/components/dashboard/DashboardNotes';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { FinancialHealthScoreCard } from '@/components/dashboard/FinancialHealthScore';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RefreshControls } from '@/components/dashboard/RefreshControls';
import { widgetPersistenceService } from '@/services/widgetPersistence';

export default function DashboardPage() {
  const { stats, loading, refreshStats } = useDashboardStats();
  const [useInteractiveLayout, setUseInteractiveLayout] = useState(false);
  const [useAdvancedGrid, setUseAdvancedGrid] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    financialOverview: true,
    spendingChart: true,
    monthlyTrends: true,
    recentTransactions: true,
    budgetAlerts: true,
    budgetCards: true,
    spendingHeatmap: true,
    budgetProgress: true,
    dashboardNotes: true,
    financialHealthScore: true,
    quickActions: true,
  });
  
  // Load layout preference from localStorage
  useEffect(() => {
    try {
      const savedLayout = localStorage.getItem('dashboard-layout-preference');
      if (savedLayout === 'interactive') {
        setUseInteractiveLayout(true);
      } else if (savedLayout === 'advanced') {
        setUseAdvancedGrid(true);
      }
      
      const savedWidgets = localStorage.getItem('dashboard-visible-widgets');
      if (savedWidgets) {
        try {
          const parsed = JSON.parse(savedWidgets);
          setVisibleWidgets(prev => ({
            ...prev,
            ...parsed,
            // Ensure new properties have default values
            financialHealthScore: parsed.financialHealthScore ?? true,
            quickActions: parsed.quickActions ?? true
          }));
        } catch (error) {
          console.warn('Failed to load widget visibility:', error);
        }
      }

      // Load widget layout from persistence service
      try {
        const savedLayoutData = widgetPersistenceService.loadLayout();
        if (savedLayoutData) {
          setUseInteractiveLayout(savedLayoutData.layoutMode === 'interactive');
          setUseAdvancedGrid(savedLayoutData.layoutMode === 'advanced');
        }
      } catch (error) {
        console.warn('Failed to load widget layout from persistence service:', error);
      }

      // Check if first visit
      const hasVisited = localStorage.getItem('dashboard-has-visited');
      if (!hasVisited) {
        setIsFirstVisit(true);
        localStorage.setItem('dashboard-has-visited', 'true');
      }
    } catch (error) {
      console.error('Failed to load dashboard preferences:', error);
    }
  }, []);

  // Save widget visibility changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboard-visible-widgets', JSON.stringify(visibleWidgets));
      
      // Also save to widget persistence service
      const currentLayout = widgetPersistenceService.loadLayout();
      if (currentLayout) {
        widgetPersistenceService.saveLayout({
          ...currentLayout,
          widgets: currentLayout.widgets.map(widget => ({
            ...widget,
            visible: visibleWidgets[widget.id as keyof typeof visibleWidgets] ?? true
          }))
        });
      }
    } catch (error) {
      console.error('Failed to save widget visibility:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleWidgets]);

  // Save layout mode changes
  useEffect(() => {
    try {
      const layoutMode = useAdvancedGrid ? 'advanced' : useInteractiveLayout ? 'interactive' : 'default';
      localStorage.setItem('dashboard-layout-preference', layoutMode);
      widgetPersistenceService.saveLayoutMode(layoutMode);
    } catch (error) {
      console.error('Failed to save layout mode:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useInteractiveLayout, useAdvancedGrid]);
  
  // Simulate loading progress
  useEffect(() => {
    if (loading) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [loading]);

  const handleExportData = () => {
    if (!stats) return;
    
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        totalBalance: stats.totalBalance,
        monthlyIncome: stats.monthlyIncome,
        monthlyExpenses: stats.monthlyExpenses,
        netWorth: stats.netWorth,
        categoryBreakdown: stats.categoryBreakdown,
        monthlyTrend: stats.monthlyTrend,
        budgetBreakdown: stats.budgetBreakdown,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export dashboard data:', error);
    }
  };
  
  // Handle layout toggle with visual feedback
  const handleLayoutToggle = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      // Cycle through: classic -> interactive -> advanced -> classic
      if (!useInteractiveLayout && !useAdvancedGrid) {
        setUseInteractiveLayout(true);
      } else if (useInteractiveLayout && !useAdvancedGrid) {
        setUseInteractiveLayout(false);
        setUseAdvancedGrid(true);
      } else {
        setUseAdvancedGrid(false);
      }
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };
  
  // Initialize real-time updates (use mock for development)
  const realtime = process.env.NODE_ENV === 'development' 
    ? useMockRealtimeDashboard() 
    : useRealtimeDashboard();
  
  // Initialize advanced filters
  const { 
    filters, 
    filteredData, 
    filterStats, 
    savedFilters, 
    quickFilters,
    updateFilter,
    resetFilters,
    saveFilter,
    loadFilter,
    deleteFilter
  } = useAdvancedFilters(stats?.recentTransactions ?? []);

  // Show dashboard with default values even if stats is null
  const displayStats = stats || {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netWorth: 0,
    recentTransactions: [],
    categoryBreakdown: [],
    monthlyTrend: [],
    budgetBreakdown: [],
    totalBudget: 0,
    totalSpent: 0,
    budgetHealth: 'healthy' as const,
    transactionCount: 0,
    accountCount: 0,
    budgetCount: 0,
    lowBalanceAccounts: 0,
    overdueTransactions: 0,
    activeGoals: 0,
    hasReports: false,
  };

  // Define dashboard widgets
  const dashboardWidgets = [
    {
      id: 'financial-overview',
      title: 'Financial Overview',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <DashboardCards
            totalBalance={displayStats.totalBalance}
            monthlyIncome={displayStats.monthlyIncome}
            monthlyExpenses={displayStats.monthlyExpenses}
            netWorth={displayStats.netWorth}
            monthlyTrend={displayStats.monthlyTrend}
          />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 0, y: 0 },
      defaultSize: { width: 800, height: 200 },
      minSize: { width: 400, height: 150 },
      maxSize: { width: 1200, height: 300 }
    },
    {
      id: 'spending-chart',
      title: 'Spending Analysis',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <InteractiveChart
            data={displayStats.categoryBreakdown?.map(cat => ({
              name: cat.category,
              value: cat.amount,
              details: { percentage: cat.percentage }
            })) ?? []}
            type="bar"
            title="Spending by Category"
            onDrillDown={(data) => console.log('Drill down to:', data)}
            showDrillDown={true}
          />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 0, y: 220 },
      defaultSize: { width: 400, height: 300 },
      minSize: { width: 300, height: 200 },
      maxSize: { width: 600, height: 400 }
    },
    {
      id: 'monthly-trends',
      title: 'Monthly Trends',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <MonthlyTrendChart data={displayStats.monthlyTrend} />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 420, y: 220 },
      defaultSize: { width: 380, height: 300 },
      minSize: { width: 300, height: 200 },
      maxSize: { width: 600, height: 400 }
    },
    {
      id: 'recent-transactions',
      title: 'Recent Transactions',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <RecentTransactions transactions={displayStats.recentTransactions} />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 820, y: 220 },
      defaultSize: { width: 400, height: 300 },
      minSize: { width: 300, height: 200 },
      maxSize: { width: 600, height: 400 }
    },
    {
      id: 'budget-alerts',
      title: 'Budget Alerts',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <BudgetAlerts stats={displayStats} />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 0, y: 540 },
      defaultSize: { width: 400, height: 200 },
      minSize: { width: 300, height: 150 },
      maxSize: { width: 600, height: 300 },
      isResizable: false
    },
    {
      id: 'budget-cards',
      title: 'Budget Overview',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <BudgetCards stats={displayStats} />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 420, y: 540 },
      defaultSize: { width: 380, height: 200 },
      minSize: { width: 300, height: 150 },
      maxSize: { width: 600, height: 300 }
    },
    {
      id: 'financial-health-score',
      title: 'Financial Health Score',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <FinancialHealthScoreCard stats={displayStats} />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 0, y: 750 },
      defaultSize: { width: 400, height: 350 },
      minSize: { width: 300, height: 300 },
      maxSize: { width: 600, height: 450 }
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      component: (
        <DashboardErrorBoundary fallback={DashboardErrorFallback}>
          <QuickActions />
        </DashboardErrorBoundary>
      ),
      defaultPosition: { x: 420, y: 750 },
      defaultSize: { width: 380, height: 300 },
      minSize: { width: 300, height: 250 },
      maxSize: { width: 600, height: 400 }
    }
  ];

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Initialize sample data if needed
        seedSampleData();
        
        // Verify data persistence (development only)
        if (process.env.NODE_ENV === 'development') {
          setTimeout(() => {
            try {
              verifyLocalStorage();
              verifyDataPersistence();
            } catch (error) {
              console.error('Data verification failed:', error);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error);
      }
    };

    initializeData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sprint Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your financial health
            </p>
          </div>
        </div>
        
        {/* Loading Progress */}
        <LoadingProgress 
          progress={loadingProgress} 
          message="Loading your financial data..."
          className="mb-6"
        />
        
        {/* Dashboard Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {[...Array(4)].map((_, i) => (
            <WidgetSkeleton key={i} type="card" className="min-h-[160px] hover:shadow-lg transition-all duration-200 rounded-lg" />
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <WidgetSkeleton type="chart" />
          <WidgetSkeleton type="chart" />
        </div>

        {/* Recent Transactions Skeleton */}
        <WidgetSkeleton type="list" />

        {/* Budget Section Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <WidgetSkeleton type="card" />
          <WidgetSkeleton type="card" />
        </div>

        {/* Spending Heatmap Skeleton */}
        <WidgetSkeleton type="heatmap" />

        {/* Budget Progress Skeleton */}
        <WidgetSkeleton type="progress" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 data-onboarding="dashboard-title" className="text-xl sm:text-2xl md:text-3xl font-bold">Sprint Dashboard</h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Overview of your financial health
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
          {/* Real-time Status */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <Badge variant={realtime.isConnected ? "default" : "secondary"}>
              {realtime.isConnected ? "Live" : "Offline"}
            </Badge>
            {realtime.pendingUpdates.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {realtime.pendingUpdates.length} updates
              </Badge>
            )}
          </div>

          {/* Filter Status */}
          {filterStats.isActive && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Badge variant="outline">
                {filterStats.filtered}/{filterStats.total} items
              </Badge>
            </div>
          )}

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="flex items-center gap-1 sm:gap-2 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all duration-200 text-xs sm:text-sm"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Exp</span>
          </Button>

          {/* Refresh Controls */}
          <RefreshControls onRefresh={refreshStats} />

          {/* Widget Visibility Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setVisibleWidgets(prev => ({
                financialOverview: !prev.financialOverview,
                spendingChart: !prev.spendingChart,
                monthlyTrends: !prev.monthlyTrends,
                recentTransactions: !prev.recentTransactions,
                budgetAlerts: !prev.budgetAlerts,
                budgetCards: !prev.budgetCards,
                spendingHeatmap: !prev.spendingHeatmap,
                budgetProgress: !prev.budgetProgress,
                dashboardNotes: !prev.dashboardNotes,
                financialHealthScore: !prev.financialHealthScore,
                quickActions: !prev.quickActions,
              }));
            }}
            className="flex items-center gap-1 sm:gap-2 hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all duration-200 text-xs sm:text-sm"
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Toggle Widgets</span>
            <span className="sm:hidden">Widgets</span>
          </Button>

          {/* Favorite Button */}
          <FavoriteButton size="sm" variant="outline" showLabel={false} />

          {/* Layout Toggle Button */}
          <Button
            variant={useAdvancedGrid ? "default" : useInteractiveLayout ? "secondary" : "outline"}
            onClick={handleLayoutToggle}
            disabled={isTransitioning}
            className={cn(
              "flex items-center gap-1 sm:gap-2 transition-all duration-300 active:scale-95 text-xs sm:text-sm",
              isTransitioning && "opacity-50 cursor-not-allowed",
              !isTransitioning && "hover:shadow-md"
            )}
          >
            {useAdvancedGrid ? <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" /> : useInteractiveLayout ? <Settings className="h-3 w-3 sm:h-4 sm:w-4" /> : <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />}
            <span className="hidden sm:inline">{useAdvancedGrid ? "Switch to Classic" : useInteractiveLayout ? "Switch to Advanced Grid" : "Switch to Interactive Layout"}</span>
            <span className="sm:hidden">{useAdvancedGrid ? "Classic" : useInteractiveLayout ? "Advanced" : "Interactive"}</span>
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      {!useInteractiveLayout && !useAdvancedGrid && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">Quick Filters:</span>
          <div className={cn(
            "flex flex-wrap items-center gap-1 sm:gap-2 transition-all duration-300",
            showAllFilters ? "" : "max-h-10 overflow-hidden"
          )}>
            {quickFilters.slice(0, showAllFilters ? quickFilters.length : 4).map(filter => (
              <Button
                key={filter.id}
                variant="outline"
                size="sm"
                onClick={() => loadFilter(filter.id)}
                className="text-xs hover:bg-primary/10 hover:border-primary/30 active:scale-95 transition-all duration-200"
              >
                {filter.name}
              </Button>
            ))}
            {quickFilters.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllFilters(!showAllFilters)}
                className="text-xs hover:bg-muted active:scale-95 transition-all duration-200"
              >
                {showAllFilters ? 'Show Less' : `Show More (${quickFilters.length - 4})`}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-xs hover:bg-muted active:scale-95 transition-all duration-200"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Conditional Rendering */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isTransitioning && "opacity-0 scale-95"
      )}>
        {isFirstVisit && (
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmptyState 
              type="welcome"
              onAction={() => setIsFirstVisit(false)}
            />
          </div>
        )}
        {useAdvancedGrid ? (
          <AdvancedGridLayout 
            widgets={createDashboardWidgets(displayStats)}
            onLayoutChange={(layout) => console.log('Advanced grid layout changed:', layout)}
            defaultMode="bento"
            columns={12}
            gap={4}
          />
        ) : useInteractiveLayout ? (
          <DashboardLayoutManager 
            widgets={dashboardWidgets}
            onLayoutChange={(layout) => console.log('Dashboard layout changed:', layout)}
          />
        ) : (
          <>
            <div className="space-y-6">
              {/* KPI Cards */}
              {visibleWidgets.financialOverview && (
                <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                  <div data-onboarding="dashboard-cards">
                    <DashboardCards
                      totalBalance={displayStats.totalBalance}
                      monthlyIncome={displayStats.monthlyIncome}
                      monthlyExpenses={displayStats.monthlyExpenses}
                      netWorth={displayStats.netWorth}
                      monthlyTrend={displayStats.monthlyTrend}
                    />
                  </div>
                </DashboardErrorBoundary>
              )}

              {/* Charts Row */}
              {(visibleWidgets.spendingChart || visibleWidgets.monthlyTrends) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-6">
                  {visibleWidgets.spendingChart && (
                    <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                      <SpendingChart data={displayStats.categoryBreakdown || []} />
                    </DashboardErrorBoundary>
                  )}
                  {visibleWidgets.monthlyTrends && (
                    <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                      <MonthlyTrendChart data={displayStats.monthlyTrend || []} />
                    </DashboardErrorBoundary>
                  )}
                </div>
              )}

              {/* Recent Transactions */}
              {visibleWidgets.recentTransactions && (
                <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                  {displayStats.recentTransactions && displayStats.recentTransactions.length > 0 ? (
                    <RecentTransactions transactions={displayStats.recentTransactions} />
                  ) : (
                    <EmptyState type="no-transactions" />
                  )}
                </DashboardErrorBoundary>
              )}

              {/* Budget Tracking Section */}
              {visibleWidgets.budgetAlerts || visibleWidgets.budgetCards ? (
                displayStats.budgetBreakdown && displayStats.budgetBreakdown.length > 0 ? (
                  <div className="space-y-6">
                    {visibleWidgets.budgetAlerts && (
                      <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                        <BudgetAlerts stats={displayStats} />
                      </DashboardErrorBoundary>
                    )}
                    {visibleWidgets.budgetCards && (
                      <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                        <BudgetCards stats={displayStats} />
                      </DashboardErrorBoundary>
                    )}
                  </div>
                ) : (
                  <EmptyState type="no-budgets" />
                )
              ) : null}

              {/* Spending Heatmap */}
              {visibleWidgets.spendingHeatmap && (
                <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                  <SpendingHeatmap transactions={displayStats.recentTransactions ?? []} months={3} />
                </DashboardErrorBoundary>
              )}

              {/* Budget Progress Indicators */}
              {visibleWidgets.budgetProgress && displayStats.budgetBreakdown && displayStats.budgetBreakdown.length > 0 && (
                <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg">Budget Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                        {displayStats.budgetBreakdown.slice(0, 6).map((budget) => (
                          <BudgetProgressIndicator
                            key={budget.category}
                            spent={budget.spent}
                            budget={budget.budget}
                            categoryName={budget.category}
                            compact={true}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </DashboardErrorBoundary>
              )}

              {/* Dashboard Notes */}
              {visibleWidgets.dashboardNotes && (
                <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                  <DashboardNotes 
                    transactions={displayStats.recentTransactions ?? []}
                    budgets={displayStats.budgetBreakdown?.map(b => ({
                      id: b.category,
                      category: b.category,
                      budget: b.budget,
                      spent: b.spent
                    })) ?? []}
                    goals={[]}
                  />
                </DashboardErrorBoundary>
              )}

              {/* New widgets row for better mobile layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {visibleWidgets.financialHealthScore && (
                  <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                    <FinancialHealthScoreCard stats={displayStats} />
                  </DashboardErrorBoundary>
                )}
                {visibleWidgets.quickActions && (
                  <DashboardErrorBoundary fallback={DashboardErrorFallback}>
                    <QuickActions />
                  </DashboardErrorBoundary>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
