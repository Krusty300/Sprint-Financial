import { BankAccount, BankTransaction, BankSync, ImportRule, ReconciliationReport, Transaction } from '@/lib/types';
import { db } from '@/lib/db';

export class BankIntegrationService {
  private static instance: BankIntegrationService;

  static getInstance(): BankIntegrationService {
    if (!BankIntegrationService.instance) {
      BankIntegrationService.instance = new BankIntegrationService();
    }
    return BankIntegrationService.instance;
  }

  // Bank Account Management
  async linkBankAccount(bankAccount: Omit<BankAccount, 'id'>): Promise<BankAccount> {
    const newBankAccount: BankAccount = {
      ...bankAccount,
      id: crypto.randomUUID(),
    };

    const bankAccounts = this.getBankAccounts();
    bankAccounts.push(newBankAccount);
    localStorage.setItem('finance-tracker-bank-accounts', JSON.stringify(bankAccounts));
    
    return newBankAccount;
  }

  async unlinkBankAccount(bankAccountId: string): Promise<boolean> {
    const bankAccounts = this.getBankAccounts();
    const filteredAccounts = bankAccounts.filter(account => account.id !== bankAccountId);
    
    if (filteredAccounts.length === bankAccounts.length) return false;

    localStorage.setItem('finance-tracker-bank-accounts', JSON.stringify(filteredAccounts));
    return true;
  }

  getBankAccounts(): BankAccount[] {
    try {
      const data = localStorage.getItem('finance-tracker-bank-accounts');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      return [];
    }
  }

  async updateBankAccount(id: string, updates: Partial<BankAccount>): Promise<BankAccount | null> {
    const bankAccounts = this.getBankAccounts();
    const index = bankAccounts.findIndex(account => account.id === id);
    
    if (index === -1) return null;
    
    const updatedAccount = { ...bankAccounts[index], ...updates };
    bankAccounts[index] = updatedAccount;
    localStorage.setItem('finance-tracker-bank-accounts', JSON.stringify(bankAccounts));
    
    return updatedAccount;
  }

  // Transaction Sync
  async syncBankTransactions(bankAccountId: string): Promise<BankSync> {
    const bankAccount = this.getBankAccounts().find(account => account.id === bankAccountId);
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    const sync: BankSync = {
      id: crypto.randomUUID(),
      bankAccountId,
      syncType: 'incremental',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      transactionCount: 0,
      status: 'pending',
      startedAt: new Date().toISOString(),
    };

    try {
      // Simulate bank API call
      const bankTransactions = await this.fetchTransactionsFromBank(bankAccount);
      
      // Apply import rules
      const processedTransactions = await this.applyImportRules(bankTransactions);
      
      // Detect duplicates
      const deduplicatedTransactions = await this.detectDuplicates(processedTransactions);
      
      // Import transactions
      let importedCount = 0;
      for (const bankTransaction of deduplicatedTransactions) {
        if (!bankTransaction.isDuplicate) {
          await this.importBankTransaction(bankTransaction);
          importedCount++;
        }
      }

      sync.transactionCount = importedCount;
      sync.status = 'completed';
      sync.completedAt = new Date().toISOString();

      // Update bank account last sync
      await this.updateBankAccount(bankAccountId, {
        lastSync: new Date().toISOString(),
        syncStatus: 'connected'
      });

    } catch (error) {
      sync.status = 'failed';
      sync.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateBankAccount(bankAccountId, {
        syncStatus: 'error'
      });
    }

    const syncs = this.getBankSyncs();
    syncs.push(sync);
    localStorage.setItem('finance-tracker-bank-syncs', JSON.stringify(syncs));

    return sync;
  }

