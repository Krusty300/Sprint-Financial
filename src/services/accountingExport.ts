import { AccountingExport, Transaction, Account } from '@/lib/types';

export interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  realmId?: string;
  refreshToken?: string;
}

export interface XeroConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  tenantId?: string;
  refreshToken?: string;
}

export class AccountingExportService {
  private static instance: AccountingExportService;
  private quickBooksConfig: QuickBooksConfig | null = null;
  private xeroConfig: XeroConfig | null = null;
  private exports: AccountingExport[] = [];

  private constructor() {
    this.loadConfigs();
    this.loadExports();
  }

  static getInstance(): AccountingExportService {
    if (!AccountingExportService.instance) {
      AccountingExportService.instance = new AccountingExportService();
    }
    return AccountingExportService.instance;
  }

  private loadConfigs(): void {
    try {
      const qbConfig = localStorage.getItem('quickbooks-config');
      if (qbConfig) {
        this.quickBooksConfig = JSON.parse(qbConfig);
      }

      const xeroConfig = localStorage.getItem('xero-config');
      if (xeroConfig) {
        this.xeroConfig = JSON.parse(xeroConfig);
      }
    } catch (error) {
      console.error('Error loading accounting configs:', error);
    }
  }

  private saveConfigs(): void {
    try {
      if (this.quickBooksConfig) {
        localStorage.setItem('quickbooks-config', JSON.stringify(this.quickBooksConfig));
      }
      if (this.xeroConfig) {
        localStorage.setItem('xero-config', JSON.stringify(this.xeroConfig));
      }
    } catch (error) {
      console.error('Error saving accounting configs:', error);
    }
  }

