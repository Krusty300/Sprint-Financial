/**
 * Dynamic import utilities for code splitting and lazy loading
 */

import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Loading component for lazy loaded components
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => 
  React.createElement(
    'div',
    { className: 'flex items-center justify-center p-8' },
    [
      React.createElement(Loader2, { 
        key: 'spinner',
        className: 'h-6 w-6 animate-spin mr-2' 
      }),
      React.createElement('span', { key: 'text' }, message)
    ]
  );

// Error boundary for lazy loaded components
class LazyLoadError extends React.Component<
  { error: Error; retry: () => void },
  { hasError: boolean }
> {
  constructor(props: { error: Error; retry: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy load error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return React.createElement(
        'div',
        { className: 'flex flex-col items-center justify-center p-8 text-center' },
        [
          React.createElement(
            'div',
            { key: 'icon', className: 'text-red-500 mb-4' },
            React.createElement(
              'svg',
              { 
                key: 'svg',
                className: 'h-12 w-12', 
                fill: 'none', 
                stroke: 'currentColor', 
                viewBox: '0 0 24 24' 
              },
              React.createElement('path', {
                key: 'path',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              })
            )
          ),
          React.createElement('h3', { key: 'title', className: 'text-lg font-semibold mb-2' }, 'Failed to load component'),
          React.createElement('p', { key: 'desc', className: 'text-gray-600 mb-4' }, 'There was an error loading this component.'),
          React.createElement(
            'button',
            {
              key: 'retry',
              onClick: this.props.retry,
              className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
            },
            'Try Again'
          )
        ]
      );
    }

    return this.props.children;
  }
}

// Higher-order component for lazy loading with error handling
export function lazyLoad<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallbackMessage?: string
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) =>
    React.createElement(
      LazyLoadError,
      { 
        error: new Error('Component failed to load'),
        retry: () => window.location.reload()
      },
      React.createElement(
        Suspense,
        { fallback: React.createElement(LoadingFallback, { message: fallbackMessage }) },
        React.createElement(LazyComponent, props)
      )
    );
}

// Preload utility for critical components
export function preloadComponent(importFunc: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Start loading the component in the background
    importFunc().catch(error => {
      console.warn('Failed to preload component:', error);
    });
  }
}

// Dynamic imports for major components
export const lazyComponents = {
  // Dashboard components
  DashboardStats: lazyLoad(() => import('@/components/dashboard/DashboardStats'), 'Loading dashboard...'),
  TransactionChart: lazyLoad(() => import('@/components/charts/TransactionChart'), 'Loading chart...'),
  BudgetOverview: lazyLoad(() => import('@/components/budgets/BudgetOverview'), 'Loading budgets...'),
  
  // Transaction components
  TransactionList: lazyLoad(() => import('@/components/transactions/TransactionList'), 'Loading transactions...'),
  TransactionForm: lazyLoad(() => import('@/components/forms/TransactionForm'), 'Loading form...'),
  TransactionDetails: lazyLoad(() => import('@/components/transactions/TransactionDetails'), 'Loading details...'),
  
  // Settings components
  ThemeSettings: lazyLoad(() => import('@/components/settings/ThemeSettings'), 'Loading theme settings...'),
  CurrencySettings: lazyLoad(() => import('@/components/settings/CurrencySettings'), 'Loading currency settings...'),
  NotificationSettings: lazyLoad(() => import('@/components/notifications/NotificationSettings'), 'Loading notifications...'),
  
  // Reports components
  FinancialReports: lazyLoad(() => import('@/components/reports/FinancialReports'), 'Loading reports...'),
  ExportTools: lazyLoad(() => import('@/components/reports/ExportTools'), 'Loading export tools...'),
  
  // Analytics components
  AnalyticsDashboard: lazyLoad(() => import('@/components/analytics/AnalyticsDashboard'), 'Loading analytics...'),
  SpendingAnalysis: lazyLoad(() => import('@/components/analytics/SpendingAnalysis'), 'Loading analysis...'),
  
  // Advanced features
  AIInsights: lazyLoad(() => import('@/components/ai/AIInsights'), 'Loading AI insights...'),
  InvestmentTracker: lazyLoad(() => import('@/components/investments/InvestmentTracker'), 'Loading investments...'),
  BillReminders: lazyLoad(() => import('@/components/bills/BillReminders'), 'Loading reminders...'),
};

// Preload critical components based on user behavior
export class ComponentPreloader {
  private static instance: ComponentPreloader;
  private preloadedComponents = new Set<string>();
  private userBehavior: Record<string, number> = {};

  static getInstance(): ComponentPreloader {
    if (!ComponentPreloader.instance) {
      ComponentPreloader.instance = new ComponentPreloader();
    }
    return ComponentPreloader.instance;
  }

  // Track user navigation patterns
  trackNavigation(route: string) {
    this.userBehavior[route] = (this.userBehavior[route] || 0) + 1;
    
    // Preload components based on navigation patterns
    this.preloadBasedOnBehavior();
  }

