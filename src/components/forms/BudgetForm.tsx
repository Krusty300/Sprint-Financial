'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PopupSelector, SelectorOption } from '@/components/ui/popup-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useCategories } from '@/hooks/useCategories';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Budget, BudgetTemplate } from '@/lib/types';
import { Calendar, CalendarDays, CalendarRange, CalendarClock, Calendar as CalendarIcon, Loader2, RotateCcw } from 'lucide-react';
import { BudgetTemplateSelector } from '@/components/budgets/BudgetTemplateSelector';
import { toast } from 'sonner';

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999999, 'Amount seems too large'),
  period: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  rolloverEnabled: z.boolean().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.period === 'custom') {
    // Require both dates for custom period
    if (!data.startDate || !data.endDate) {
      return false;
    }
    
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }
    
    // Check if end date is after start date
    if (start >= end) {
      return false;
    }
    
    // Check if start date is not too far in the past (max 1 year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (start < oneYearAgo) {
      return false;
    }
    
    // Check if end date is not too far in the future (max 5 years)
    const fiveYearsFromNow = new Date();
    fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
    if (end > fiveYearsFromNow) {
      return false;
    }
    
    // Check if custom period is reasonable (not too long)
    const maxDays = 365 * 2; // 2 years max
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      return false;
    }
    
    // Check if custom period is not too short (min 1 day)
    if (daysDiff < 1) {
      return false;
    }
  }
  
  return true;
}, {
  message: 'Invalid date range. For custom periods, ensure dates are valid, end date is after start date, and the range is reasonable (1 day to 2 years).',
  path: ['startDate']
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  budget?: Budget;
  onSubmit: (data: BudgetFormData) => void;
  onCancel: () => void;
}

const periodOptions: Array<SelectorOption<'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>> = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'For short-term spending control',
    icon: CalendarDays,
  },
  {
    value: 'biweekly',
    label: 'Bi-weekly',
    description: 'Every two weeks budgeting',
    icon: CalendarClock,
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Traditional monthly budgeting',
    icon: Calendar,
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
    description: '3-month financial planning',
    icon: CalendarRange,
  },
  {
    value: 'yearly',
    label: 'Yearly',
    description: 'Annual financial planning',
    icon: CalendarIcon,
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Set your own date range',
    icon: Calendar,
  },
];

