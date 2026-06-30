import { TransactionTemplate } from '@/lib/types';

export interface TemplateValidationError {
  field: string;
  message: string;
}

export function validateTemplateData(data: Partial<TransactionTemplate>): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Template name is required' });
  } else if (data.name.length > 100) {
    errors.push({ field: 'name', message: 'Template name must be less than 100 characters' });
  }

  // Amount validation
  if (data.amount === undefined || data.amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required' });
  } else if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  } else if (data.amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
  } else if (data.amount > 999999999.99) {
    errors.push({ field: 'amount', message: 'Amount is too large' });
  }

  // Type validation
  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.push({ field: 'type', message: 'Transaction type must be income or expense' });
  }

  // Category validation
  if (!data.category || data.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Category is required' });
  } else if (data.category.length > 50) {
    errors.push({ field: 'category', message: 'Category name must be less than 50 characters' });
  }

  // Description validation (optional)
  if (data.description && data.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }

  // Account validation (optional)
  if (data.account && data.account.length > 100) {
    errors.push({ field: 'account', message: 'Account name must be less than 100 characters' });
  }

  // Tags validation (optional)
  if (data.tags) {
    if (!Array.isArray(data.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array' });
    } else if (data.tags.length > 10) {
      errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
    } else {
      const invalidTags = data.tags.filter(tag => 
        typeof tag !== 'string' || 
        tag.trim().length === 0 || 
        tag.length > 30
      );
      if (invalidTags.length > 0) {
        errors.push({ field: 'tags', message: 'Tags must be non-empty strings less than 30 characters' });
      }
    }
  }

  // Icon validation (optional)
  if (data.icon && typeof data.icon !== 'string') {
    errors.push({ field: 'icon', message: 'Icon must be a string' });
  }

  // Color validation (optional)
  if (data.color) {
    if (typeof data.color !== 'string') {
      errors.push({ field: 'color', message: 'Color must be a string' });
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
      errors.push({ field: 'color', message: 'Color must be a valid hex color code' });
    }
  }

  return errors;
}

export function sanitizeTags(tags: string): string[] {
  if (!tags || typeof tags !== 'string') {
    return [];
  }

  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0 && tag.length <= 30)
    .slice(0, 10); // Limit to 10 tags
}

export function parseAmount(amount: string): number | null {
  if (!amount || typeof amount !== 'string') {
    return null;
  }

  // Remove currency symbols and whitespace
  const cleanAmount = amount.replace(/[$,\s]/g, '');
  
  // Parse as float
  const parsed = parseFloat(cleanAmount);
  
  // Validate
  if (isNaN(parsed) || parsed <= 0 || parsed > 999999999.99) {
    return null;
  }

  return parsed;
}

export function validateTemplateUsage(template: TransactionTemplate): TemplateValidationError[] {
  const errors: TemplateValidationError[] = [];

  // Check if template has all required fields for usage
  if (!template.amount || template.amount <= 0) {
    errors.push({ field: 'amount', message: 'Template has invalid amount for usage' });
  }

  if (!template.category) {
    errors.push({ field: 'category', message: 'Template has no category for usage' });
  }

  if (!template.type) {
    errors.push({ field: 'type', message: 'Template has no transaction type' });
  }

  return errors;
}
