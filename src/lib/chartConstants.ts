/**
 * Common chart configurations and constants
 * Centralized to reduce duplication across components
 */

import { ChartConfig, ChartThemeColors, DEFAULT_CHART_COLORS } from './chartTypes';

/**
 * Responsive chart configurations
 */
export const RESPONSIVE_CHART_CONFIGS = {
  mobile: {
    width: 400,
    height: 300,
    margin: { top: 10, right: 10, left: 10, bottom: 5 },
    showLegend: false,
    showTooltip: true,
    showGrid: false,
    animationDuration: 200
  } as ChartConfig,
  tablet: {
    width: 600,
    height: 350,
    margin: { top: 15, right: 20, left: 15, bottom: 5 },
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    animationDuration: 250
  } as ChartConfig,
  desktop: {
    width: 800,
    height: 400,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
    showLegend: true,
    showTooltip: true,
    showGrid: true,
    animationDuration: 300
  } as ChartConfig
};

/**
 * Chart-specific configurations
 */
export const CHART_SPECIFIC_CONFIGS = {
  pieChart: {
    innerRadius: 0,
    outerRadius: 80,
    paddingAngle: 2,
    labelLine: true,
    label: true
  },
  barChart: {
    barSize: 40,
    borderRadius: 4,
    maxBarWidth: 100
  },
  lineChart: {
    strokeWidth: 2,
    dotRadius: 4,
    activeDotRadius: 6,
    connectNulls: true
  },
  areaChart: {
    strokeWidth: 2,
    fillOpacity: 0.3,
    gradient: true
  }
};

/**
 * Chart animation durations
 */
export const CHART_ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500
};

/**
 * Chart tooltip configurations
 */
export const CHART_TOOLTIP_CONFIG = {
  cursor: true,
  contentStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  itemStyle: {
    padding: '4px 0'
  },
  labelStyle: {
    fontWeight: 'bold',
    marginBottom: '4px'
  }
};

/**
 * Chart legend configurations
 */
export const CHART_LEGEND_CONFIG = {
  iconType: 'circle' as const,
  layout: 'horizontal' as const,
  verticalAlign: 'bottom' as const,
  align: 'center' as const,
  wrapperStyle: {
    paddingTop: '20px'
  }
};

/**
 * Chart axis configurations
 */
export const CHART_AXIS_CONFIG = {
  xAxis: {
    tickLine: false,
    axisLine: false,
    tick: {
      fontSize: 12,
      fill: '#64748b'
    }
  },
  yAxis: {
    tickLine: false,
    axisLine: false,
    tick: {
      fontSize: 12,
      fill: '#64748b'
    },
    width: 60
  }
};

/**
 * Chart grid configurations
 */
export const CHART_GRID_CONFIG = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
  strokeOpacity: 0.5
};

/**
 * Export format labels
 */
export const EXPORT_FORMAT_LABELS = {
  pdf: 'PDF Report',
  excel: 'Excel Spreadsheet',
  csv: 'CSV Data',
  json: 'JSON Data'
};

/**
 * Export section labels
 */
export const EXPORT_SECTION_LABELS = {
  summary: 'Summary (Overview)',
  categories: 'Categories (Spending by Category)',
  trends: 'Trends (Monthly Analysis)',
  patterns: 'Patterns (Spending Patterns)',
  goals: 'Goals (Financial Goals Progress)'
};

/**
 * Report tab configurations
 */
export const REPORT_TABS = [
  { value: 'summary', label: 'Summary', shortLabel: 'Sum' },
  { value: 'visualizations', label: 'Visualizations', shortLabel: 'Vis' },
  { value: 'trends', label: 'Trends', shortLabel: 'Trd' },
  { value: 'categories', label: 'Categories', shortLabel: 'Cat' },
  { value: 'patterns', label: 'Patterns', shortLabel: 'Pat' },
  { value: 'insights', label: 'Insights', shortLabel: 'Ins' },
  { value: 'goals', label: 'Goals', shortLabel: 'Gls' }
];

/**
 * Chart color palettes
 */
export const CHART_COLOR_PALETTES = {
  default: DEFAULT_CHART_COLORS,
  pastel: [
    '#a5b4fc', '#86efac', '#fcd34d', '#fca5a5', '#c4b5fd', '#f9a8d4', '#67e8f9', '#bef264'
  ],
  vibrant: [
    '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#65a30d'
  ],
  monochrome: [
    '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9'
  ]
};

/**
 * Chart responsive breakpoints
 */
export const CHART_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  large: 1280
};

/**
 * Get chart config based on screen width
 */
export function getChartConfigForScreen(screenWidth: number): ChartConfig {
  if (screenWidth < CHART_BREAKPOINTS.mobile) {
    return RESPONSIVE_CHART_CONFIGS.mobile;
  } else if (screenWidth < CHART_BREAKPOINTS.tablet) {
    return RESPONSIVE_CHART_CONFIGS.tablet;
  } else {
    return RESPONSIVE_CHART_CONFIGS.desktop;
  }
}

/**
 * Get color palette by name
 */
export function getColorPalette(name: keyof typeof CHART_COLOR_PALETTES = 'default'): string[] {
  return CHART_COLOR_PALETTES[name] || CHART_COLOR_PALETTES.default;
}
