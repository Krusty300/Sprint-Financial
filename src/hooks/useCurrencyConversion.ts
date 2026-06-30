import { useState, useEffect } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { exchangeRateService } from '@/services/currencyConversion';

export function useCurrencyConversion() {
  const { currency: baseCurrency, formatCurrency } = useCurrency();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);

  // Convert amount from one currency to another
  const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;

    setIsConverting(true);
    setConversionError(null);

    try {
      const convertedAmount = await exchangeRateService.convert(amount, fromCurrency, toCurrency);
      return convertedAmount;
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Conversion failed');
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  // Format amount in a specific currency
  const formatAmountInCurrency = (amount: number, currency: string): string => {
    return formatCurrency(amount, currency as any);
  };

  // Convert and format in one step
  const convertAndFormat = async (amount: number, fromCurrency: string, toCurrency?: string): Promise<string> => {
    const targetCurrency = toCurrency || baseCurrency;
    const convertedAmount = await convertAmount(amount, fromCurrency, targetCurrency);
    return formatAmountInCurrency(convertedAmount, targetCurrency);
  };

  // Get current exchange rates
  const getExchangeRates = async () => {
    try {
      return await exchangeRateService.getRates();
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Failed to get rates');
      throw error;
    }
  };

  // Update exchange rates
  const updateExchangeRates = async () => {
    setIsConverting(true);
    setConversionError(null);

    try {
      await exchangeRateService.updateRates();
    } catch (error) {
      setConversionError(error instanceof Error ? error.message : 'Failed to update rates');
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  // Get last updated timestamp
  const getLastUpdated = () => {
    return exchangeRateService.getLastUpdated();
  };

  return {
    convertAmount,
    formatAmountInCurrency,
    convertAndFormat,
    getExchangeRates,
    updateExchangeRates,
    getLastUpdated,
    isConverting,
    conversionError,
    baseCurrency,
  };
}
