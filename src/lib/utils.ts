import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Legacy formatCurrency function - now uses currency context in components
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}

// Helper function to get appropriate locale for currency formatting
function getLocaleForCurrency(currency: string): string {
  switch (currency) {
    case 'EUR':
      return 'de-DE'; // German locale for Euro formatting
    case 'GBP':
      return 'en-GB'; // British locale for Pound formatting
    case 'JPY':
      return 'ja-JP'; // Japanese locale for Yen formatting
    case 'CAD':
      return 'en-CA'; // Canadian locale for Canadian Dollar
    case 'AUD':
      return 'en-AU'; // Australian locale for Australian Dollar
    case 'USD':
    default:
      return 'en-US'; // US locale for US Dollar
  }
}

// Helper to parse dates with timezone awareness
export function parseDateWithTimezone(date: string | Date): Date {
  if (typeof date !== 'string') return date
  // Parse ISO date string and preserve timezone
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) {
    console.warn('Invalid date string:', date)
    return new Date()
  }
  return parsed
}

// Legacy formatDate function - components should use formatting context
export function formatDate(date: string | Date, formatStr = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseDateWithTimezone(date) : date
  return format(dateObj, formatStr)
}

export function formatMonth(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMMM yyyy')
}

export function getMonthStart(date: Date): Date {
  // Use UTC to ensure consistent month boundaries across timezones
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

export function getMonthEnd(date: Date): Date {
  // Use UTC to ensure consistent month boundaries across timezones
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999))
}

export function getYearStart(date: Date): Date {
  // Use UTC to ensure consistent year boundaries across timezones
  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
}

export function getYearEnd(date: Date): Date {
  // Use UTC to ensure consistent year boundaries across timezones
  return new Date(Date.UTC(date.getUTCFullYear(), 11, 31, 23, 59, 59, 999))
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