export function BudgetForm({ budget, onSubmit, onCancel }: BudgetFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { categories, loading } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BudgetTemplate | undefined>(undefined);
  const [useTemplate, setUseTemplate] = useState(false);
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      category: budget?.category || '',
      amount: budget?.amount || 0,
      period: budget?.period || 'monthly',
      startDate: budget?.startDate || '',
      endDate: budget?.endDate || '',
      rolloverEnabled: budget?.rolloverEnabled || false,
      notes: budget?.notes || '',
    },
  });

  // Watch the period value from the form
  const selectedPeriod = form.watch('period');

  // Update form values when budget prop changes
  useEffect(() => {
    if (budget) {
      console.log('Initializing form with budget data:', budget);
      form.reset({
        category: budget.category,
        amount: budget.amount,
        period: budget.period,
        startDate: budget.startDate || '',
        endDate: budget.endDate || '',
        rolloverEnabled: budget.rolloverEnabled || false,
        notes: budget.notes || '',
      });
    }
  }, [budget, form]);

  // Handle template selection
  const handleTemplateSelect = (template: BudgetTemplate) => {
    setSelectedTemplate(template);
    setUseTemplate(true);
    form.setValue('period', template.period);
    
    // If template has allocations, set the total budget amount
    if (template.totalBudget > 0) {
      form.setValue('amount', template.totalBudget);
    }

    // Try to find and set the first allocation's category by name
    if (template.allocations.length > 0) {
      const firstAllocation = template.allocations[0];
      const matchingCategory = expenseCategories.find(
        cat => cat.name.toLowerCase() === firstAllocation.categoryName.toLowerCase()
      );
      if (matchingCategory) {
        form.setValue('category', matchingCategory.id);
        // Set the amount for this specific allocation
        const allocationAmount = (template.totalBudget * firstAllocation.percentage) / 100;
        form.setValue('amount', allocationAmount);
      }
    }
  };

  // Debug: Watch for period changes
  useEffect(() => {
    console.log('Period changed to:', selectedPeriod);
  }, [selectedPeriod]);

  // Clear errors when period changes
  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      form.clearErrors(['startDate', 'endDate']);
    }
  }, [selectedPeriod, form]);

  const handleSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Debug: Log the form data being submitted
    console.log('Submitting budget data:', {
      isEdit: !!budget,
      data: {
        ...data,
        category: data.category,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate
      }
    });
    
    try {
      // Validate category exists
      const selectedCategory = categories.find(c => c.id === data.category);
      if (!selectedCategory) {
        form.setError('category', { message: 'Selected category not found' });
        return;
      }

      // Validate category type (should be expense for budgets)
      if (selectedCategory.type !== 'expense') {
        form.setError('category', { message: 'Budgets can only be created for expense categories' });
        return;
      }

      // Additional validation for custom periods
      if (data.period === 'custom' && data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        
        // Ensure start date is not in the past for new budgets
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!budget && start < today) {
          form.setError('startDate', { message: 'Start date cannot be in the past for new budgets' });
          return;
        }
      }

      await onSubmit(data);
      console.log('Budget submitted successfully');
      // Only reset form on successful creation, not edit
      if (!budget) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting budget:', error);
      let errorMessage = 'Failed to save budget. Please try again.';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('duplicate') || error.message.includes('already exists')) {
          errorMessage = 'A budget for this category already exists. Please edit the existing budget instead.';
        } else if (error.message.includes('validation')) {
          errorMessage = 'Invalid budget data. Please check your inputs and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSubmitError(errorMessage);
      form.setError('root', { message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  // Show loading state while categories are loading
  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{budget ? 'Edit Budget' : 'Create Budget'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading categories...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if no expense categories available
  if (expenseCategories.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{budget ? 'Edit Budget' : 'Create Budget'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-4">
              No expense categories found. You need to create an expense category before creating a budget.
            </p>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{budget ? 'Edit Budget' : 'Create Budget'}</CardTitle>
        {!budget && (
          <p className="text-sm text-muted-foreground">
            Start with a template for quick setup or create a custom budget
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {!budget && (
          <>
            {/* Quick Start Templates Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Quick Start Templates
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a pre-configured template to get started quickly
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTemplate(undefined);
                    setUseTemplate(false);
                  }}
                >
                  Skip to Manual
                </Button>
              </div>
              
              <BudgetTemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
              />
              
              {/* Show selected template details */}
              {selectedTemplate && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{selectedTemplate.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(undefined);
                          setUseTemplate(false);
                          form.setValue('amount', 0);
                        }}
                      >
                        Clear
                      </Button>
                      {selectedTemplate.allocations.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            // Apply template by setting the first allocation
                            const firstAllocation = selectedTemplate.allocations[0];
                            const matchingCategory = expenseCategories.find(
                              cat => cat.name.toLowerCase() === firstAllocation.categoryName.toLowerCase()
                            );
                            if (matchingCategory) {
                              form.setValue('category', matchingCategory.id);
                              const allocationAmount = (selectedTemplate.totalBudget * firstAllocation.percentage) / 100;
                              form.setValue('amount', allocationAmount);
                              toast.success(`Applied ${firstAllocation.categoryName} allocation from template`);
                            } else {
                              toast.error(`Category "${firstAllocation.categoryName}" not found. Please create it first.`);
                            }
                          }}
                        >
                          Apply First Allocation
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {selectedTemplate.allocations.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Template Allocations:</p>
                      <div className="grid gap-2">
                        {selectedTemplate.allocations.map((allocation, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                            <div>
                              <span className="font-medium">{allocation.categoryName}</span>
                              <span className="text-muted-foreground ml-2">- {allocation.description}</span>
                            </div>
                            <span className="font-semibold text-primary">
                              {allocation.percentage}% (${Math.round(selectedTemplate.totalBudget * allocation.percentage / 100).toLocaleString()})
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Total Budget: ${selectedTemplate.totalBudget.toLocaleString()} per {selectedTemplate.period}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or create custom budget
                </span>
              </div>
            </div>
          </>
        )}

        {/* Manual Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {submitError && (
              <div 
                className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-start gap-2">
                  <span className="font-medium" aria-hidden="true">Error:</span>
                  <span>{submitError}</span>
                </div>
              </div>
            )}
            {form.formState.errors.root && !submitError && (
              <div 
                className="p-3 text-sm text-destructive bg-destructive/10 rounded-md"
                role="alert"
                aria-live="polite"
              >
                {form.formState.errors.root.message}
              </div>
            )}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="category-select">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger id="category-select" aria-describedby={form.formState.errors.category ? 'category-error' : undefined}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {form.formState.errors.category && (
                    <span id="category-error" className="sr-only">
                      Category error: {form.formState.errors.category.message}
                    </span>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="budget-amount">Budget Amount ({getCurrencySymbol(currency)})</FormLabel>
                  <FormControl>
                    <Input
                      id="budget-amount"
                      type="number"
                      step="0.01"
                      placeholder={`0.00 ${getCurrencySymbol(currency)}`}
                      aria-describedby={form.formState.errors.amount ? 'amount-error' : undefined}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                  {field.value && field.value > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {formatCurrency(field.value)}
                    </p>
                  )}
                  {form.formState.errors.amount && (
                    <span id="amount-error" className="sr-only">
                      Amount error: {form.formState.errors.amount.message}
                    </span>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="period-selector">Period</FormLabel>
                  <FormControl>
                    <PopupSelector<'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom'>
                      id="period-selector"
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      options={periodOptions}
                      placeholder="Select period"
                      aria-describedby={form.formState.errors.period ? 'period-error' : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                  {form.formState.errors.period && (
                    <span id="period-error" className="sr-only">
                      Period error: {form.formState.errors.period.message}
                    </span>
                  )}
                </FormItem>
              )}
            />

            {/* Custom Date Range Fields */}
            {selectedPeriod === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="start-date">Start Date</FormLabel>
                      <FormControl>
                        <Input
                          id="start-date"
                          type="date"
                          placeholder="Start date"
                          aria-describedby={form.formState.errors.startDate ? 'start-date-error' : undefined}
                          {...field}
                          min={!budget ? new Date().toISOString().split('T')[0] : undefined}
                          max={new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                      {form.formState.errors.startDate && (
                        <span id="start-date-error" className="sr-only">
                          Start date error: {form.formState.errors.startDate.message}
                        </span>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="end-date">End Date</FormLabel>
                      <FormControl>
                        <Input
                          id="end-date"
                          type="date"
                          placeholder="End date"
                          aria-describedby={form.formState.errors.endDate ? 'end-date-error' : undefined}
                          {...field}
                          min={field.value ? new Date(new Date(field.value).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined}
                          max={new Date(Date.now() + 365 * 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                      {form.formState.errors.endDate && (
                        <span id="end-date-error" className="sr-only">
                          End date error: {form.formState.errors.endDate.message}
                        </span>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Rollover Option */}
            <FormField
              control={form.control}
              name="rolloverEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Rollover</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Roll over unused budget to the next period
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="budget-notes">Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      id="budget-notes"
                      placeholder="Add any notes about this budget..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : budget ? (
                  'Update Budget'
                ) : (
                  'Create Budget'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
