'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { exchangeRateService } from '@/services/currencyConversion';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 
  'KES' | 'UGX' | 'TZS' | 'ETB' | // East Africa
  'ZAR' | 'NAD' | 'BWP' | // South Africa
  'NGN' | 'GHS' | 'XOF' | 'XAF'; // West Africa

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, overrideCurrency?: Currency) => string;
  availableCurrencies: Currency[];
  getCurrencySymbol: (currency: Currency) => string;
  convertCurrency: (amount: number, fromCurrency: Currency, toCurrency: Currency) => number;
  baseCurrency: Currency;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCIES: Currency[] = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD',
  'KES', 'UGX', 'TZS', 'ETB', // East Africa
  'ZAR', 'NAD', 'BWP', // South Africa
  'NGN', 'GHS', 'XOF', 'XAF' // West Africa
];

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  // East Africa
  KES: 'KSh',
  UGX: 'UGX',
  TZS: 'TSh',
  ETB: 'Br',
  // South Africa
  ZAR: 'R',
  NAD: 'N$',
  BWP: 'P',
  // West Africa
  NGN: '₦',
  GHS: 'GH₵',
  XOF: 'CFA',
  XAF: 'FCFA',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD');
  const [numberFormat, setNumberFormat] = useState<'1,234.56' | '1.234,56' | '1 234.56' | '1234.56'>('1,234.56');
  const [conversionRates, setConversionRates] = useState<Record<string, number>>({});

  // Load currency and number format from localStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedCurrency = localStorage.getItem('app-currency');
        if (savedCurrency && CURRENCIES.includes(savedCurrency as Currency)) {
          setCurrency(savedCurrency as Currency);
        }
        
        const savedBaseCurrency = localStorage.getItem('app-base-currency');
        if (savedBaseCurrency && CURRENCIES.includes(savedBaseCurrency as Currency)) {
          setBaseCurrency(savedBaseCurrency as Currency);
        } else {
          // Set default base currency to USD
          localStorage.setItem('app-base-currency', 'USD');
          setBaseCurrency('USD');
        }
        
        const savedNumberFormat = localStorage.getItem('app-number-format');
        if (savedNumberFormat && ['1,234.56', '1.234,56', '1 234.56', '1234.56'].includes(savedNumberFormat)) {
          setNumberFormat(savedNumberFormat as any);
        }
        
        // Load conversion rates
        const rates = await exchangeRateService.getRates();
        setConversionRates(rates);
      } catch (error) {
        console.warn('Failed to load currency from localStorage:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save currency to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      localStorage.setItem('app-currency', currency);
    } catch (error) {
      console.warn('Failed to save currency to localStorage:', error);
    }
  }, [currency, isLoaded]);

  // Listen for number format changes from FormattingContext
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-number-format' && e.newValue) {
        if (['1,234.56', '1.234,56', '1 234.56', '1234.56'].includes(e.newValue)) {
          setNumberFormat(e.newValue as any);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load number format on mount and when it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      const savedNumberFormat = localStorage.getItem('app-number-format');
      if (savedNumberFormat && ['1,234.56', '1.234,56', '1 234.56', '1234.56'].includes(savedNumberFormat)) {
        setNumberFormat(savedNumberFormat as any);
      }
    } catch (error) {
      console.warn('Failed to load number format:', error);
    }
  }, [isLoaded]);

  // Convert amount from one currency to another
  const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency): number => {
    // If same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return amount;
    }

    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn('Invalid amount for currency conversion:', amount);
      return 0;
    }

    // Check if conversion rates are available
    if (!conversionRates[fromCurrency] || !conversionRates[toCurrency]) {
      console.warn('Conversion rates not available for:', fromCurrency, 'to', toCurrency);
      // Fallback: return original amount if rates not available
      return amount;
    }

    try {
      // Convert to base currency (USD) first, then to target currency
      const baseAmount = amount / conversionRates[fromCurrency];
      const targetAmount = baseAmount * conversionRates[toCurrency];
      
      // Round to 2 decimal places for most currencies, 0 for JPY
      const decimals = toCurrency === 'JPY' ? 0 : 2;
      return Math.round(targetAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount; // Fallback to original amount
    }
  };

  // Format currency with the selected currency and user's number format preference
  const formatCurrency = (amount: number, overrideCurrency?: Currency): string => {
    const targetCurrency = overrideCurrency || currency;
    const symbol = CURRENCY_SYMBOLS[targetCurrency];
    
    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
      console.warn('Invalid amount for formatting:', amount);
      return `${symbol}0.00`;
    }
    
    // Convert amount from base currency to target currency
    let convertedAmount = amount;
    if (targetCurrency !== baseCurrency && conversionRates[baseCurrency] && conversionRates[targetCurrency]) {
      try {
        convertedAmount = convertCurrency(amount, baseCurrency, targetCurrency);
      } catch (error) {
        console.warn('Currency conversion failed:', error);
        // Fallback to original amount if conversion fails
        convertedAmount = amount;
      }
    }
    
    // Handle JPY (no decimal places)
    if (targetCurrency === 'JPY') {
      const formattedAmount = Math.round(convertedAmount).toLocaleString('en-US');
      return `${symbol}${formattedAmount}`;
    }
    
    // Format number according to user's preference
    const absNumber = Math.abs(convertedAmount);
    const isNegative = convertedAmount < 0;
    const integerPart = Math.floor(absNumber);
    const decimalPart = Math.round((absNumber - integerPart) * 100);
    const formattedInteger = integerPart.toLocaleString('en-US');
    
    let formattedAmount = formattedInteger;
    
    switch (numberFormat) {
      case '1,234.56':
        formattedAmount = `${formattedInteger}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1.234,56':
        // Replace commas with dots and use comma for decimal
        formattedAmount = formattedInteger.replace(/,/g, '.');
        formattedAmount = `${formattedAmount},${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1 234.56':
        // Replace commas with spaces
        formattedAmount = formattedInteger.replace(/,/g, ' ');
        formattedAmount = `${formattedAmount}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1234.56':
        // Remove all separators
        formattedAmount = integerPart.toString();
        formattedAmount = `${formattedAmount}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      default:
        formattedAmount = `${formattedInteger}.${decimalPart.toString().padStart(2, '0')}`;
    }

    // Add currency symbol in correct position
    if (targetCurrency === 'EUR') {
      // Euro: symbol comes after number (e.g., 123,45€)
      return isNegative ? `-${formattedAmount}${symbol}` : `${formattedAmount}${symbol}`;
    } else {
      // USD, GBP, CAD, AUD: symbol comes before number (e.g., $123.45)
      return isNegative ? `-${symbol}${formattedAmount}` : `${symbol}${formattedAmount}`;
    }
  };

  // Update conversion rates periodically
  useEffect(() => {
    const updateRates = async () => {
      try {
        await exchangeRateService.updateRates();
        const rates = await exchangeRateService.getRates();
        setConversionRates(rates);
      } catch (error) {
        console.warn('Failed to update conversion rates:', error);
      }
    };

    // Update rates every hour
    const interval = setInterval(updateRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatCurrency,
    availableCurrencies: CURRENCIES,
    getCurrencySymbol: (curr: Currency) => CURRENCY_SYMBOLS[curr],
    convertCurrency,
    baseCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