  private async fetchTransactionsFromBank(bankAccount: BankAccount): Promise<BankTransaction[]> {
    // Simulate bank API response
    // In real implementation, this would call Plaid, Stripe, or other bank APIs
    const mockTransactions: BankTransaction[] = [
      {
        id: crypto.randomUUID(),
        bankAccountId: bankAccount.id,
        providerTransactionId: `bank_${Date.now()}_1`,
        date: new Date().toISOString(),
        amount: -45.67,
        description: 'Coffee Shop',
        category: 'Food & Dining',
        type: 'expense',
        status: 'posted',
        merchantName: 'Starbucks',
        location: {
          city: 'New York',
          state: 'NY',
          country: 'US'
        },
        tags: [],
        isDuplicate: false,
        importDate: new Date().toISOString(),
        reconciliationStatus: 'unmatched'
      },
      {
        id: crypto.randomUUID(),
        bankAccountId: bankAccount.id,
        providerTransactionId: `bank_${Date.now()}_2`,
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        amount: 1500.00,
        description: 'Salary Deposit',
        category: 'Income',
        type: 'income',
        status: 'posted',
        tags: [],
        isDuplicate: false,
        importDate: new Date().toISOString(),
        reconciliationStatus: 'unmatched'
      }
    ];

    return mockTransactions;
  }

  private async applyImportRules(transactions: BankTransaction[]): Promise<BankTransaction[]> {
    const rules = this.getImportRules();
    
    return transactions.map(transaction => {
      let processedTransaction = { ...transaction };

      for (const rule of rules.filter(r => r.isActive)) {
        if (this.matchesRule(transaction, rule)) {
          // Apply rule actions
          if (rule.actions.assignCategory) {
            processedTransaction.category = rule.actions.assignCategory;
          }
          if (rule.actions.assignTags) {
            processedTransaction.tags = [...processedTransaction.tags, ...rule.actions.assignTags];
          }
          if (rule.actions.skipImport) {
            processedTransaction.isDuplicate = true; // Mark as duplicate to skip
          }
          if (rule.actions.markAsDuplicate) {
            processedTransaction.isDuplicate = true;
          }
        }
      }

      return processedTransaction;
    });
  }

  private matchesRule(transaction: BankTransaction, rule: ImportRule): boolean {
    const { conditions } = rule;
    
    // Check amount range
    if (conditions.amountRange) {
      if (transaction.amount < conditions.amountRange.min || 
          transaction.amount > conditions.amountRange.max) {
        return false;
      }
    }

    // Check description contains
    if (conditions.descriptionContains) {
      const descriptionMatch = conditions.descriptionContains.some(term =>
        transaction.description.toLowerCase().includes(term.toLowerCase())
      );
      if (!descriptionMatch) return false;
    }

    // Check merchant name contains
    if (conditions.merchantNameContains && transaction.merchantName) {
      const merchantMatch = conditions.merchantNameContains.some(term =>
        transaction.merchantName!.toLowerCase().includes(term.toLowerCase())
      );
      if (!merchantMatch) return false;
    }

    // Check category
    if (conditions.category && transaction.category !== conditions.category) {
      return false;
    }

    return true;
  }

  private async detectDuplicates(transactions: BankTransaction[]): Promise<BankTransaction[]> {
    const existingTransactions = db.getTransactions();
    
    return transactions.map(bankTransaction => {
      // Check for duplicates based on amount, date, and description
      const isDuplicate = existingTransactions.some(existing => {
        const existingDate = new Date(existing.date).toDateString();
        const bankDate = new Date(bankTransaction.date).toDateString();
        
        return existingDate === bankDate &&
               Math.abs(existing.amount - bankTransaction.amount) < 0.01 &&
               existing.description.toLowerCase() === bankTransaction.description.toLowerCase();
      });

      return {
        ...bankTransaction,
        isDuplicate
      };
    });
  }

  private async importBankTransaction(bankTransaction: BankTransaction): Promise<void> {
    const transaction: Omit<Transaction, 'id'> = {
      amount: Math.abs(bankTransaction.amount),
      type: bankTransaction.type,
      description: bankTransaction.description,
      category: bankTransaction.category || 'Uncategorized',
      account: this.getBankAccountById(bankTransaction.bankAccountId)?.accountName || 'Unknown',
      date: bankTransaction.date,
      tags: bankTransaction.tags,
    };

    db.addTransaction(transaction);
  }

  private getBankAccountById(id: string): BankAccount | undefined {
    return this.getBankAccounts().find(account => account.id === id);
  }

  // Import Rules Management
  async createImportRule(rule: Omit<ImportRule, 'id'>): Promise<ImportRule> {
    const newRule: ImportRule = {
      ...rule,
      id: crypto.randomUUID(),
    };

    const rules = this.getImportRules();
    rules.push(newRule);
    localStorage.setItem('finance-tracker-import-rules', JSON.stringify(rules));
    
    return newRule;
  }

