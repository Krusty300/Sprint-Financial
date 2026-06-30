'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Save, 
  Trash2, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Filter,
  X
} from 'lucide-react';
import { formatDate, getMonthStart, getMonthEnd, getYearStart, getYearEnd } from '@/lib/utils';
import { toast } from 'sonner';

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: {
    dateRange?: { start: string; end: string };
    type?: 'all' | 'income' | 'expense';
    category?: string;
    amountRange?: { min: string; max: string };
  };
}

interface AdvancedFiltersProps {
  filters: {
    searchTerm: string;
    type: 'all' | 'income' | 'expense';
    category: string;
    dateRange: { start: string; end: string };
    amountRange: { min: string; max: string };
  };
  onFiltersChange: (filters: any) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  isOpen: boolean;
  onToggle: () => void;
}

const defaultPresets: FilterPreset[] = [
  {
    id: 'this-month',
    name: 'This Month',
    description: 'Current month transactions',
    filters: {
      dateRange: {
        start: getMonthStart(new Date()).toISOString().split('T')[0],
        end: getMonthEnd(new Date()).toISOString().split('T')[0]
      }
    }
  },
  {
    id: 'last-month',
    name: 'Last Month',
    description: 'Previous month transactions',
    filters: {
      dateRange: {
        start: getMonthStart(new Date(new Date().getFullYear(), new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: getMonthEnd(new Date(new Date().getFullYear(), new Date().getMonth() - 1)).toISOString().split('T')[0]
      }
    }
  },
  {
    id: 'this-year',
    name: 'This Year',
    description: 'Current year transactions',
    filters: {
      dateRange: {
        start: getYearStart(new Date()).toISOString().split('T')[0],
        end: getYearEnd(new Date()).toISOString().split('T')[0]
      }
    }
  },
  {
    id: 'last-30-days',
    name: 'Last 30 Days',
    description: 'Transactions from last 30 days',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    }
  },
  {
    id: 'income-only',
    name: 'Income Only',
    description: 'Show only income transactions',
    filters: {
      type: 'income'
    }
  },
  {
    id: 'expenses-only',
    name: 'Expenses Only',
    description: 'Show only expense transactions',
    filters: {
      type: 'expense'
    }
  },
  {
    id: 'large-expenses',
    name: 'Large Expenses',
    description: 'Expenses over $100',
    filters: {
      type: 'expense',
      amountRange: { min: '100', max: '' }
    }
  },
  {
    id: 'recent-week',
    name: 'This Week',
    description: 'Last 7 days of transactions',
    filters: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      }
    }
  }
];

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  categories, 
  isOpen, 
  onToggle 
}: AdvancedFiltersProps) {
  const [presets, setPresets] = useState<FilterPreset[]>(defaultPresets);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('finance-filter-presets');
    if (saved) {
      try {
        const savedPresets = JSON.parse(saved);
        setPresets([...defaultPresets, ...savedPresets]);
      } catch (error) {
        console.error('Error parsing saved presets:', error);
      }
    }
  }, []);
  
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const applyPreset = useCallback((preset: FilterPreset) => {
    onFiltersChange({
      ...filters,
      ...preset.filters
    });
    toast.success(`Applied preset: ${preset.name}`);
  }, [filters, onFiltersChange]);

  const savePreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: newPresetName,
      description: 'Custom filter preset',
      filters: {
        dateRange: filters.dateRange.start || filters.dateRange.end ? filters.dateRange : undefined,
        type: filters.type !== 'all' ? filters.type : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        amountRange: filters.amountRange.min || filters.amountRange.max ? filters.amountRange : undefined
      }
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    if (mounted) {
      localStorage.setItem('finance-filter-presets', JSON.stringify(updatedPresets.slice(defaultPresets.length)));
    }
    setNewPresetName('');
    setShowSavePreset(false);
    toast.success('Preset saved successfully');
  }, [filters, presets, newPresetName, mounted]);

  const deletePreset = useCallback((presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    const customPresets = updatedPresets.slice(defaultPresets.length);
    if (mounted) {
      localStorage.setItem('finance-filter-presets', JSON.stringify(customPresets));
    }
    toast.success('Preset deleted');
  }, [presets, mounted]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      searchTerm: '',
      type: 'all',
      category: 'all',
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' }
    });
    toast.success('All filters cleared');
  }, [onFiltersChange]);

  const hasActiveFilters = 
    filters.type !== 'all' || 
    filters.category !== 'all' || 
    filters.dateRange.start || 
    filters.dateRange.end ||
    filters.amountRange.min ||
    filters.amountRange.max;

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  return (
    <Card className={isOpen ? 'border-2 border-primary' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
            >
              {isOpen ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isOpen && (
        <CardContent className="space-y-6">
          {/* Date Range Shortcuts */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date Range Shortcuts
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {defaultPresets.filter(p => p.filters.dateRange).map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, start: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <Input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: { ...filters.dateRange, end: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Amount Range */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Amount Range
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Amount</label>
                <Input
                  type="number"
                  placeholder="No minimum"
                  value={filters.amountRange.min}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    amountRange: { ...filters.amountRange, min: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Maximum Amount</label>
                <Input
                  type="number"
                  placeholder="No maximum"
                  value={filters.amountRange.max}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    amountRange: { ...filters.amountRange, max: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Filter Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Save className="h-4 w-4" />
                Filter Presets
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSavePreset(!showSavePreset)}
              >
                Save Current
              </Button>
            </div>

            {showSavePreset && (
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="Preset name..."
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={savePreset}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  setShowSavePreset(false);
                  setNewPresetName('');
                }}>
                  Cancel
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{preset.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{preset.description}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="h-6 w-6 p-0"
                    >
                      <Filter className="h-3 w-3" />
                    </Button>
                    {parseInt(preset.id) >= defaultPresets.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePreset(preset.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
