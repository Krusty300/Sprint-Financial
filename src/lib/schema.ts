import { z } from 'zod';

export const transactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  account: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Schema for validating transactions before adding (without ID)
export const transactionInputSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  account: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Category name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().min(1, 'Icon is required'),
  type: z.enum(['income', 'expense']),
});

// Base budget schema without refinements (for .omit() to work)
export const budgetBaseSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Refined budget schema for validation
export const budgetSchema = budgetBaseSchema.refine((data) => {
  // For custom periods, both dates are required
  if (data.period === 'custom') {
    return !!(data.startDate && data.endDate);
  }
  return true;
}, {
  message: 'Custom periods require both start and end dates',
  path: ['startDate']
});

export const accountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['cash', 'bank', 'credit', 'mobile']),
  balance: z.number(),
  currency: z.string().default('USD'),
});

export const createTransactionSchema = transactionSchema.omit({ id: true });
export const createCategorySchema = categorySchema.omit({ id: true });
export const createBudgetSchema = budgetBaseSchema.omit({ id: true });
export const createAccountSchema = accountSchema.omit({ id: true });
