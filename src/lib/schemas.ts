/**
 * Zod schemas for comprehensive data validation
 */

import { z } from 'zod';

// Base schemas
export const DateSchema = z.string().ref((date) => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime()) && parsed.toISOString() === date;
}, { message: 'Invalid date format' });

export const AmountSchema = z.number().ref((amount) => {
  return !isNaN(amount) && isFinite(amount);
}, { message: 'Amount must be a valid number' });

export const CurrencyCodeSchema = z.string().length(3).length(3).regex(/^[A-Z]{3}$/, {
  message: 'Currency code must be 3 uppercase letters'
});

export const CategorySchema = z.object({
  id: z.string().uuid({ message: 'Invalid category ID' }),
  name: z.string().min(1).max(50, { message: 'Category name must be 1-50 characters' }),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' }),
  icon: z.string().optional(),
  budget: z.number().positive().optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema
});

export const TransactionSchema = z.object({
  id: z.string().uuid({ message: 'Invalid transaction ID' }),
  date: DateSchema,
  description: z.string().min(1).max(500, { message: 'Description must be 1-500 characters' }),
  amount: AmountSchema,
  category: z.string().min(1).max(50, { message: 'Category must be 1-50 characters' }),
  account: z.string().optional(),
  tags: z.array(z.string().max(20)).optional(),
  type: z.enum(['income', 'expense'], { message: 'Type must be income or expense' }),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  deletedAt: DateSchema.optional()
});

export const BudgetSchema = z.object({
  id: z.string().uuid({ message: 'Invalid budget ID' }),
  name: z.string().min(1).max(100, { message: 'Budget name must be 1-100 characters' }),
  category: z.string().min(1).max(50, { message: 'Category must be 1-50 characters' }),
  amount: z.number().positive({ message: 'Budget amount must be positive' }),
  period: z.enum(['monthly', 'yearly'], { message: 'Period must be monthly or yearly' }),
  startDate: DateSchema,
  endDate: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  isArchived: z.boolean().optional(),
  archivedAt: DateSchema.optional(),
  rolloverEnabled: z.boolean().optional(),
  rolloverAmount: z.number().optional(),
  notes: z.string().optional()
});

export const AccountSchema = z.object({
  id: z.string().uuid({ message: 'Invalid account ID' }),
  name: z.string().min(1).max(100, { message: 'Account name must be 1-100 characters' }),
  type: z.enum(['checking', 'savings', 'credit', 'investment'], { 
    message: 'Account type must be checking, savings, credit, or investment' 
  }),
  balance: AmountSchema,
  currency: CurrencyCodeSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema
});

// Import/Export schemas
export const ImportTransactionSchema = z.object({
  date: z.string().ref((date) => {
    // Accept multiple date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // M/D/YYYY
      /^\d{1,2}-\d{1,2}-\d{2,4}$/, // M-D-YYYY
    ];
    
    return formats.some(format => format.test(date));
  }, { message: 'Invalid date format. Use YYYY-MM-DD, MM/DD/YYYY, M/D/YYYY, or M-D-YYYY' }),
  
  description: z.string().min(1).max(500, { message: 'Description must be 1-500 characters' }),
  amount: AmountSchema,
  category: z.string().min(1).max(50, { message: 'Category must be 1-50 characters' }),
  account: z.string().optional(),
  type: z.enum(['income', 'expense'], { message: 'Type must be income or expense' }),
  tags: z.string().transform((tags) => {
    if (!tags) return [];
    return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }).optional()
});

export const CSVImportSchema = z.object({
  transactions: z.array(ImportTransactionSchema).min(1, { 
    message: 'CSV must contain at least one transaction' 
  }),
  headers: z.array(z.string()).optional()
});

// Settings schemas
export const ThemeSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system'], { 
    message: 'Theme must be light, dark, or system' 
  }),
  accent: z.string().regex(/^[a-z]+$/, { 
    message: 'Accent must be a valid color name' 
  }),
  reducedMotion: z.boolean().optional(),
  highContrast: z.boolean().optional()
});

export const CurrencySettingsSchema = z.object({
  currency: CurrencyCodeSchema,
  dateFormat: z.enum([
    'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 
    'M/D/YYYY', 'D-M-YYYY', 'YYYY/MM/DD'
  ], { message: 'Invalid date format' }),
  numberFormat: z.enum([
    'en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP', 'zh-CN'
  ], { message: 'Invalid number format' })
});

export const NotificationSettingsSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  push: z.boolean(),
  emailNotifications: z.boolean(),
  budgetAlerts: z.boolean(),
  transactionAlerts: z.boolean(),
  weeklyReports: z.boolean(),
  monthlyReports: z.boolean()
});

// API request/response schemas
export const CreateTransactionRequestSchema = z.object({
  transaction: TransactionSchema.omit({ id: true, createdAt: true, updatedAt: true })
});