  private loadExports(): void {
    try {
      const stored = localStorage.getItem('accounting-exports');
      if (stored) {
        this.exports = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading accounting exports:', error);
    }
  }

  private saveExports(): void {
    try {
      localStorage.setItem('accounting-exports', JSON.stringify(this.exports));
    } catch (error) {
      console.error('Error saving accounting exports:', error);
    }
  }

  /**
   * Configure QuickBooks integration
   */
  configureQuickBooks(config: QuickBooksConfig): void {
    this.quickBooksConfig = config;
    this.saveConfigs();
  }

  /**
   * Configure Xero integration
   */
  configureXero(config: XeroConfig): void {
    this.xeroConfig = config;
    this.saveConfigs();
  }

  /**
   * Export to QuickBooks
   */
  async exportToQuickBooks(
    transactions: Transaction[],
    accounts: Account[],
    startDate: string,
    endDate: string
  ): Promise<AccountingExport> {
    if (!this.quickBooksConfig) {
      throw new Error('QuickBooks is not configured');
    }

    const accountingExport: AccountingExport = {
      id: `qb-export-${Date.now()}`,
      format: 'quickbooks',
      status: 'processing',
      startDate,
      endDate,
      accountIds: accounts.map(a => a.id),
      transactionCount: transactions.length,
      createdAt: new Date().toISOString()
    };

    this.exports.push(accountingExport);
    this.saveExports();

    try {
      // In a real implementation, this would:
      // 1. Transform transactions to QuickBooks format
      // 2. Call QuickBooks API to create journal entries or transactions
      // 3. Handle errors and retries
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      accountingExport.status = 'completed';
      accountingExport.completedAt = new Date().toISOString();
      accountingExport.exportUrl = `https://quickbooks.intuit.com/app/export?exportId=${accountingExport.id}`;
    } catch (error) {
      accountingExport.status = 'failed';
      accountingExport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      accountingExport.completedAt = new Date().toISOString();
    }

    this.saveExports();
    return accountingExport;
  }

  /**
   * Export to Xero
   */
  async exportToXero(
    transactions: Transaction[],
    accounts: Account[],
    startDate: string,
    endDate: string
  ): Promise<AccountingExport> {
    if (!this.xeroConfig) {
      throw new Error('Xero is not configured');
    }

    const accountingExport: AccountingExport = {
      id: `xero-export-${Date.now()}`,
      format: 'xero',
      status: 'processing',
      startDate,
      endDate,
      accountIds: accounts.map(a => a.id),
      transactionCount: transactions.length,
      createdAt: new Date().toISOString()
    };

    this.exports.push(accountingExport);
    this.saveExports();

    try {
      // In a real implementation, this would:
      // 1. Transform transactions to Xero format
      // 2. Call Xero API to create bank transactions or journal entries
      // 3. Handle errors and retries
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      accountingExport.status = 'completed';
      accountingExport.completedAt = new Date().toISOString();
      accountingExport.exportUrl = `https://api.xero.com/exports/${accountingExport.id}`;
    } catch (error) {
      accountingExport.status = 'failed';
      accountingExport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      accountingExport.completedAt = new Date().toISOString();
    }

    this.saveExports();
    return accountingExport;
  }

  /**
   * Export to CSV
   */
  async exportToCSV(
    transactions: Transaction[],
    accounts: Account[],
    startDate: string,
    endDate: string
  ): Promise<AccountingExport> {
    const accountingExport: AccountingExport = {
      id: `csv-export-${Date.now()}`,
      format: 'csv',
      status: 'processing',
      startDate,
      endDate,
      accountIds: accounts.map(a => a.id),
      transactionCount: transactions.length,
      createdAt: new Date().toISOString()
    };

    this.exports.push(accountingExport);
    this.saveExports();

    try {
      // Generate CSV content
      const csvContent = this.generateCSV(transactions, accounts);
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      accountingExport.status = 'completed';
      accountingExport.completedAt = new Date().toISOString();
      accountingExport.exportUrl = url;
    } catch (error) {
      accountingExport.status = 'failed';
      accountingExport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      accountingExport.completedAt = new Date().toISOString();
    }

    this.saveExports();
    return accountingExport;
  }

  /**
   * Export to JSON
   */
  async exportToJSON(
    transactions: Transaction[],
    accounts: Account[],
    startDate: string,
    endDate: string
  ): Promise<AccountingExport> {
    const accountingExport: AccountingExport = {
      id: `json-export-${Date.now()}`,
      format: 'json',
      status: 'processing',
      startDate,
      endDate,
      accountIds: accounts.map(a => a.id),
      transactionCount: transactions.length,
      createdAt: new Date().toISOString()
    };

    this.exports.push(accountingExport);
    this.saveExports();

    try {
      // Generate JSON content
      const jsonContent = JSON.stringify({
        metadata: {
          exportDate: new Date().toISOString(),
          startDate,
          endDate,
          transactionCount: transactions.length,
          accountCount: accounts.length
        },
        accounts,
        transactions
      }, null, 2);
      
      // Create download link
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      accountingExport.status = 'completed';
      accountingExport.completedAt = new Date().toISOString();
      accountingExport.exportUrl = url;
    } catch (error) {
      accountingExport.status = 'failed';
      accountingExport.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      accountingExport.completedAt = new Date().toISOString();
    }

    this.saveExports();
    return accountingExport;
  }

  /**
   * Generate CSV content
   */
  private generateCSV(transactions: Transaction[], accounts: Account[]): string {
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Type', 'Account'];
    const rows = transactions.map(tx => {
      const account = accounts.find(a => a.id === tx.account);
      return [
        tx.date,
        `"${tx.description}"`,
        tx.amount.toFixed(2),
        tx.category || '',
        tx.type,
        account?.name || ''
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get all exports
   */
  getExports(): AccountingExport[] {
    return this.exports;
  }

  /**
   * Get export by ID
   */
  getExportById(id: string): AccountingExport | undefined {
    return this.exports.find(exp => exp.id === id);
  }

  /**
   * Delete export
   */
  deleteExport(id: string): boolean {
    const index = this.exports.findIndex(exp => exp.id === id);
    if (index === -1) return false;

    this.exports.splice(index, 1);
    this.saveExports();
    return true;
  }

  /**
   * Check if QuickBooks is configured
   */
  isQuickBooksConfigured(): boolean {
    return this.quickBooksConfig !== null;
  }

  /**
   * Check if Xero is configured
   */
  isXeroConfigured(): boolean {
    return this.xeroConfig !== null;
  }
}

export const accountingExportService = AccountingExportService.getInstance();
