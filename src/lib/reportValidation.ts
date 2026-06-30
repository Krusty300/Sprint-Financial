import { DashboardStats } from '@/lib/types';
import { Transaction } from '@/lib/types';

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates the structure and data integrity of dashboard stats
 */
export function validateDashboardStats(stats: DashboardStats | null): ValidationResult {
  if (!stats) {
    return { isValid: false, error: 'No data available' };
  }

  // Validate required numeric fields
  if (typeof stats.monthlyIncome !== 'number' || isNaN(stats.monthlyIncome)) {
    return { isValid: false, error: 'Invalid monthly income value' };
  }

  if (typeof stats.monthlyExpenses !== 'number' || isNaN(stats.monthlyExpenses)) {
    return { isValid: false, error: 'Invalid monthly expenses value' };
  }

  // Validate category breakdown
  if (!Array.isArray(stats.categoryBreakdown)) {
    return { isValid: false, error: 'Invalid category breakdown data' };
  }

  // Validate each category item
  for (const category of stats.categoryBreakdown) {
    if (!category.category || typeof category.percentage !== 'number') {
      return { isValid: false, error: 'Invalid category data structure' };
    }
  }

  // Validate net worth
  if (typeof stats.netWorth !== 'number' || isNaN(stats.netWorth)) {
    return { isValid: false, error: 'Invalid net worth value' };
  }

  return { isValid: true };
}

/**
 * Validates transactions array structure
 */
export function validateTransactions(transactions: Transaction[] | null): ValidationResult {
  if (!transactions) {
    return { isValid: false, error: 'No transaction data available' };
  }

  if (!Array.isArray(transactions)) {
    return { isValid: false, error: 'Invalid transactions data format' };
  }

  // Validate each transaction has required fields
  for (const transaction of transactions) {
    if (!transaction.id || !transaction.amount || !transaction.date) {
      return { isValid: false, error: 'Invalid transaction data structure' };
    }
  }

  return { isValid: true };
}

/**
 * Validates data for export operations
 */
export function validateExportData(
  stats: DashboardStats | null,
  transactions: Transaction[] | null
): ValidationResult {
  const statsValidation = validateDashboardStats(stats);
  if (!statsValidation.isValid) {
    return statsValidation;
  }

  const transactionsValidation = validateTransactions(transactions);
  if (!transactionsValidation.isValid) {
    return transactionsValidation;
  }

  return { isValid: true };
}

/**
 * Type guard to check if stats is valid
 */
export function isValidStats(stats: DashboardStats | null): stats is DashboardStats {
  return validateDashboardStats(stats).isValid;
}

/**
 * Type guard to check if transactions is valid
 */
export function isValidTransactions(transactions: Transaction[] | null): transactions is Transaction[] {
  return validateTransactions(transactions).isValid;
}