  private preloadBasedOnBehavior() {
    const sortedRoutes = Object.entries(this.userBehavior)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3); // Top 3 most visited routes

    const preloadMap: Record<string, () => Promise<any>> = {
      '/dashboard': () => import('@/components/dashboard/DashboardStats'),
      '/transactions': () => import('@/components/transactions/TransactionList'),
      '/budgets': () => import('@/components/budgets/BudgetOverview'),
      '/reports': () => import('@/components/reports/FinancialReports'),
      '/settings': () => import('@/components/settings/ThemeSettings'),
    };

    sortedRoutes.forEach(([route]) => {
      if (preloadMap[route] && !this.preloadedComponents.has(route)) {
        preloadComponent(preloadMap[route]);
        this.preloadedComponents.add(route);
      }
    });
  }

  // Preload components for likely next actions
  preloadLikelyComponents(currentRoute: string) {
    const preloadMap: Record<string, string[]> = {
      '/dashboard': ['TransactionChart', 'BudgetOverview'],
      '/transactions': ['TransactionForm', 'TransactionDetails'],
      '/budgets': ['BudgetOverview', 'FinancialReports'],
      '/reports': ['FinancialReports', 'ExportTools'],
      '/settings': ['ThemeSettings', 'NotificationSettings'],
    };

    const componentsToPreload = preloadMap[currentRoute] || [];
    
    componentsToPreload.forEach(componentName => {
      if (!this.preloadedComponents.has(componentName)) {
        const component = (lazyComponents as any)[componentName];
        if (component && component.type && component.type.props) {
          // Trigger the lazy load
          preloadComponent(() => import('@/components/dashboard/DashboardStats'));
          this.preloadedComponents.add(componentName);
        }
      }
    });
  }

  // Preload all components (useful for development or high-speed connections)
  preloadAll() {
    Object.values(lazyComponents).forEach(component => {
      // Trigger lazy load by accessing the component
      component.toString();
    });
  }

  getPreloadedStats() {
    return {
      preloadedCount: this.preloadedComponents.size,
      totalComponents: Object.keys(lazyComponents).length,
      preloadedComponents: Array.from(this.preloadedComponents),
      userBehavior: this.userBehavior
    };
  }
}

// Bundle size monitoring
export function monitorBundleSize() {
  if (typeof window !== 'undefined') {
    // Monitor chunk loading
    const originalAppendChild = document.head.appendChild.bind(document.head);
    
    document.head.appendChild = function(element) {
      if (element.tagName === 'SCRIPT' && element.src) {
        const script = element as HTMLScriptElement;
        
        script.onload = () => {
          console.log(`Chunk loaded: ${script.src}`);
          
          // Track bundle sizes
          if (script.src.includes('chunk')) {
            const chunkName = script.src.split('/').pop() || 'unknown';
            console.log(`Bundle ${chunkName} loaded successfully`);
          }
        };
        
        script.onerror = () => {
          console.error(`Failed to load chunk: ${script.src}`);
        };
      }
      
      return originalAppendChild(element);
    };
  }
}

// Intersection Observer for lazy loading components
export function useLazyComponentLoader(
  threshold: number = 0.1,
  rootMargin: string = '50px'
) {
  const [shouldLoad, setShouldLoad] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { elementRef, shouldLoad };
}

// Dynamic route loading for Next.js
export const dynamicRoutes = {
  // Admin routes (load only when needed)
  admin: {
    dashboard: () => import('@/app/admin/dashboard/page'),
    users: () => import('@/app/admin/users/page'),
    settings: () => import('@/app/admin/settings/page'),
  },
  
  // Advanced features
  advanced: {
    ai: () => import('@/app/ai/page'),
    integrations: () => import('@/app/integrations/page'),
    analytics: () => import('@/app/analytics/page'),
  },
  
  // Modal components
  modals: {
    transaction: () => import('@/components/modals/TransactionModal'),
    category: () => import('@/components/modals/CategoryModal'),
    budget: () => import('@/components/modals/BudgetModal'),
  },
};

// Preload critical routes
export function preloadCriticalRoutes() {
  const criticalRoutes = ['/dashboard', '/transactions', '/budgets'];
  
  criticalRoutes.forEach(route => {
    // Use Next.js prefetch if available
    if (typeof window !== 'undefined' && 'router' in window) {
      // @ts-ignore
      window.router?.prefetch?.(route);
    }
  });
}

// Initialize performance monitoring
export function initializePerformanceOptimizations() {
  if (typeof window !== 'undefined') {
    // Monitor bundle sizes
    monitorBundleSize();
    
    // Initialize component preloader
    const preloader = ComponentPreloader.getInstance();
    
    // Preload critical components
    preloadCriticalRoutes();
    
    // Log performance stats in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        const stats = preloader.getPreloadedStats();
        console.log('Component Preloader Stats:', stats);
      }, 30000); // Every 30 seconds
    }
  }
}