export const UpdateTransactionRequestSchema = z.object({
  id: z.string().uuid(),
  transaction: TransactionSchema.omit({ id: true, createdAt: true, updatedAt: true }).partial()
});

export const TransactionQuerySchema = z.object({
  category: z.string().optional(),
  account: z.string().optional(),
  type: z.enum(['income', 'expense', 'all']).default('all'),
  startDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  search: z.string().optional(),
  limit: z.number().positive().max(1000).default(50),
  offset: z.number().nonnegative().default(0)
});

export const BudgetQuerySchema = z.object({
  category: z.string().optional(),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  year: z.number().int().min(2020).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional()
});

// Error response schemas
export const ErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  field: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string().optional()
});

export const ValidationErrorSchema = z.object({
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
    value: z.any().optional()
  })),
  warnings: z.array(z.object({
    field: z.string(),
    message: z.string(),
    code: z.string().optional(),
    value: z.any().optional()
  })).optional()
});

// Sync schemas
export const SyncRequestSchema = z.object({
  lastSync: DateSchema.optional(),
  deviceId: z.string().uuid().optional(),
  changes: z.array(z.object({
    type: z.enum(['create', 'update', 'delete']),
    entityType: z.enum(['transaction', 'category', 'budget', 'account']),
    entityId: z.string().uuid(),
    data: z.any(),
    timestamp: DateSchema
  }))
});

export const SyncResponseSchema = z.object({
  success: z.boolean(),
  conflicts: z.array(z.object({
    entityType: z.enum(['transaction', 'category', 'budget', 'account']),
    entityId: z.string().uuid(),
    localVersion: z.any(),
    remoteVersion: z.any(),
    resolution: z.enum(['local_wins', 'remote_wins', 'manual', 'merge'])
  })).optional(),
  errors: z.array(ErrorSchema).optional(),
  lastSync: DateSchema
});

// Export schemas
export const ExportRequestSchema = z.object({
  format: z.enum(['json', 'csv', 'pdf']),
  includeDeleted: z.boolean().default(false),
  dateRange: z.object({
    start: DateSchema.optional(),
    end: DateSchema.optional(),
    preset: z.enum(['all', 'this_month', 'last_month', 'this_year', 'last_year']).default('all')
  }),
  categories: z.array(z.string()).optional(),
  accounts: z.array(z.string()).optional()
});

// Validation utilities
export class DataValidator {
  static validateTransaction(transaction: unknown): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      const data = TransactionSchema.parse(transaction);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  static validateCategory(category: unknown): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      const data = CategorySchema.parse(category);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  static validateBudget(budget: unknown): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      const data = BudgetSchema.parse(budget);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  static validateAccount(account: unknown): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      const data = AccountSchema.parse(account);
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  static validateImportData(data: unknown, format: 'json' | 'csv'): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      if (format === 'json') {
        const transactions = z.array(TransactionSchema).parse(data);
        return { success: true, data: { transactions } };
      } else if (format === 'csv') {
        const csvData = CSVImportSchema.parse(data);
        return { success: true, data: csvData };
      } else {
        return { 
          success: false, 
          errors: [{ code: 'INVALID_FORMAT', message: 'Unsupported import format' }] 
        };
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  static validateSettings(settings: unknown): {
    success: boolean;
    data?: any;
    errors?: z.ZodIssue[];
  } {
    try {
      const data = z.object({
        theme: ThemeSettingsSchema.optional(),
        currency: CurrencySettingsSchema.optional(),
        notifications: NotificationSettingsSchema.optional()
      }).parse(settings);
      
      return { success: true, data };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          success: false, 
          errors: error.errors 
        };
      }
      return { 
        success: false, 
        errors: [{ code: 'VALIDATION_ERROR', message: 'Unknown validation error' }] 
      };
    }
  }

  // Sanitization utilities
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JS
      .replace(/['"]/g, '') // Remove potential quotes
      .substring(0, 1000); // Limit length
  }

  static sanitizeNumber(input: any): number | null {
    const num = parseFloat(input);
    return isNaN(num) ? null : num;
  }

  static sanitizeDate(input: string): string | null {
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date.toISOString();
  }

  // Format validation
  static validateDateFormat(format: string): boolean {
    const validFormats = [
      'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY',
      'M/D/YYYY', 'D-M-YYYY', 'YYYY/MM/DD'
    ];
    return validFormats.includes(format);
  }

  static validateCurrencyCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  static validateHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }
}

// Export all schemas for use in components
export {
  TransactionSchema,
  CategorySchema,
  BudgetSchema,
  AccountSchema,
  ThemeSettingsSchema,
  CurrencySettingsSchema,
  NotificationSettingsSchema,
  CreateTransactionRequestSchema,
  UpdateTransactionRequestSchema,
  TransactionQuerySchema,
  BudgetQuerySchema,
  ErrorSchema,
  ValidationErrorSchema,
  SyncRequestSchema,
  SyncResponseSchema,
  ExportRequestSchema,
  ImportTransactionSchema,
  CSVImportSchema,
  DataValidator
};
