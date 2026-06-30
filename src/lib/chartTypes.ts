/**
 * Strict TypeScript types for chart data and configurations
 */

/**
 * Chart data point for line/bar charts
 */
export interface ChartDataPoint {
  name: string;
  value: number;
  date?: string;
  category?: string;
}

/**
 * Pie chart data point
 */
export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

/**
 * Category breakdown data
 */
export interface CategoryBreakdownData {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

/**
 * Monthly trend data
 */
export interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

/**
 * Spending pattern data
 */
export interface SpendingPatternData {
  dayOfWeek: string;
  amount: number;
  transactionCount: number;
}

/**
 * Chart configuration options
 */
export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  animationDuration?: number;
  colors?: string[];
}

/**
 * Export section type
 */
export type ExportSection = 'summary' | 'categories' | 'trends' | 'patterns' | 'goals';

/**
 * Strict export options type
 */
export interface StrictExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  sections: ExportSection[];
  dateRange?: {
    start: string;
    end: string;
  };
  includeGoals?: boolean;
  includePatterns?: boolean;
}

/**
 * Chart type enum
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

/**
 * Chart theme colors
 */
export interface ChartThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  destructive: string;
  background: string;
  foreground: string;
  grid: string;
  text: string;
}

/**
 * Default chart configurations
 */
export const DEFAULT_CHART_CONFIG: ChartConfig = {
  width: 800,
  height: 400,
  margin: { top: 20, right: 30, left: 20, bottom: 5 },
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  animationDuration: 300
};

/**
 * Mobile chart configurations
 */
export const MOBILE_CHART_CONFIG: ChartConfig = {
  width: 400,
  height: 300,
  margin: { top: 10, right: 10, left: 10, bottom: 5 },
  showLegend: false,
  showTooltip: true,
  showGrid: false,
  animationDuration: 200
};

/**
 * Default chart colors
 */
export const DEFAULT_CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/**
 * Light theme chart colors
 */
export const LIGHT_THEME_COLORS: ChartThemeColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#ef4444',
  background: '#ffffff',
  foreground: '#0f172a',
  grid: '#e2e8f0',
  text: '#64748b'
};

/**
 * Dark theme chart colors
 */
export const DARK_THEME_COLORS: ChartThemeColors = {
  primary: '#60a5fa',
  secondary: '#94a3b8',
  accent: '#a78bfa',
  success: '#34d399',
  warning: '#fbbf24',
  destructive: '#f87171',
  background: '#1e293b',
  foreground: '#f8fafc',
  grid: '#334155',
  text: '#cbd5e1'
};
