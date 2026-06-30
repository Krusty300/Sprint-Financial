import { WidgetConfig } from './WidgetConfig';
import { DashboardCards } from './DashboardCards';
import { SpendingChart } from './SpendingChart';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { RecentTransactions } from './RecentTransactions';
import { BudgetCards } from './BudgetCards';
import { BudgetAlerts } from './BudgetAlerts';
import { SpendingHeatmap } from './SpendingHeatmap';
import { BudgetProgressIndicator } from './BudgetProgressIndicator';
import { DashboardNotes } from './DashboardNotes';
import { Card, CardContent } from '@/components/ui/card';

export const createDashboardWidgets = (stats: any): WidgetConfig[] => [
  {
    id: 'financial-overview',
    title: 'Financial Overview',
    component: <DashboardCards
      totalBalance={stats?.totalBalance ?? 0}
      monthlyIncome={stats?.monthlyIncome ?? 0}
      monthlyExpenses={stats?.monthlyExpenses ?? 0}
      netWorth={stats?.netWorth ?? 0}
      monthlyTrend={stats?.monthlyTrend ?? []}
    />,
    defaultSize: { width: 12, height: 2, minWidth: 6, maxWidth: 12, minHeight: 2, maxHeight: 3 },
    defaultPosition: { x: 0, y: 0 },
    minSize: { width: 6, height: 2 },
    maxSize: { width: 12, height: 3 },
    isResizable: true,
    isDraggable: true,
    category: 'financial',
  },
  {
    id: 'spending-chart',
    title: 'Spending Analysis',
    component: <SpendingChart data={stats?.categoryBreakdown || []} />,
    defaultSize: { width: 6, height: 3, minWidth: 4, maxWidth: 8, minHeight: 2, maxHeight: 4 },
    defaultPosition: { x: 0, y: 2 },
    minSize: { width: 4, height: 2 },
    maxSize: { width: 8, height: 4 },
    isResizable: true,
    isDraggable: true,
    category: 'spending',
  },
  {
    id: 'monthly-trends',
    title: 'Monthly Trends',
    component: <MonthlyTrendChart data={stats?.monthlyTrend || []} />,
    defaultSize: { width: 6, height: 3, minWidth: 4, maxWidth: 8, minHeight: 2, maxHeight: 4 },
    defaultPosition: { x: 6, y: 2 },
    minSize: { width: 4, height: 2 },
    maxSize: { width: 8, height: 4 },
    isResizable: true,
    isDraggable: true,
    category: 'analytics',
  },
  {
    id: 'recent-transactions',
    title: 'Recent Transactions',
    component: <RecentTransactions transactions={stats?.recentTransactions || []} />,
    defaultSize: { width: 4, height: 3, minWidth: 3, maxWidth: 6, minHeight: 2, maxHeight: 4 },
    defaultPosition: { x: 0, y: 5 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    isResizable: true,
    isDraggable: true,
    category: 'transactions',
  },
  {
    id: 'budget-alerts',
    title: 'Budget Alerts',
    component: <BudgetAlerts stats={stats} />,
    defaultSize: { width: 4, height: 2, minWidth: 3, maxWidth: 6, minHeight: 2, maxHeight: 3 },
    defaultPosition: { x: 4, y: 5 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 3 },
    isResizable: true,
    isDraggable: true,
    category: 'budget',
  },
  {
    id: 'budget-cards',
    title: 'Budget Overview',
    component: <BudgetCards stats={stats} />,
    defaultSize: { width: 4, height: 2, minWidth: 3, maxWidth: 6, minHeight: 2, maxHeight: 3 },
    defaultPosition: { x: 8, y: 5 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 3 },
    isResizable: true,
    isDraggable: true,
    category: 'budget',
  },
  {
    id: 'spending-heatmap',
    title: 'Spending Heatmap',
    component: <SpendingHeatmap transactions={stats?.recentTransactions ?? []} months={3} />,
    defaultSize: { width: 8, height: 3, minWidth: 6, maxWidth: 12, minHeight: 2, maxHeight: 4 },
    defaultPosition: { x: 0, y: 7 },
    minSize: { width: 6, height: 2 },
    maxSize: { width: 12, height: 4 },
    isResizable: true,
    isDraggable: true,
    category: 'spending',
  },
  {
    id: 'budget-progress',
    title: 'Budget Progress',
    component: (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.budgetBreakdown?.slice(0, 6).map((budget: any) => (
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
    ),
    defaultSize: { width: 4, height: 3, minWidth: 3, maxWidth: 6, minHeight: 2, maxHeight: 4 },
    defaultPosition: { x: 8, y: 7 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    isResizable: true,
    isDraggable: true,
    category: 'budget',
  },
  {
    id: 'dashboard-notes',
    title: 'Dashboard Notes',
    component: <DashboardNotes />,
    defaultSize: { width: 6, height: 4, minWidth: 4, maxWidth: 12, minHeight: 3, maxHeight: 6 },
    defaultPosition: { x: 0, y: 10 },
    minSize: { width: 4, height: 3 },
    maxSize: { width: 12, height: 6 },
    isResizable: true,
    isDraggable: true,
    category: 'analytics',
  },
];
