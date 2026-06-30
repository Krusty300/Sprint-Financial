'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Transaction } from '@/lib/types';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { toast } from 'sonner';
import { 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Calendar,
  DollarSign,
  Wallet,
  AlertTriangle,
  Loader2
} from 'lucide-react';

// Utility function to get today's date string in local timezone
const getTodayDateString = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight local time
  return today.toISOString().split('T')[0];
};

interface QuickAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const recentAmounts = [10, 25, 50, 100, 250, 500];
const quickDescriptions = [
  'Coffee',
  'Lunch',
  'Groceries',
  'Gas',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Transport',
  'Other'
];

// Different amounts for Income vs Expense
const expenseAmounts = [5, 10, 15, 25, 50, 100];
const incomeAmounts = [100, 250, 500, 1000, 2000, 5000];

export function QuickAddModal({ open, onOpenChange }: QuickAddModalProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { formatDate } = useFormatting();
  const { addTransaction } = useTransactions();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  // Prevent SSR issues by ensuring we're on client side
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    account: '',
    date: getTodayDateString()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFutureDate, setIsFutureDate] = useState(false);

  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      category: '' // Clear category when switching types
    }));
  };

  // Check for future date when date changes
  useEffect(() => {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set selected date to midnight for fair comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    setIsFutureDate(selectedDate > tomorrow);
  }, [formData.date]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!formData.account) {
      toast.error('Please select an account');
      return;
    }
    
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }
    
    // Validate date is not too far in future (more than 1 day)
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Set selected date to midnight for fair comparison
    selectedDate.setHours(0, 0, 0, 0);
    
    const isFutureDate = selectedDate > tomorrow;
    if (isFutureDate) {
      toast.warning('Date is in the future. Please confirm this is correct.');
      // Don't return - allow user to proceed with warning
    }

    setIsSubmitting(true);
    
    try {
      await addTransaction({
        type: formData.type,
        amount: amount,
        description: formData.description.trim(),
        category: formData.category,
        account: formData.account,
        date: formData.date
      });
      
      // Reset form
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        account: '',
        date: getTodayDateString()
      });
      
      onOpenChange(false);
      toast.success('Transaction added successfully!');
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, addTransaction, onOpenChange]);

  const setQuickAmount = useCallback((amount: number) => {
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  }, []);

  const setQuickDescription = useCallback((description: string) => {
    setFormData(prev => ({ ...prev, description }));
  }, []);

  // Quick date functions
  const setToday = () => {
    setFormData(prev => ({ ...prev, date: getTodayDateString() }));
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Set to midnight local time
    setFormData(prev => ({ ...prev, date: yesterday.toISOString().split('T')[0] }));
  };

  const setLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0); // Set to midnight local time
    setFormData(prev => ({ ...prev, date: lastWeek.toISOString().split('T')[0] }));
  };

  const getRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === 2) return '2 days ago';
    if (diffDays === 7) return 'Last week';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories;
  const selectedCategory = categories.find(cat => cat.id === formData.category);
  
  // Check if form can be submitted
  const canSubmit = formData.amount && 
                    formData.description.trim() && 
                    formData.category && 
                    formData.account && 
                    formData.date &&
                    currentCategories.length > 0 &&
                    accounts.length > 0 &&
                    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="quick-add-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Quick Add Transaction
          </DialogTitle>
          <DialogDescription id="quick-add-description">
            Quickly add a new transaction to your records
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.type === 'expense' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('expense')}
              className="flex-1"
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={formData.type === 'income' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('income')}
              className="flex-1"
            >
              Income
            </Button>
          </div>

          {/* Amount Input with Quick Amounts */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Amount ({getCurrencySymbol(currency)})</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                placeholder={`0.00 ${getCurrencySymbol(currency)}`}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="pl-10 text-lg font-semibold"
                required
              />
              {formData.amount && parseFloat(formData.amount) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Preview: {formatCurrency(parseFloat(formData.amount) || 0)}
                </p>
              )}
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {(formData.type === 'income' ? incomeAmounts : expenseAmounts).map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(amount)}
                  className="text-xs"
                >
                  {isClient ? formatCurrency(amount) : `$${amount.toFixed(2)}`}
                </Button>
              ))}
            </div>
          </div>

          {/* Description with Quick Suggestions */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="What's this transaction for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
            
            {/* Quick Description Suggestions */}
            <div className="flex flex-wrap gap-2">
              {quickDescriptions.map((description) => (
                <Badge
                  key={description}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setQuickDescription(description)}
                >
                  {description}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category and Account */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              {currentCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/50">
                  No {formData.type} categories available
                </div>
              ) : (
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span>{category.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              {accounts.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/50">
                  No accounts available
                </div>
              ) : (
                <Select value={formData.account} onValueChange={(value) => setFormData(prev => ({ ...prev, account: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="pl-10 pr-4 h-11 bg-background border-2 border-input rounded-lg text-sm font-medium transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-muted-foreground"
                max={getTodayDateString()}
                required
              />
            </div>
            
            {/* Quick Date Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setToday}
                className="text-xs"
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setYesterday}
                className="text-xs"
              >
                Yesterday
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={setLastWeek}
                className="text-xs"
              >
                Last Week
              </Button>
            </div>
            
            {/* Relative Date Display */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {getRelativeDate(formData.date)}
              </div>
              {isFutureDate && (
                <div className="flex items-center gap-1 text-amber-600 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Future date
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {selectedCategory && formData.amount && (
            <Card className="border-2">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{selectedCategory.icon || '📌'}</div>
                    <div>
                      <div className="font-medium">{formData.description || 'Untitled Transaction'}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCategory.name} • {accounts.find(acc => acc.id === formData.account)?.name || 'No account'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      formData.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formData.type === 'income' ? '+' : '-'}
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isClient ? formatDate(formData.date) : new Date(formData.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Transaction
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
