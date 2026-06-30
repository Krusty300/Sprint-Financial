'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY';
export type NumberFormat = '1,234.56' | '1.234,56' | '1 234.56' | '1234.56' | '1,234';

interface FormattingContextType {
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  numberFormat: NumberFormat;
  setNumberFormat: (format: NumberFormat) => void;
  formatDate: (date: string | Date) => string;
  formatNumber: (number: number) => string;
  availableDateFormats: DateFormat[];
  availableNumberFormats: NumberFormat[];
}

const FormattingContext = createContext<FormattingContextType | undefined>(undefined);

const DATE_FORMATS: DateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];
const NUMBER_FORMATS: NumberFormat[] = ['1,234.56', '1.234,56', '1 234.56', '1234.56', '1,234'];

export function FormattingProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dateFormat, setDateFormat] = useState<DateFormat>('MM/DD/YYYY');
  const [numberFormat, setNumberFormat] = useState<NumberFormat>('1,234.56');

  // Load formatting settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedDateFormat = localStorage.getItem('app-date-format');
        const savedNumberFormat = localStorage.getItem('app-number-format');
        
        if (savedDateFormat && DATE_FORMATS.includes(savedDateFormat as DateFormat)) {
          setDateFormat(savedDateFormat as DateFormat);
        }
        
        if (savedNumberFormat && NUMBER_FORMATS.includes(savedNumberFormat as NumberFormat)) {
          setNumberFormat(savedNumberFormat as NumberFormat);
        }
      } catch (error) {
        console.warn('Failed to load formatting settings from localStorage:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save formatting settings to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      localStorage.setItem('app-date-format', dateFormat);
      localStorage.setItem('app-number-format', numberFormat);
    } catch (error) {
      console.warn('Failed to save formatting settings to localStorage:', error);
    }
  }, [dateFormat, numberFormat, isLoaded]);

  // Format date based on selected format
  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    switch (dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

  // Format number based on selected format
  const formatNumber = (number: number): string => {
    if (isNaN(number)) return '0';

    const absNumber = Math.abs(number);
    const isNegative = number < 0;
    const integerPart = Math.floor(absNumber);
    const decimalPart = Math.round((absNumber - integerPart) * 100);
    const formattedInteger = integerPart.toLocaleString('en-US');
    
    let formattedNumber = formattedInteger;
    
    switch (numberFormat) {
      case '1,234.56':
        formattedNumber = `${formattedInteger}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1.234,56':
        // Replace commas with dots and use comma for decimal
        formattedNumber = formattedInteger.replace(/,/g, '.');
        formattedNumber = `${formattedNumber},${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1 234.56':
        // Replace commas with spaces
        formattedNumber = formattedInteger.replace(/,/g, ' ');
        formattedNumber = `${formattedNumber}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      case '1234.56':
        // Remove all separators
        formattedNumber = integerPart.toString();
        formattedNumber = `${formattedNumber}.${decimalPart.toString().padStart(2, '0')}`;
        break;
      default:
        formattedNumber = `${formattedInteger}.${decimalPart.toString().padStart(2, '0')}`;
    }

    return isNegative ? `-${formattedNumber}` : formattedNumber;
  };

  // Prevent rendering until settings are loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  const value: FormattingContextType = {
    dateFormat,
    setDateFormat,
    numberFormat,
    setNumberFormat,
    formatDate,
    formatNumber,
    availableDateFormats: DATE_FORMATS,
    availableNumberFormats: NUMBER_FORMATS,
  };

  return (
    <FormattingContext.Provider value={value}>
      {children}
    </FormattingContext.Provider>
  );
}

export function useFormatting() {
  const context = useContext(FormattingContext);
  if (context === undefined) {
    throw new Error('useFormatting must be used within a FormattingProvider');
  }
  return context;
}
