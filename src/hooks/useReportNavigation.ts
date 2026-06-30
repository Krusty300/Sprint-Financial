import { useState, useCallback, useEffect, useMemo } from 'react';
import { Target, PieChart as PieChartIcon, TrendingUp, BarChart3, Lightbulb } from 'lucide-react';
import { useRecentlyViewed } from './useRecentlyViewed';

export interface ReportTab {
  value: string;
  label: string;
  icon: any;
}

export interface UseReportNavigationOptions {
  initialTab?: string;
  storageKey?: string;
}

export interface UseReportNavigationReturn {
  activeTab: string;
  searchQuery: string;
  filteredTabs: ReportTab[];
  recentlyViewed: string[];
  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  addToRecentlyViewed: (item: string) => void;
  resetSearch: () => void;
}

/**
 * Custom hook for managing report navigation and search
 * Handles tab switching, search filtering, and recently viewed tracking
 */
export function useReportNavigation(options: UseReportNavigationOptions = {}): UseReportNavigationReturn {
  const { initialTab = 'summary', storageKey = 'reportRecentlyViewed' } = options;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed({ 
    maxItems: 5, 
    storageKey 
  });

  // Define all available tabs
  const allTabs: ReportTab[] = useMemo(() => [
    { value: 'summary', label: 'Summary', icon: Target },
    { value: 'visualizations', label: 'Visualizations', icon: PieChartIcon },
    { value: 'trends', label: 'Trends', icon: TrendingUp },
    { value: 'categories', label: 'Categories', icon: BarChart3 },
    { value: 'patterns', label: 'Patterns', icon: Target },
    { value: 'insights', label: 'Insights', icon: Lightbulb },
  ], []);

  // Filter tabs based on search query
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return allTabs;
    
    return allTabs.filter(tab => 
      tab.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allTabs]);

  // Track tab changes for recently viewed
  useEffect(() => {
    if (activeTab && activeTab !== initialTab) {
      const formattedName = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
      addToRecentlyViewed(formattedName);
    }
  }, [activeTab, initialTab, addToRecentlyViewed]);

  const resetSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    activeTab,
    searchQuery,
    filteredTabs,
    recentlyViewed,
    setActiveTab,
    setSearchQuery,
    addToRecentlyViewed,
    resetSearch
  };
}
