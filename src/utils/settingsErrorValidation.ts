/**
 * Comprehensive error validation utilities for settings operations
 */

import { logSettingsError, logSettingsWarning, logSettingsInfo, withPerformanceMonitoring } from './errorMonitoring';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

export interface ErrorAnalysis {
  timestamp: Date;
  category: 'theme' | 'currency' | 'import' | 'export' | 'data' | 'general';
  error: ValidationError;
  context?: any;
  resolved: boolean;
}

class SettingsErrorValidator {
  private errorHistory: ErrorAnalysis[] = [];
  private maxHistorySize = 100;

  // Theme validation
  validateThemeChange(themeValue: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Check if theme value is valid
    const validThemes = ['light', 'dark', 'system'];
    if (!validThemes.includes(themeValue)) {
      errors.push({
        field: 'theme',
        message: `Invalid theme value: ${themeValue}. Must be one of: ${validThemes.join(', ')}`,
        severity: 'error',
        code: 'INVALID_THEME'
      });
    }

    // Check system preference support
    if (themeValue === 'system' && !window.matchMedia) {
      warnings.push({
        field: 'theme',
        message: 'System theme detection may not be supported in this browser',
        severity: 'warning',
        code: 'SYSTEM_THEME_UNSUPPORTED'
      });
    }

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      info.push({
        field: 'theme',
        message: 'User prefers reduced motion - consider minimal animations',
        severity: 'info',
        code: 'REDUCED_MOTION_PREFERENCE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Currency validation
  validateCurrencySettings(currency: string, dateFormat: string, numberFormat: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validate currency code
    if (!currency || currency.length !== 3 || !/^[A-Z]{3}$/.test(currency)) {
      errors.push({
        field: 'currency',
        message: 'Invalid currency code. Must be a 3-letter ISO code (e.g., USD, EUR)',
        severity: 'error',
        code: 'INVALID_CURRENCY_CODE'
      });
    }

    // Validate date format
    const validDateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'];
    if (!validDateFormats.includes(dateFormat)) {
      errors.push({
        field: 'dateFormat',
        message: `Invalid date format. Must be one of: ${validDateFormats.join(', ')}`,
        severity: 'error',
        code: 'INVALID_DATE_FORMAT'
      });
    }

    // Validate number format
    const validNumberFormats = ['1,234.56', '1.234,56', '1234.56', '1234,56'];
    if (!validNumberFormats.includes(numberFormat)) {
      errors.push({
        field: 'numberFormat',
        message: `Invalid number format. Must be one of: ${validNumberFormats.join(', ')}`,
        severity: 'error',
        code: 'INVALID_NUMBER_FORMAT'
      });
    }

    // Check for locale consistency
    const locale = navigator.language;
    if (locale.startsWith('en') && numberFormat === '1.234,56') {
      warnings.push({
        field: 'numberFormat',
        message: 'Number format may not match your browser locale',
        severity: 'warning',
        code: 'LOCALE_MISMATCH'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Import validation
  validateImportData(file: File, content: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // File size validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
        severity: 'error',
        code: 'FILE_TOO_LARGE'
      });
    }

    // File type validation
    const validExtensions = ['.json', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      errors.push({
        field: 'file',
        message: `Invalid file type. Supported formats: ${validExtensions.join(', ')}`,
        severity: 'error',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Content validation
    if (!content || content.trim().length === 0) {
      errors.push({
        field: 'content',
        message: 'File is empty or contains only whitespace',
        severity: 'error',
        code: 'EMPTY_FILE'
      });
    }

    // JSON specific validation
    if (fileExtension === '.json') {
      try {
        const data = JSON.parse(content);
        if (!data || typeof data !== 'object') {
          errors.push({
            field: 'content',
            message: 'Invalid JSON structure. Expected an object',
            severity: 'error',
            code: 'INVALID_JSON_STRUCTURE'
          });
        } else {
          // Check for required fields
          const requiredFields = ['transactions', 'categories', 'accounts'];
          const missingFields = requiredFields.filter(field => !data[field]);
          if (missingFields.length > 0) {
            warnings.push({
              field: 'content',
              message: `Missing optional fields: ${missingFields.join(', ')}`,
              severity: 'warning',
              code: 'MISSING_FIELDS'
            });
          }
        }
      } catch (parseError) {
        errors.push({
          field: 'content',
          message: `JSON parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
          severity: 'error',
          code: 'JSON_PARSE_ERROR'
        });
      }
    }

    // CSV specific validation
    if (fileExtension === '.csv') {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        errors.push({
          field: 'content',
          message: 'CSV must have at least a header and one data row',
          severity: 'error',
          code: 'INSUFFICIENT_CSV_DATA'
        });
      } else {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const requiredHeaders = ['date', 'description', 'amount'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          errors.push({
            field: 'content',
            message: `CSV missing required headers: ${missingHeaders.join(', ')}`,
            severity: 'error',
            code: 'MISSING_CSV_HEADERS'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Export validation
  validateExportSettings(format: string, dateRange: string, includeDeleted: boolean): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Validate format
    const validFormats = ['json', 'csv'];
    if (!validFormats.includes(format)) {
      errors.push({
        field: 'format',
        message: `Invalid export format. Must be one of: ${validFormats.join(', ')}`,
        severity: 'error',
        code: 'INVALID_EXPORT_FORMAT'
      });
    }

    // Validate date range
    const validRanges = ['all', 'current', 'year', 'custom'];
    if (!validRanges.includes(dateRange)) {
      errors.push({
        field: 'dateRange',
        message: `Invalid date range. Must be one of: ${validRanges.join(', ')}`,
        severity: 'error',
        code: 'INVALID_DATE_RANGE'
      });
    }

    // Warnings for large exports
    if (format === 'csv' && includeDeleted) {
      warnings.push({
        field: 'includeDeleted',
        message: 'CSV export does not include deleted items. Use JSON format for complete data.',
        severity: 'warning',
        code: 'CSV_DELETED_LIMITATION'
      });
    }

    // Storage space warning
    const storageUsed = JSON.stringify(localStorage).length;
    const storageAvailable = 5 * 1024 * 1024; // 5MB estimate
    if (storageUsed > storageAvailable * 0.7) {
      warnings.push({
        field: 'storage',
        message: 'Storage space is running low. Consider cleaning up old data.',
        severity: 'warning',
        code: 'LOW_STORAGE_SPACE'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Data management validation
  validateDataOperation(operation: 'verify' | 'seed' | 'clear'): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    // Check localStorage availability
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      errors.push({
        field: 'localStorage',
        message: 'LocalStorage is not available or full',
        severity: 'error',
        code: 'LOCALSTORAGE_UNAVAILABLE'
      });
    }

    // Operation-specific validations
    switch (operation) {
      case 'seed':
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        if (transactions.length > 100) {
          warnings.push({
            field: 'data',
            message: 'You already have a significant amount of data. Seeding may create duplicates.',
            severity: 'warning',
            code: 'DUPLICATE_DATA_RISK'
          });
        }
        break;

      case 'clear':
        warnings.push({
          field: 'cache',
          message: 'Clearing cache will remove temporary data but preserve your financial records.',
          severity: 'warning',
          code: 'CACHE_CLEAR_WARNING'
        });
        break;

      case 'verify':
        info.push({
          field: 'verification',
          message: 'Data verification will check the integrity of your stored information.',
          severity: 'info',
          code: 'VERIFICATION_INFO'
        });
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  // Error analysis and logging
  logError(category: ErrorAnalysis['category'], error: ValidationError, context?: any): void {
    const analysis: ErrorAnalysis = {
      timestamp: new Date(),
      category,
      error,
      context,
      resolved: false
    };

    this.errorHistory.push(analysis);
    
    // Keep history size manageable
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }

    // Log to console for debugging
    console.error(`[Settings Error] ${category}:`, error, context);
  }

  // Get error statistics
  getErrorAnalysis(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    recentErrors: ErrorAnalysis[];
    criticalErrors: ErrorAnalysis[];
  } {
    const errorsByCategory: Record<string, number> = {};
    const criticalErrors: ErrorAnalysis[] = [];

    this.errorHistory.forEach(analysis => {
      errorsByCategory[analysis.category] = (errorsByCategory[analysis.category] || 0) + 1;
      if (analysis.error.severity === 'error') {
        criticalErrors.push(analysis);
      }
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      recentErrors: this.errorHistory.slice(-10),
      criticalErrors: criticalErrors.slice(-5)
    };
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  // Resolve error
  resolveError(timestamp: Date): boolean {
    const errorIndex = this.errorHistory.findIndex(
      analysis => analysis.timestamp.getTime() === timestamp.getTime()
    );
    
    if (errorIndex !== -1) {
      this.errorHistory[errorIndex].resolved = true;
      return true;
    }
    
    return false;
  }
}

// Singleton instance
export const settingsErrorValidator = new SettingsErrorValidator();

// Integration with error monitoring system

// Enhance the validator with monitoring
const originalLogError = settingsErrorValidator.logError.bind(settingsErrorValidator);
settingsErrorValidator.logError = function(category: ErrorAnalysis['category'], error: ValidationError, context?: any) {
  // Call original method
  originalLogError(category, error, context);
  
  // Also log to monitoring system
  const level = error.severity === 'error' ? 'error' : 
                error.severity === 'warning' ? 'warn' : 'info';
  
  const logFunction = level === 'error' ? logSettingsError : 
                     level === 'warn' ? logSettingsWarning : logSettingsInfo;
  
  logFunction(category, error.message, { ...context, errorCode: error.code }, error.code);
};

// Wrap validation methods with performance monitoring
const originalValidateTheme = settingsErrorValidator.validateThemeChange.bind(settingsErrorValidator);
settingsErrorValidator.validateThemeChange = withPerformanceMonitoring('validate_theme', originalValidateTheme);

// Temporarily disable performance monitoring for currency validation to fix compilation issue
// const originalValidateCurrency = settingsErrorValidator.validateCurrencySettings.bind(settingsErrorValidator);
// settingsErrorValidator.validateCurrencySettings = withPerformanceMonitoring('validate_currency', originalValidateCurrency);

const originalValidateImport = settingsErrorValidator.validateImportData.bind(settingsErrorValidator);
settingsErrorValidator.validateImportData = withPerformanceMonitoring('validate_import', originalValidateImport);

const originalValidateExport = settingsErrorValidator.validateExportSettings.bind(settingsErrorValidator);
settingsErrorValidator.validateExportSettings = withPerformanceMonitoring('validate_export', originalValidateExport);

// Utility functions for common validations
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      severity: 'error',
      code: 'REQUIRED_FIELD'
    };
  }
  return null;
};

export const validateEmail = (email: string): ValidationError | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Invalid email format',
      severity: 'error',
      code: 'INVALID_EMAIL'
    };
  }
  return null;
};

export const validateUrl = (url: string): ValidationError | null => {
  try {
    new URL(url);
    return null;
  } catch {
    return {
      field: 'url',
      message: 'Invalid URL format',
      severity: 'error',
      code: 'INVALID_URL'
    };
  }
};
