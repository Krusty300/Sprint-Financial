import { FinancialInstitution, BankProvider } from '@/lib/types';

// Predefined financial institutions
const FINANCIAL_INSTITUTIONS: FinancialInstitution[] = [
  // US Banks
  {
    id: 'chase',
    name: 'Chase Bank',
    country: 'US',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.chase.com',
    documentationUrl: 'https://developer.chase.com'
  },
  {
    id: 'bank-of-america',
    name: 'Bank of America',
    country: 'US',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.bankofamerica.com',
    documentationUrl: 'https://developer.bankofamerica.com'
  },
  {
    id: 'wells-fargo',
    name: 'Wells Fargo',
    country: 'US',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'loan'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: false,
      historicalData: true
    },
    apiEndpoint: 'https://api.wellsfargo.com',
    documentationUrl: 'https://developer.wellsfargo.com'
  },
  {
    id: 'citi',
    name: 'Citibank',
    country: 'US',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.citi.com',
    documentationUrl: 'https://developer.citi.com'
  },
  {
    id: 'capital-one',
    name: 'Capital One',
    country: 'US',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.capitalone.com',
    documentationUrl: 'https://developer.capitalone.com'
  },
  // European Banks
  {
    id: 'hsbc-uk',
    name: 'HSBC UK',
    country: 'UK',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.hsbc.co.uk',
    documentationUrl: 'https://developer.hsbc.co.uk'
  },
  {
    id: 'barclays',
    name: 'Barclays',
    country: 'UK',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.barclays.co.uk',
    documentationUrl: 'https://developer.barclays.co.uk'
  },
  {
    id: 'deutsche-bank',
    name: 'Deutsche Bank',
    country: 'DE',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: false,
      historicalData: true
    },
    apiEndpoint: 'https://api.deutschebank.de',
    documentationUrl: 'https://developer.deutschebank.de'
  },
  {
    id: 'bnpparibas',
    name: 'BNP Paribas',
    country: 'FR',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.bnpparibas.fr',
    documentationUrl: 'https://developer.bnpparibas.fr'
  },
  // Canadian Banks
  {
    id: 'rbc',
    name: 'Royal Bank of Canada',
    country: 'CA',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.rbc.com',
    documentationUrl: 'https://developer.rbc.com'
  },
  {
    id: 'td',
    name: 'TD Bank',
    country: 'CA',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.td.com',
    documentationUrl: 'https://developer.td.com'
  },
  // Australian Banks
  {
    id: 'cba',
    name: 'Commonwealth Bank',
    country: 'AU',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    },
    apiEndpoint: 'https://api.commbank.com.au',
    documentationUrl: 'https://developer.commbank.com.au'
  },
  {
    id: 'westpac',
    name: 'Westpac',
    country: 'AU',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: false,
      historicalData: true
    },
    apiEndpoint: 'https://api.westpac.com.au',
    documentationUrl: 'https://developer.westpac.com.au'
  },
  // African Banks
  {
    id: 'kcb',
    name: 'KCB Bank',
    country: 'KE',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'loan'],
    features: {
      autoSync: false,
      transactionCategorization: false,
      realTimeUpdates: false,
      historicalData: true
    }
  },
  {
    id: 'equity-bank',
    name: 'Equity Bank',
    country: 'KE',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'loan'],
    features: {
      autoSync: false,
      transactionCategorization: false,
      realTimeUpdates: false,
      historicalData: true
    }
  },
  {
    id: 'standard-bank-za',
    name: 'Standard Bank',
    country: 'ZA',
    supportedAccountTypes: ['checking', 'savings', 'credit', 'investment'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: false,
      historicalData: true
    }
  },
  {
    id: 'fnb',
    name: 'FNB',
    country: 'ZA',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: true,
      transactionCategorization: true,
      realTimeUpdates: true,
      historicalData: true
    }
  },
  {
    id: 'gtbank',
    name: 'GTBank',
    country: 'NG',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: false,
      transactionCategorization: false,
      realTimeUpdates: false,
      historicalData: true
    }
  },
  {
    id: 'access-bank',
    name: 'Access Bank',
    country: 'NG',
    supportedAccountTypes: ['checking', 'savings', 'credit'],
    features: {
      autoSync: false,
      transactionCategorization: false,
      realTimeUpdates: false,
      historicalData: true
    }
  }
];

export class FinancialInstitutionsService {
  private static instance: FinancialInstitutionsService;
  private institutions: FinancialInstitution[] = [];

  private constructor() {
    this.institutions = [...FINANCIAL_INSTITUTIONS];
    this.loadCustomInstitutions();
  }

  static getInstance(): FinancialInstitutionsService {
    if (!FinancialInstitutionsService.instance) {
      FinancialInstitutionsService.instance = new FinancialInstitutionsService();
    }
    return FinancialInstitutionsService.instance;
  }

  private loadCustomInstitutions(): void {
    try {
      const stored = localStorage.getItem('custom-institutions');
      if (stored) {
        const custom = JSON.parse(stored);
        this.institutions = [...this.institutions, ...custom];
      }
    } catch (error) {
      console.error('Error loading custom institutions:', error);
    }
  }

  /**
   * Get all institutions
   */
  getAllInstitutions(): FinancialInstitution[] {
    return this.institutions;
  }

  /**
   * Get institutions by country
   */
  getInstitutionsByCountry(country: string): FinancialInstitution[] {
    return this.institutions.filter(inst => inst.country === country);
  }

  /**
   * Get institution by ID
   */
  getInstitutionById(id: string): FinancialInstitution | undefined {
    return this.institutions.find(inst => inst.id === id);
  }

  /**
   * Search institutions by name
   */
  searchInstitutions(query: string): FinancialInstitution[] {
    const lowerQuery = query.toLowerCase();
    return this.institutions.filter(inst =>
      inst.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get institutions that support specific account types
   */
  getInstitutionsByAccountType(accountType: string): FinancialInstitution[] {
    return this.institutions.filter(inst =>
      inst.supportedAccountTypes.includes(accountType as any)
    );
  }

  /**
   * Get institutions with specific features
   */
  getInstitutionsByFeature(feature: keyof FinancialInstitution['features']): FinancialInstitution[] {
    return this.institutions.filter(inst => inst.features[feature]);
  }

  /**
   * Add custom institution
   */
  addCustomInstitution(institution: FinancialInstitution): void {
    const customInstitutions = JSON.parse(localStorage.getItem('custom-institutions') || '[]');
    customInstitutions.push(institution);
    localStorage.setItem('custom-institutions', JSON.stringify(customInstitutions));
    this.institutions.push(institution);
  }

  /**
   * Get supported providers for an institution
   */
  getSupportedProviders(institutionId: string): BankProvider[] {
    const institution = this.getInstitutionById(institutionId);
    if (!institution) return ['manual', 'csv'];

    // Based on institution features, determine supported providers
    const providers: BankProvider[] = ['manual', 'csv'];
    
    if (institution.features.autoSync) {
      providers.push('plaid', 'yodlee');
    }

    return providers;
  }

  /**
   * Get institution compatibility with provider
   */
  isProviderSupported(institutionId: string, provider: BankProvider): boolean {
    const institution = this.getInstitutionById(institutionId);
    if (!institution) return false;

    const supportedProviders = this.getSupportedProviders(institutionId);
    return supportedProviders.includes(provider);
  }
}

export const financialInstitutionsService = FinancialInstitutionsService.getInstance();
