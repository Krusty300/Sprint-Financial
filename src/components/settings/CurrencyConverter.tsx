'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrencyConversion } from '@/hooks/useCurrencyConversion';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function CurrencyConverter() {
  const { 
    convertAmount, 
    convertAndFormat, 
    getExchangeRates, 
    updateExchangeRates, 
    getLastUpdated,
    isConverting, 
    conversionError,
    baseCurrency 
  } = useCurrencyConversion();
  
  type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
  
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState<Currency>(baseCurrency as Currency);
  const [toCurrency, setToCurrency] = useState<Currency>('USD');
  const [convertedAmount, setConvertedAmount] = useState<string | null>(null);
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});

  const handleConvert = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await convertAndFormat(parseFloat(amount), fromCurrency, toCurrency);
      setConvertedAmount(result);
    } catch (error) {
      toast.error('Failed to convert currency');
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setConvertedAmount(null);
  };

  const handleUpdateRates = async () => {
    try {
      await updateExchangeRates();
      toast.success('Exchange rates updated successfully');
      loadRates();
    } catch (error) {
      toast.error('Failed to update exchange rates');
    }
  };

  const loadRates = async () => {
    try {
      const rates = await getExchangeRates();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
    }
  };

  // Load rates on mount
  useEffect(() => {
    loadRates();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Currency Converter
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUpdateRates}
            disabled={isConverting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isConverting ? 'animate-spin' : ''}`} />
            Update Rates
          </Button>
        </div>
        {getLastUpdated() && (
          <p className="text-xs text-muted-foreground">
            Last updated: {getLastUpdated().toLocaleString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="from-currency">From</Label>
            <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value as Currency)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapCurrencies}
            className="mt-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-currency">To</Label>
          <Select value={toCurrency} onValueChange={(value) => setToCurrency(value as Currency)}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleConvert} 
          className="w-full" 
          disabled={isConverting || !amount}
        >
          {isConverting ? 'Converting...' : 'Convert'}
        </Button>

        {conversionError && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {conversionError}
          </div>
        )}

        {convertedAmount && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-muted-foreground">Result:</p>
            <p className="text-2xl font-bold text-green-600">{convertedAmount}</p>
          </div>
        )}

        {Object.keys(exchangeRates).length > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Current Exchange Rates (Base: USD)</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(exchangeRates).map(([currency, rate]) => (
                <div key={currency} className="flex justify-between">
                  <span>{currency}:</span>
                  <span>{rate.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
