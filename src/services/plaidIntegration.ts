import { BankAccount, BankTransaction, BankSync } from '@/lib/types';

export interface PlaidConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  publicKey?: string;
}

export interface PlaidLinkToken {
  linkToken: string;
  expiration: string;
  requestId: string;
}

export interface PlaidPublicToken {
  publicToken: string;
  expiration: string;
  requestId: string;
}

export interface PlaidAccessToken {
  accessToken: string;
  itemId: string;
}

export class PlaidIntegrationService {
  private static instance: PlaidIntegrationService;
  private config: PlaidConfig | null = null;
  private accessTokens: Map<string, PlaidAccessToken> = new Map();

  private constructor() {
    this.loadConfig();
  }

  static getInstance(): PlaidIntegrationService {
    if (!PlaidIntegrationService.instance) {
      PlaidIntegrationService.instance = new PlaidIntegrationService();
    }
    return PlaidIntegrationService.instance;
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('plaid-config');
      if (stored) {
        this.config = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading Plaid config:', error);
    }
  }

  private saveConfig(): void {
    if (this.config) {
      try {
        localStorage.setItem('plaid-config', JSON.stringify(this.config));
      } catch (error) {
        console.error('Error saving Plaid config:', error);
      }
    }
  }

  /**
   * Configure Plaid integration
   */
  configure(config: PlaidConfig): void {
    this.config = config;
    this.saveConfig();
  }

  /**
   * Check if Plaid is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Create a link token for Plaid Link
   */
  async createLinkToken(userId: string): Promise<PlaidLinkToken> {
    if (!this.config) {
      throw new Error('Plaid is not configured');
    }

    // In a real implementation, this would call Plaid's API
    // For now, we'll return a mock response
    const linkToken = `link-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      linkToken,
      expiration: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      requestId: `req-${Date.now()}`
    };
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken: string): Promise<PlaidAccessToken> {
    if (!this.config) {
      throw new Error('Plaid is not configured');
    }

    // In a real implementation, this would call Plaid's API
    // For now, we'll return a mock response
    const accessToken = `access-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const itemId = `item-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tokenData: PlaidAccessToken = {
      accessToken,
      itemId
    };
    
    this.accessTokens.set(itemId, tokenData);
    return tokenData;
  }

  /**
   * Get accounts from Plaid
   */
  async getAccounts(itemId: string): Promise<BankAccount[]> {
    const tokenData = this.accessTokens.get(itemId);
    if (!tokenData) {
      throw new Error('Item not found or access token expired');
    }

    // In a real implementation, this would call Plaid's /accounts/get API
    // For now, we'll return mock data
    return [
      {
        id: `plaid-account-${Date.now()}`,
        provider: 'plaid',
        providerAccountId: itemId,
        institutionName: 'Chase Bank',
        institutionId: 'chase',
        accountName: 'Plaid Checking',
        accountType: 'checking',
        accountNumberLast4: '1234',
        balance: 5000.00,
        currency: 'USD',
        lastSync: new Date().toISOString(),
        isActive: true,
        syncStatus: 'connected',
        autoSync: true,
        syncFrequency: 'daily',
        feedStatus: {
          status: 'active',
          lastSyncAttempt: new Date().toISOString(),
          nextScheduledSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      }
    ];
  }

  /**
   * Get transactions from Plaid
   */
  async getTransactions(itemId: string, startDate: Date, endDate: Date): Promise<BankTransaction[]> {
    const tokenData = this.accessTokens.get(itemId);
    if (!tokenData) {
      throw new Error('Item not found or access token expired');
    }

    // In a real implementation, this would call Plaid's /transactions/get API
    // For now, we'll return mock data
    return [
      {
        id: `plaid-tx-${Date.now()}`,
        bankAccountId: `plaid-account-${Date.now()}`,
        providerTransactionId: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: 50.00,
        description: 'Starbucks',
        category: 'Food & Dining',
        type: 'expense',
        status: 'posted',
        merchantName: 'Starbucks',
        tags: [],
        isDuplicate: false,
        importDate: new Date().toISOString(),
        reconciliationStatus: 'unmatched',
        autoCategorized: true,
        categorizationConfidence: 0.9
      }
    ];
  }

  /**
   * Sync transactions from Plaid
   */
  async syncTransactions(itemId: string): Promise<BankSync> {
    const tokenData = this.accessTokens.get(itemId);
    if (!tokenData) {
      throw new Error('Item not found or access token expired');
    }

    const sync: BankSync = {
      id: `sync-${Date.now()}`,
      bankAccountId: itemId,
      syncType: 'incremental',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      transactionCount: 0,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    try {
      // In a real implementation, this would fetch transactions from Plaid
      const transactions = await this.getTransactions(itemId, 
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      );
      
      sync.transactionCount = transactions.length;
      sync.status = 'completed';
      sync.completedAt = new Date().toISOString();
    } catch (error) {
      sync.status = 'failed';
      sync.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sync.completedAt = new Date().toISOString();
    }

    return sync;
  }

  /**
   * Remove item (unlink account)
   */
  async removeItem(itemId: string): Promise<boolean> {
    const tokenData = this.accessTokens.get(itemId);
    if (!tokenData) {
      return false;
    }

    // In a real implementation, this would call Plaid's /item/remove API
    this.accessTokens.delete(itemId);
    return true;
  }

  /**
   * Webhook handler for Plaid webhooks
   */
  handleWebhook(webhookType: string, webhookCode: string, data: any): void {
    console.log(`Plaid webhook received: ${webhookType} - ${webhookCode}`, data);
    
    // Handle different webhook types
    switch (webhookType) {
      case 'TRANSACTIONS':
        // Handle transaction updates
        break;
      case 'ITEM':
        // Handle item updates (login required, etc.)
        break;
      case 'ERROR':
        // Handle errors
        break;
      default:
        console.warn('Unknown webhook type:', webhookType);
    }
  }

  /**
   * Get item status
   */
  async getItemStatus(itemId: string): Promise<any> {
    const tokenData = this.accessTokens.get(itemId);
    if (!tokenData) {
      throw new Error('Item not found or access token expired');
    }

    // In a real implementation, this would call Plaid's /item/get API
    return {
      item: {
        itemId,
        webhook: 'https://your-webhook-url.com/plaid',
        consentedScopes: ['transactions'],
        availableProducts: ['transactions'],
        billedProducts: ['transactions'],
        error: null,
        updateType: 'background',
        lastSuccessfulUpdate: new Date().toISOString()
      },
      status: {
        lastSuccessfulUpdate: new Date().toISOString()
      }
    };
  }
}

export const plaidIntegrationService = PlaidIntegrationService.getInstance();