  getImportRules(): ImportRule[] {
    try {
      const data = localStorage.getItem('finance-tracker-import-rules');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading import rules:', error);
      return [];
    }
  }

  // Reconciliation
  async generateReconciliationReport(bankAccountId: string, period: string): Promise<ReconciliationReport> {
    const bankAccount = this.getBankAccountById(bankAccountId);
    if (!bankAccount) {
      throw new Error('Bank account not found');
    }

    const bankTransactions = this.getBankTransactions(bankAccountId);
    const systemTransactions = db.getTransactions().filter(t => 
      t.account === bankAccount.accountName
    );

    const bankBalance = bankAccount.balance;
    const systemBalance = systemTransactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : -t.amount), 0
    );

    const matchedTransactions = bankTransactions.filter(bt => 
      bt.reconciliationStatus === 'matched'
    ).length;

    const unmatchedTransactions = bankTransactions.filter(bt => 
      bt.reconciliationStatus === 'unmatched'
    ).length;

    const duplicateTransactions = bankTransactions.filter(bt => 
      bt.isDuplicate
    ).length;

    const report: ReconciliationReport = {
      id: crypto.randomUUID(),
      bankAccountId,
      period,
      bankBalance,
      systemBalance,
      difference: bankBalance - systemBalance,
      matchedTransactions,
      unmatchedTransactions,
      duplicateTransactions,
      status: Math.abs(bankBalance - systemBalance) < 0.01 ? 'balanced' : 'discrepancy',
      createdAt: new Date().toISOString(),
    };

    const reports = this.getReconciliationReports();
    reports.push(report);
    localStorage.setItem('finance-tracker-reconciliation-reports', JSON.stringify(reports));

    return report;
  }

  getBankTransactions(bankAccountId?: string): BankTransaction[] {
    try {
      const data = localStorage.getItem('finance-tracker-bank-transactions');
      const transactions: BankTransaction[] = data ? JSON.parse(data) : [];
      
      return bankAccountId 
        ? transactions.filter(t => t.bankAccountId === bankAccountId)
        : transactions;
    } catch (error) {
      console.error('Error loading bank transactions:', error);
      return [];
    }
  }

  getBankSyncs(): BankSync[] {
    try {
      const data = localStorage.getItem('finance-tracker-bank-syncs');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading bank syncs:', error);
      return [];
    }
  }

  getReconciliationReports(): ReconciliationReport[] {
    try {
      const data = localStorage.getItem('finance-tracker-reconciliation-reports');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading reconciliation reports:', error);
      return [];
    }
  }

  // CSV Import
  async importFromCSV(file: File, bankAccountId: string): Promise<BankSync> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const transactions: BankTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const transaction: any = {};
      
      headers.forEach((header, index) => {
        transaction[header] = values[index];
      });

      const bankTransaction: BankTransaction = {
        id: crypto.randomUUID(),
        bankAccountId,
        providerTransactionId: `csv_${Date.now()}_${i}`,
        date: transaction.date || new Date().toISOString(),
        amount: parseFloat(transaction.amount) || 0,
        description: transaction.description || 'Imported Transaction',
        category: transaction.category,
        type: parseFloat(transaction.amount) >= 0 ? 'income' : 'expense',
        status: 'posted',
        tags: [],
        isDuplicate: false,
        importDate: new Date().toISOString(),
        reconciliationStatus: 'unmatched'
      };

      transactions.push(bankTransaction);
    }

    // Process and import transactions
    const processedTransactions = await this.applyImportRules(transactions);
    const deduplicatedTransactions = await this.detectDuplicates(processedTransactions);
    
    let importedCount = 0;
    for (const bankTransaction of deduplicatedTransactions) {
      if (!bankTransaction.isDuplicate) {
        await this.importBankTransaction(bankTransaction);
        importedCount++;
      }
    }

    const sync: BankSync = {
      id: crypto.randomUUID(),
      bankAccountId,
      syncType: 'full',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      transactionCount: importedCount,
      status: 'completed',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const syncs = this.getBankSyncs();
    syncs.push(sync);
    localStorage.setItem('finance-tracker-bank-syncs', JSON.stringify(syncs));

    return sync;
  }
}

export const bankIntegrationService = BankIntegrationService.getInstance();
