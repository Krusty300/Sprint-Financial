import { BankAccount, BankAggregation, BankTransaction } from '@/lib/types';

export class BankAggregationService {
  private static instance: BankAggregationService;
  private aggregations: BankAggregation[] = [];

  private constructor() {
    this.loadAggregations();
  }

  static getInstance(): BankAggregationService {
    if (!BankAggregationService.instance) {
      BankAggregationService.instance = new BankAggregationService();
    }
    return BankAggregationService.instance;
  }

  private loadAggregations(): void {
    try {
      const stored = localStorage.getItem('bank-aggregations');
      if (stored) {
        this.aggregations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading bank aggregations:', error);
    }
  }

  private saveAggregations(): void {
    try {
      localStorage.setItem('bank-aggregations', JSON.stringify(this.aggregations));
    } catch (error) {
      console.error('Error saving bank aggregations:', error);
    }
  }

  /**
   * Create a new bank aggregation
   */
  createAggregation(
    name: string,
    accountIds: string[],
    currency: string,
    autoSync: boolean = true
  ): BankAggregation {
    const aggregation: BankAggregation = {
      id: `agg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      accounts: accountIds,
      totalBalance: 0,
      currency,
      lastSync: new Date().toISOString(),
      isActive: true,
      autoSync
    };

    this.aggregations.push(aggregation);
    this.saveAggregations();
    return aggregation;
  }

  /**
   * Get all aggregations
   */
  getAggregations(): BankAggregation[] {
    return this.aggregations;
  }

  /**
   * Get aggregation by ID
   */
  getAggregationById(id: string): BankAggregation | undefined {
    return this.aggregations.find(agg => agg.id === id);
  }

  /**
   * Update aggregation
   */
  updateAggregation(id: string, updates: Partial<BankAggregation>): BankAggregation | null {
    const index = this.aggregations.findIndex(agg => agg.id === id);
    if (index === -1) return null;

    this.aggregations[index] = { ...this.aggregations[index], ...updates };
    this.saveAggregations();
    return this.aggregations[index];
  }

  /**
   * Delete aggregation
   */
  deleteAggregation(id: string): boolean {
    const index = this.aggregations.findIndex(agg => agg.id === id);
    if (index === -1) return false;

    this.aggregations.splice(index, 1);
    this.saveAggregations();
    return true;
  }

  /**
   * Calculate total balance for an aggregation
   */
  calculateAggregationBalance(aggregationId: string, bankAccounts: BankAccount[]): number {
    const aggregation = this.getAggregationById(aggregationId);
    if (!aggregation) return 0;

    const totalBalance = aggregation.accounts.reduce((total, accountId) => {
      const account = bankAccounts.find(acc => acc.id === accountId);
      return total + (account?.balance || 0);
    }, 0);

    // Update the aggregation with the new balance
    this.updateAggregation(aggregationId, { totalBalance });
    return totalBalance;
  }

  /**
   * Get all transactions for an aggregation
   */
  getAggregationTransactions(aggregationId: string, bankTransactions: BankTransaction[]): BankTransaction[] {
    const aggregation = this.getAggregationById(aggregationId);
    if (!aggregation) return [];

    return bankTransactions.filter(tx => aggregation.accounts.includes(tx.bankAccountId));
  }

  /**
   * Sync all aggregations
   */
  syncAllAggregations(bankAccounts: BankAccount[]): void {
    this.aggregations.forEach(aggregation => {
      if (aggregation.autoSync && aggregation.isActive) {
        const totalBalance = this.calculateAggregationBalance(aggregation.id, bankAccounts);
        this.updateAggregation(aggregation.id, {
          totalBalance,
          lastSync: new Date().toISOString()
        });
      }
    });
  }

  /**
   * Get aggregations for a specific bank account
   */
  getAggregationsForAccount(accountId: string): BankAggregation[] {
    return this.aggregations.filter(agg => agg.accounts.includes(accountId));
  }

  /**
   * Add account to aggregation
   */
  addAccountToAggregation(aggregationId: string, accountId: string): boolean {
    const aggregation = this.getAggregationById(aggregationId);
    if (!aggregation) return false;

    if (aggregation.accounts.includes(accountId)) return false;

    aggregation.accounts.push(accountId);
    this.saveAggregations();
    return true;
  }

  /**
   * Remove account from aggregation
   */
  removeAccountFromAggregation(aggregationId: string, accountId: string): boolean {
    const aggregation = this.getAggregationById(aggregationId);
    if (!aggregation) return false;

    const index = aggregation.accounts.indexOf(accountId);
    if (index === -1) return false;

    aggregation.accounts.splice(index, 1);
    this.saveAggregations();
    return true;
  }

  /**
   * Get aggregation statistics
   */
  getAggregationStats(aggregationId: string, bankAccounts: BankAccount[], bankTransactions: BankTransaction[]) {
    const aggregation = this.getAggregationById(aggregationId);
    if (!aggregation) return null;

    const accounts = bankAccounts.filter(acc => aggregation.accounts.includes(acc.id));
    const transactions = bankTransactions.filter(tx => aggregation.accounts.includes(tx.bankAccountId));

    const income = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expenses = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const categoryBreakdown = transactions.reduce((acc, tx) => {
      if (tx.category) {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalBalance: aggregation.totalBalance,
      accountCount: accounts.length,
      transactionCount: transactions.length,
      income,
      expenses,
      netFlow: income - expenses,
      categoryBreakdown,
      lastSync: aggregation.lastSync
    };
  }
}

export const bankAggregationService = BankAggregationService.getInstance();
