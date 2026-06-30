'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { createTransactionSchema } from '@/lib/schema';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Plus, Loader2, Calendar } from 'lucide-react';
import { ButtonLoadingState, FormLoadingState } from '@/components/ui/EnhancedLoadingState';
import { useLoadingState } from '@/hooks/useLoadingState';

const formSchema = createTransactionSchema.extend({
  date: z.string().min(1, 'Date is required'),
});

type FormData = z.infer<typeof formSchema>;

// Quick add presets
const expenseAmounts = [5, 10, 15, 25, 50, 100];
const incomeAmounts = [100, 250, 500, 1000, 2000, 5000];
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

interface TransactionFormProps {
  onSubmit: (data: Omit<FormData, 'tags'>) => void;
  trigger?: React.ReactNode;
  initialData?: Partial<FormData>;
  onDialogClose?: () => void;
}

const TransactionFormErrorFallback = ({ error, reset }: { error?: Error; reset: () => void }) => (
  <div className="p-4 text-center">
    <p className="text-red-500">Something went wrong with the transaction form. Please try again.</p>
    <Button onClick={reset} className="mt-2" variant="outline">
      Try Again
    </Button>
  </div>
);

export function TransactionForm({ onSubmit, trigger, initialData, onDialogClose }: TransactionFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { categories, loading } = useCategories();
  const { accounts } = useAccounts();

  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasOpenedFromInitialData, setHasOpenedFromInitialData] = useState(false);
  
  const { 
    isLoading: isSubmitting, 
    error: submitError, 
    startLoading: startSubmitting, 
    stopLoading: stopSubmitting, 
    setError: setSubmitError,
    reset: resetSubmitState 
  } = useLoadingState();

  // Set client-side flag for SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialData?.amount || 0,
      type: initialData?.type || 'expense',
      category: initialData?.category || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      description: initialData?.description || '',
      account: initialData?.account || '',
      tags: initialData?.tags || [],
    },
  });

  // Quick add helpers
  const setQuickAmount = useCallback((amount: number) => {
    try {
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      form.setValue('amount', amount);
      // Clear any existing error for this field
      form.clearErrors('amount');
    } catch (error) {
      console.error('Error setting quick amount:', error);
    }
  }, [form]);

  const setQuickDescription = useCallback((description: string) => {
    try {
      if (!description || description.trim().length === 0) {
        throw new Error('Description cannot be empty');
      }
      form.setValue('description', description);
      // Clear any existing error for this field
      form.clearErrors('description');
    } catch (error) {
      console.error('Error setting quick description:', error);
    }
  }, [form]);

  const setToday = useCallback(() => {
    form.setValue('date', new Date().toISOString().split('T')[0]);
  }, [form]);

  const setYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    form.setValue('date', yesterday.toISOString().split('T')[0]);
  }, [form]);

  const transactionType = form.watch('type');
  const filteredCategories = categories.filter(cat => cat.type === transactionType);
  useEffect(() => {
    if (initialData && !hasOpenedFromInitialData) {
      console.log('TransactionForm: Setting initialData', initialData);
      setOpen(true);
      setHasOpenedFromInitialData(true);
      
      // Small delay to ensure form is fully initialized
      const timer = setTimeout(() => {
        // Use setValue instead of reset for better control
        if (initialData.amount !== undefined) {
          console.log('Setting amount to:', initialData.amount);
          form.setValue('amount', initialData.amount);
        }
        if (initialData.type !== undefined) {
          console.log('Setting type to:', initialData.type);
          form.setValue('type', initialData.type);
        }
        if (initialData.category !== undefined) {
          console.log('Setting category to:', initialData.category);
          form.setValue('category', initialData.category);
        }
        if (initialData.date !== undefined) {
          console.log('Setting date to:', initialData.date);
          form.setValue('date', initialData.date);
        }
        if (initialData.description !== undefined) {
          console.log('Setting description to:', initialData.description);
          form.setValue('description', initialData.description);
        }
        if (initialData.account !== undefined) {
          console.log('Setting account to:', initialData.account);
          form.setValue('account', initialData.account);
        }
        if (initialData.tags !== undefined) {
          console.log('Setting tags to:', initialData.tags);
          form.setValue('tags', initialData.tags);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [initialData, form]);

  // Reset the flag when dialog closes without initial data
  useEffect(() => {
    if (!open && !initialData) {
      setHasOpenedFromInitialData(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (data: FormData) => {
    startSubmitting('Submitting transaction...');
    try {
      // Validate data before submission
      if (!data.amount || data.amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      if (!data.description || data.description.trim().length === 0) {
        throw new Error('Description is required');
      }
      if (!data.category) {
        throw new Error('Category is required');
      }
      if (!data.date) {
        throw new Error('Date is required');
      }

      await onSubmit(data);
      // Delay form reset to allow parent to clear template data first
      setTimeout(() => {
        form.reset();
        setOpen(false);
        resetSubmitState();
      }, 100);
    } catch (error) {
      console.error('Error submitting transaction:', error);
      setSubmitError(error instanceof Error ? error : new Error('Failed to submit transaction'));
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to add transaction. Please try again.';
      // You could add a toast notification here if needed
      // Don't close dialog on error - let user fix the issue
      return;
    }
  };

  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Transaction
    </Button>
  );

  return (
    <ErrorBoundary fallback={TransactionFormErrorFallback}>
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setHasOpenedFromInitialData(false);
          if (onDialogClose) {
            onDialogClose();
          }
        }
      }}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Add a new transaction to your records
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: { value: string; onChange: (value: string) => void } }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }: { field: { value: number; onChange: (value: number) => void } }) => (
                <FormItem>
                  <FormLabel>Amount ({getCurrencySymbol(currency)})</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={`0.00 ${getCurrencySymbol(currency)}`}
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
                  {/* Quick Amount Buttons */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(transactionType === 'income' ? incomeAmounts : expenseAmounts).map((amount) => (
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredCategories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                  {/* Quick Date Buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={setToday}
                      className="text-xs"
                    >
                      <Calendar className="w-3 h-3 mr-1" />
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
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                  {/* Quick Description Suggestions */}
                  <div className="flex flex-wrap gap-2 mt-2">
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="account"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Account (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <ButtonLoadingState
                isLoading={isSubmitting}
                loadingText="Adding..."
                onClick={form.handleSubmit(handleSubmit)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </ButtonLoadingState>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </ErrorBoundary>
  );
}
