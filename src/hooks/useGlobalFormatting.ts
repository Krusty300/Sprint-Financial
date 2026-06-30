import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';

/**
 * Hook that combines currency and formatting contexts
 * Provides a unified interface for all formatting needs
 */
export function useGlobalFormatting() {
  const { 
    currency, 
    formatCurrency: formatCurrencyAmount,
    availableCurrencies,
    getCurrencySymbol
  } = useCurrency();
  
  const {
    dateFormat,
    setDateFormat,
    numberFormat,
    setNumberFormat,
    formatDate: formatDateString,
    formatNumber,
    availableDateFormats,
    availableNumberFormats
  } = useFormatting();

  // Combined formatting function that formats amount with currency
  const formatAmount = (amount: number, overrideCurrency?: string) => {
    return formatCurrencyAmount(amount, overrideCurrency as any);
  };

  // Format date using user's preferred format
  const formatDate = (date: string | Date) => {
    return formatDateString(date);
  };

  // Format number using user's preferred format
  const formatAmountNumber = (number: number) => {
    return formatNumber(number);
  };

  // Get current formatting settings summary
  const getFormattingSummary = () => {
    return {
      currency,
      dateFormat,
      numberFormat,
      currencySymbol: getCurrencySymbol(currency as any),
      sampleDate: formatDate(new Date()),
      sampleNumber: formatAmountNumber(1234.56),
      sampleCurrency: formatAmount(1234.56)
    };
  };

  return {
    // Currency
    currency,
    setCurrency: (newCurrency: string) => formatCurrencyAmount(newCurrency as any),
    formatAmount,
    availableCurrencies,
    getCurrencySymbol,
    
    // Date formatting
    dateFormat,
    setDateFormat,
    formatDate,
    availableDateFormats,
    
    // Number formatting
    numberFormat,
    setNumberFormat,
    formatNumber: formatAmountNumber,
    availableNumberFormats,
    
    // Combined utilities
    getFormattingSummary
  };
}
