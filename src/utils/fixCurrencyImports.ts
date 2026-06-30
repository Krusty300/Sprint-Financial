// This is a utility to help identify components that need currency context updates
// Components that should be updated to use currency context instead of utils formatCurrency

const COMPONENTS_TO_UPDATE = [
  // Dashboard components
  'src/components/dashboard/DashboardCards.tsx',
  'src/components/dashboard/BudgetCards.tsx', 
  'src/components/dashboard/RecentTransactions.tsx',
  'src/components/dashboard/BudgetAlerts.tsx',
  
  // Report components
  'src/components/reports/MonthlyTrendsReport.tsx',
  'src/components/reports/CategoryBreakdownReport.tsx',
  'src/components/reports/FinancialSummaryReport.tsx',
  
  // Chart components
  'src/components/charts/AccountComparison.tsx',
  'src/components/charts/BudgetComparisonChart.tsx',
  'src/components/charts/BudgetTrendChart.tsx',
  'src/components/charts/CashFlowChart.tsx',
  'src/components/charts/ComparisonChart.tsx',
  'src/components/charts/EnhancedPieChart.tsx',
  'src/components/charts/GoalProgressChart.tsx',
  'src/components/charts/MonthlyComparison.tsx',
  'src/components/charts/AccountTypeDistribution.tsx',
  
  // Form components
  'src/components/forms/EnhancedTransactionForm.tsx',
  'src/components/forms/QuickAddModal.tsx',
  
  // Dialog components
  'src/components/dialogs/ExportDialog.tsx',
  'src/components/dialogs/DeleteAccountDialog.tsx',
  'src/components/dialogs/DeleteBudgetDialog.tsx',
  'src/components/dialogs/AccountDetailsDialog.tsx',
  
  // Budget components
  'src/components/budgets/BudgetSummary.tsx',
  
  // Template components
  'src/components/templates/TemplateManager.tsx',
  
  // Search components
  'src/components/search/GlobalSearch.tsx',
  
  // Layout components
  'src/components/layout/Sidebar.tsx',
  
  // Transaction components
  'src/components/transactions/InfiniteScrollTransactions.tsx'
];

export const COMPONENTS_NEEDING_CURRENCY_CONTEXT = COMPONENTS_TO_UPDATE;

// Instructions for updating components:
/*
For each component, replace:

import { formatCurrency } from '@/lib/utils';

with:

import { useCurrency } from '@/contexts/CurrencyContext';

And add inside the component:

const { formatCurrency } = useCurrency();

For date formatting, replace:

import { formatDate } from '@/lib/utils';

with:

import { useFormatting } from '@/contexts/FormattingContext';

And add inside the component:

const { formatDate } = useFormatting();
*/
