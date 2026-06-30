'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTransactions } from './useTransactions';
import { useCategories } from './useCategories';
import { useAccounts } from './useAccounts';
import { Transaction } from '@/lib/types';

export interface FilterConfig {
  dateRange: '7d' | '30d' | '90d' | '1y' | 'custom' | 'all';
  customDateRange?: { start: Date; end: Date };
  categories: string[];
  accounts: string[];
  amountRange: { min: number; max: number };
  transactionType: 'all' | 'income' | 'expense';
  searchQuery: string;
  tags: string[];
  status: 'all' | 'pending' | 'completed' | 'cancelled';
}

export interface SavedFilter {
  id: string;
  name: string;
  config: FilterConfig;
  createdAt: string;
  isDefault?: boolean;
}

export function useAdvancedFilters(data: Transaction[] = []) {
  const [filters, setFilters] = useState<FilterConfig>({
    dateRange: '30d',
    categories: [],
    accounts: [],
    amountRange: { min: 0, max: 10000 },
    transactionType: 'all',
    searchQuery: '',
    tags: [],
    status: 'all'
  });

  // Load filter state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-filter-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFilters(parsed);
      } catch (error) {
        console.warn('Failed to load saved filter state:', error);
      }
    }
  }, []);

  // Save filter state to localStorage on change
  useEffect(() => {
    localStorage.setItem('dashboard-filter-state', JSON.stringify(filters));
  }, [filters]);

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedFilters(parsed);
      } catch (error) {
        console.warn('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Get date range from filter config
  const getDateRange = useCallback((config: FilterConfig) => {
    const now = new Date();
    
    switch (config.dateRange) {
      case '7d':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now
        };
      case '30d':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
      case '90d':
        return {
          start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
          end: now
        };
      case '1y':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now
        };
      case 'custom':
        return config.customDateRange || { start: new Date(), end: new Date() };
      case 'all':
      default:
        return {
          start: new Date(0),
          end: new Date()
        };
    }
  }, []);

  // Filter transactions based on config
  const applyFilters = useCallback((transactions: Transaction[], config: FilterConfig) => {
    return transactions.filter(transaction => {
      // Date range filter
      const dateRange = getDateRange(config);
      const transactionDate = new Date(transaction.date);
      if (transactionDate < dateRange.start || transactionDate > dateRange.end) {
        return false;
      }

      // Category filter
      if (config.categories.length > 0 && !config.categories.includes(transaction.category)) {
        return false;
      }

      // Account filter
      if (config.accounts.length > 0 && transaction.account && !config.accounts.includes(transaction.account)) {
        return false;
      }

      // Amount range filter
      if (transaction.amount < config.amountRange.min || transaction.amount > config.amountRange.max) {
        return false;
      }

      // Transaction type filter
      if (config.transactionType !== 'all' && transaction.type !== config.transactionType) {
        return false;
      }

      // Search query filter
      if (config.searchQuery && config.searchQuery.trim()) {
        const searchLower = config.searchQuery.toLowerCase();
        const matchesSearch = 
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.category.toLowerCase().includes(searchLower) ||
          (transaction.account && transaction.account.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) {
          return false;
        }
      }

      // Tags filter
      if (config.tags.length > 0 && transaction.tags) {
        const hasMatchingTag = config.tags.some(tag => 
          transaction.tags?.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [getDateRange]);

  // Filtered data
  const filteredData = useMemo(() => {
    return applyFilters(data, filters);
  }, [data, filters, applyFilters]);

  // Filter statistics
  const filterStats = useMemo(() => {
    const total = data.length;
    const filtered = filteredData.length;
    const reduction = total - filtered;
    const reductionPercentage = total > 0 ? (reduction / total) * 100 : 0;

    return {
      total,
      filtered,
      reduction,
      reductionPercentage,
      isActive: reduction > 0
    };
  }, [data.length, filteredData.length]);

  // Update filter config
  const updateFilter = useCallback((key: keyof FilterConfig, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: '30d',
      categories: [],
      accounts: [],
      amountRange: { min: 0, max: 10000 },
      transactionType: 'all',
      searchQuery: '',
      tags: [],
      status: 'all'
    });
  }, []);

  // Save filter configuration
  const saveFilter = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name,
      config: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('dashboard-filters', JSON.stringify(updated));
  }, [filters, savedFilters]);

  // Load saved filter
  const loadFilter = useCallback((filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId);
    if (filter) {
      setFilters(filter.config);
    }
  }, [savedFilters]);

  // Delete saved filter
  const deleteFilter = useCallback((filterId: string) => {
    const updated = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updated);
    localStorage.setItem('dashboard-filters', JSON.stringify(updated));
  }, [savedFilters]);

  // Get quick filter presets
  const quickFilters = useMemo(() => [
    {
      id: 'this-month',
      name: 'This Month',
      config: { ...filters, dateRange: '30d', transactionType: 'expense' }
    },
    {
      id: 'last-week',
      name: 'Last Week',
      config: { ...filters, dateRange: '7d' }
    },
    {
      id: 'income-only',
      name: 'Income Only',
      config: { ...filters, transactionType: 'income' }
    },
    {
      id: 'expenses-only',
      name: 'Expenses Only',
      config: { ...filters, transactionType: 'expense' }
    },
    {
      id: 'large-transactions',
      name: 'Large Transactions',
      config: { ...filters, amountRange: { min: 500, max: 100000 } }
    }
  ], [filters]);

  return {
    // Current state
    filters,
    filteredData,
    filterStats,
    savedFilters,
    quickFilters,

    // Actions
    updateFilter,
    resetFilters,
    saveFilter,
    loadFilter,
    deleteFilter,

    // Utilities
    applyFilters,
    getDateRange
  };
}
