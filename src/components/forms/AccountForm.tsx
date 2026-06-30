'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PopupSelector, SelectorOption } from '@/components/ui/popup-selector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account } from '@/lib/types';
import { CreditCard, Wallet, Smartphone, DollarSign, Loader2 } from 'lucide-react';

const accountSchema = z.object({
  name: z.string()
    .min(1, 'Account name is required')
    .max(50, 'Name too long (max 50 characters)')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  type: z.enum(['cash', 'bank', 'credit', 'mobile']),
  balance: z.number()
    .min(-999999999, 'Balance too low')
    .max(999999999, 'Balance too high'),
  currency: z.string()
    .min(1, 'Currency is required')
    .max(3, 'Invalid currency (max 3 characters)')
    .regex(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: AccountFormData) => void;
  onCancel: () => void;
  existingAccounts?: Account[];
  isSubmitting?: boolean;
}

const accountTypes: SelectorOption<'cash' | 'bank' | 'credit' | 'mobile'>[] = [
  { value: 'cash', label: 'Cash', description: 'Physical cash and wallets' },
  { value: 'bank', label: 'Bank Account', description: 'Checking and savings accounts' },
  { value: 'credit', label: 'Credit Card', description: 'Credit and debit cards' },
  { value: 'mobile', label: 'Mobile Wallet', description: 'Digital payment apps' },
];

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
];

export function AccountForm({ account, onSubmit, onCancel, existingAccounts = [], isSubmitting: externalIsSubmitting = false }: AccountFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || '',
      type: account?.type || 'bank',
      balance: account?.balance || 0,
      currency: account?.currency || 'USD',
    },
  });

  // Use external isSubmitting if provided, otherwise use local state
  const submitting = externalIsSubmitting || isSubmitting;

  // Custom validation for account name uniqueness
  const validateAccountName = (name: string) => {
    if (!name) return true;
    
    const isDuplicate = existingAccounts.some(existingAccount => {
      // Skip the current account when editing
      if (account && existingAccount.id === account.id) {
        return false;
      }
      // Case-insensitive comparison
      return existingAccount.name.toLowerCase() === name.toLowerCase();
    });

    if (isDuplicate) {
      return 'An account with this name already exists';
    }
    
    return true;
  };

  const handleSubmit = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      // Validate account name uniqueness
      const nameValidation = validateAccountName(data.name);
      if (nameValidation !== true) {
        form.setError('name', { type: 'manual', message: nameValidation as string });
        setIsSubmitting(false);
        return;
      }
      
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error('Error submitting account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = form.watch('type');
  const typeInfo = accountTypes.find(t => t.value === selectedType);
  const TypeIcon = typeInfo?.icon || Wallet;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          {account ? 'Edit Account' : 'Create Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Main Checking, Visa Card"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <FormControl>
                    <PopupSelector<'cash' | 'bank' | 'credit' | 'mobile'>
                      value={field.value}
                      onValueChange={field.onChange}
                      options={accountTypes}
                      placeholder="Select account type"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Current Balance ({getCurrencySymbol(currency)})
                    {selectedType === 'credit' && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (positive = debt, negative = credit)
                      </span>
                    )}
                  </FormLabel>
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
                  {field.value && field.value !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      Preview: {formatCurrency(field.value)}
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {account ? 'Update' : 'Create'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
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
