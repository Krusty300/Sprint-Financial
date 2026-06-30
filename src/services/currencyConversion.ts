// Exchange rates (base currency: USD)
// In a real application, these would be fetched from an API
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  // East Africa
  KES: 129.0, // Kenyan Shilling
  UGX: 3750.0, // Ugandan Shilling
  TZS: 2500.0, // Tanzanian Shilling
  ETB: 55.0, // Ethiopian Birr
  // South Africa
  ZAR: 18.5, // South African Rand
  NAD: 18.5, // Namibian Dollar (pegged to ZAR)
  BWP: 13.5, // Botswana Pula
  // West Africa
  NGN: 1550.0, // Nigerian Naira
  GHS: 15.0, // Ghanaian Cedi
  XOF: 620.0, // West African CFA Franc
  XAF: 620.0, // Central African CFA Franc
};

export interface ExchangeRateService {
  convert(amount: number, from: string, to: string): Promise<number>;
  getRates(): Promise<Record<string, number>>;
  updateRates(): Promise<void>;
}

export class SimpleExchangeRateService implements ExchangeRateService {
  private rates: Record<string, number> = { ...EXCHANGE_RATES };
  private lastUpdated: Date = new Date();

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    const fromRate = this.rates[from];
    const toRate = this.rates[to];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not available for ${from} or ${to}`);
    }
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  async getRates(): Promise<Record<string, number>> {
    return { ...this.rates };
  }

  async updateRates(): Promise<void> {
    // In a real application, this would fetch from an API
    // For now, we'll simulate with random fluctuations
    const randomFluctuation = () => 0.95 + Math.random() * 0.1; // ±5% fluctuation

    this.rates = {
      USD: 1.0,
      EUR: EXCHANGE_RATES.EUR * randomFluctuation(),
      GBP: EXCHANGE_RATES.GBP * randomFluctuation(),
      JPY: EXCHANGE_RATES.JPY * randomFluctuation(),
      CAD: EXCHANGE_RATES.CAD * randomFluctuation(),
      AUD: EXCHANGE_RATES.AUD * randomFluctuation(),
      // East Africa
      KES: EXCHANGE_RATES.KES * randomFluctuation(),
      UGX: EXCHANGE_RATES.UGX * randomFluctuation(),
      TZS: EXCHANGE_RATES.TZS * randomFluctuation(),
      ETB: EXCHANGE_RATES.ETB * randomFluctuation(),
      // South Africa
      ZAR: EXCHANGE_RATES.ZAR * randomFluctuation(),
      NAD: EXCHANGE_RATES.NAD * randomFluctuation(),
      BWP: EXCHANGE_RATES.BWP * randomFluctuation(),
      // West Africa
      NGN: EXCHANGE_RATES.NGN * randomFluctuation(),
      GHS: EXCHANGE_RATES.GHS * randomFluctuation(),
      XOF: EXCHANGE_RATES.XOF * randomFluctuation(),
      XAF: EXCHANGE_RATES.XAF * randomFluctuation(),
    };

    this.lastUpdated = new Date();
    
    // Save to localStorage for persistence
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      
      // Check localStorage quota before saving
      const data = JSON.stringify({
        rates: this.rates,
        lastUpdated: this.lastUpdated.toISOString(),
      });
      
      // Test if we can write to localStorage
      try {
        localStorage.setItem('exchange-rates', data);
      } catch (quotaError) {
        if (quotaError instanceof Error && (quotaError.name === 'QuotaExceededError' || quotaError.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
          console.warn('localStorage quota exceeded, clearing old exchange rates');
          try {
            localStorage.removeItem('exchange-rates');
            // Try again with smaller data
            localStorage.setItem('exchange-rates', data);
          } catch (retryError) {
            console.error('Failed to save exchange rates even after clearing:', retryError);
          }
        } else {
          throw quotaError;
        }
      }
    } catch (error) {
      console.warn('Failed to save exchange rates:', error);
    }
  }

  getLastUpdated(): Date {
    return this.lastUpdated;
  }

  // Load rates from localStorage on initialization
  loadStoredRates(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      
      const stored = localStorage.getItem('exchange-rates');
      if (stored) {
        // Safe JSON parsing with validation
        const data = JSON.parse(stored);
        if (data && typeof data === 'object' && data.rates) {
          this.rates = { ...this.rates, ...data.rates };
          if (data.lastUpdated) {
            this.lastUpdated = new Date(data.lastUpdated);
          }
        } else {
          console.warn('Invalid exchange rates data format, using defaults');
        }
      }
    } catch (error) {
      console.warn('Failed to load stored exchange rates:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem('exchange-rates');
      } catch (clearError) {
        console.error('Failed to clear corrupted exchange rates:', clearError);
      }
    }
  }
}

// Singleton instance
export const exchangeRateService = new SimpleExchangeRateService();

// Initialize with stored rates
exchangeRateService.loadStoredRates();

// Update rates periodically (every hour)
if (typeof window !== 'undefined') {
  setInterval(() => {
    exchangeRateService.updateRates();
  }, 60 * 60 * 1000); // 1 hour
}
