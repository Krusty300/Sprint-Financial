'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Tag, 
  CreditCard, 
  Save, 
  Trash2, 
  Clock,
  ChevronDown,
  X
} from 'lucide-react';
import { Transaction } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useFormatting } from '@/contexts/FormattingContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

interface FilterState {
  searchTerm: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  account: string;
  tags: string[];
  dateRange: { start: string; end: string };
  amountRange: { min: number; max: number };
}

interface SavedFilter {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

interface EnhancedTransactionFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: any[];
  accounts: any[];
  transactions: Transaction[];
}

const quickPresets = [
  {
    name: 'This Week',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      return {
        start: formatDate(startOfWeek),
        end: formatDate(now)
      };
    }
  },
  {
    name: 'This Month',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        start: formatDate(startOfMonth),
        end: formatDate(now)
      };
    }
  },
  {
    name: 'Last 30 Days',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        start: formatDate(thirtyDaysAgo),
        end: formatDate(now)
      };
    }
  },
  {
    name: 'Last 3 Months',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return {
        start: formatDate(threeMonthsAgo),
        end: formatDate(now)
      };
    }
  },
  {
    name: 'This Year',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return {
        start: formatDate(startOfYear),
        end: formatDate(now)
      };
    }
  },
  {
    name: 'Last Year',
    getDateRange: (formatDate: (date: Date) => string) => {
      const now = new Date();
      const lastYear = now.getFullYear() - 1;
      const startOfLastYear = new Date(lastYear, 0, 1);
      const endOfLastYear = new Date(lastYear, 11, 31);
      return {
        start: formatDate(startOfLastYear),
        end: formatDate(endOfLastYear)
      };
    }
  }
];

export function EnhancedTransactionFilters({ 
  filters, 
  onFiltersChange, 
  categories, 
  accounts, 
  transactions 
}: EnhancedTransactionFiltersProps) {
  const { formatDate } = useFormatting();
  const { formatCurrency } = useCurrency();
  const { categories: allCategories } = useCategories();
  const { accounts: allAccounts } = useAccounts();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extract all unique tags from transactions
  const allTags = Array.from(new Set(
    transactions
      .flatMap(t => t.tags || [])
      .filter(Boolean)
  )).sort();

  // Get min/max amounts for slider range
  const amounts = transactions.map(t => t.amount);
  const minAmount = Math.min(...amounts, 0);
  const maxAmount = Math.max(...amounts, 1000);

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedTransactionFilters');
    if (saved) {
      try {
        setSavedFilters(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Save filters to localStorage
  const saveFiltersToStorage = (filters: SavedFilter[]) => {
    localStorage.setItem('savedTransactionFilters', JSON.stringify(filters));
  };

  const handleQuickPreset = (preset: typeof quickPresets[0]) => {
    const dateRange = preset.getDateRange(formatDate);
    onFiltersChange({
      ...filters,
      dateRange
    });
    toast.success(`Applied ${preset.name} filter`);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a name for your filter');
      return;
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString()
    };

    const updatedFilters = [...savedFilters, newFilter];
    setSavedFilters(updatedFilters);
    saveFiltersToStorage(updatedFilters);
    setFilterName('');
    setShowSaveDialog(false);
    toast.success('Filter saved successfully');
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    onFiltersChange(savedFilter.filters);
    toast.success(`Loaded filter: ${savedFilter.name}`);
  };

  const handleDeleteFilter = (filterId: string) => {
    const updatedFilters = savedFilters.filter(f => f.id !== filterId);
    setSavedFilters(updatedFilters);
    saveFiltersToStorage(updatedFilters);
    toast.success('Filter deleted');
  };

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFiltersChange({ ...filters, tags: newTags });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      type: 'all',
      category: 'all',
      account: 'all',
      tags: [],
      dateRange: { start: '', end: '' },
      amountRange: { min: minAmount, max: maxAmount }
    });
    toast.success('All filters cleared');
  };

  const hasActiveFilters = 
    filters.searchTerm ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.account !== 'all' ||
    filters.tags.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.amountRange.min !== minAmount ||
    filters.amountRange.max !== maxAmount;

  return (
    <div className="space-y-4">
      {/* Quick Presets and Saved Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Quick Presets Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              Quick Presets
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {quickPresets.map((preset, index) => (
              <DropdownMenuItem 
                key={index}
                onClick={() => handleQuickPreset(preset)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {preset.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Saved Filters Dropdown */}
        {savedFilters.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Saved Filters
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {savedFilters.map((savedFilter) => (
                <DropdownMenuItem
                  key={savedFilter.id}
                  className="flex items-center justify-between"
                >
                  <div 
                    className="flex-1"
                    onClick={() => handleLoadFilter(savedFilter)}
                  >
                    {savedFilter.name}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFilter(savedFilter.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Save Current Filter */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Current
          </Button>
        )}

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearAllFilters}
          >
            <X className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}

        {/* Toggle Advanced */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="mr-2 h-4 w-4" />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="mb-4 rounded-lg">
          <CardHeader>
            <CardTitle className="text-lg">Save Current Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="filterName">Filter Name</Label>
              <Input
                id="filterName"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g., Monthly Groceries, Work Expenses"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveFilter}>
                <Save className="mr-2 h-4 w-4" />
                Save Filter
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSaveDialog(false);
                  setFilterName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <div>
            <Input
              id="search"
              placeholder="Search transactions..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
            />
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={filters.type} onValueChange={(value: any) => onFiltersChange({ ...filters, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={filters.category} onValueChange={(value) => onFiltersChange({ ...filters, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account Filter */}
        <div>
          <Label htmlFor="account">Account</Label>
          <Select value={filters.account} onValueChange={(value) => onFiltersChange({ ...filters, account: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="space-y-4 border-t pt-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Amount Range Slider */}
          <div>
            <Label>Amount Range: {formatCurrency(filters.amountRange.min)} - {formatCurrency(filters.amountRange.max)}</Label>
            <Slider
              value={[filters.amountRange.min, filters.amountRange.max]}
              onValueChange={(value: number[]) => onFiltersChange({ 
                ...filters, 
                amountRange: { min: value[0], max: value[1] } 
              })}
              min={minAmount}
              max={maxAmount}
              step={10}
              className="mt-2"
            />
          </div>

          {/* Tags Filter */}
          {allTags.length > 0 && (
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="text-sm">Active Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {filters.searchTerm && (
                <Badge variant="secondary">
                  Search: "{filters.searchTerm}"
                </Badge>
              )}
              {filters.type !== 'all' && (
                <Badge variant="secondary">
                  Type: {filters.type}
                </Badge>
              )}
              {filters.category !== 'all' && (
                <Badge variant="secondary">
                  Category: {categories.find(c => c.id === filters.category)?.name}
                </Badge>
              )}
              {filters.account !== 'all' && (
                <Badge variant="secondary">
                  Account: {accounts.find(a => a.id === filters.account)?.name}
                </Badge>
              )}
              {filters.tags.length > 0 && (
                <Badge variant="secondary">
                  Tags: {filters.tags.join(', ')}
                </Badge>
              )}
              {filters.dateRange.start && (
                <Badge variant="secondary">
                  From: {filters.dateRange.start}
                </Badge>
              )}
              {filters.dateRange.end && (
                <Badge variant="secondary">
                  To: {filters.dateRange.end}
                </Badge>
              )}
              {(filters.amountRange.min !== minAmount || filters.amountRange.max !== maxAmount) && (
                <Badge variant="secondary">
                  Amount: {formatCurrency(filters.amountRange.min)} - {formatCurrency(filters.amountRange.max)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
