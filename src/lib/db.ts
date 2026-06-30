import { Transaction, Category, Budget, Account, TransactionTemplate, RecycleBinItem } from './types';
import { 
  transactionSchema, 
  transactionInputSchema,
  categorySchema, 
  budgetSchema, 
  accountSchema 
} from './schema';

const STORAGE_KEYS = {
  TRANSACTIONS: 'finance-tracker-transactions',
  CATEGORIES: 'finance-tracker-categories',
  BUDGETS: 'finance-tracker-budgets',
  ACCOUNTS: 'finance-tracker-accounts',
  TEMPLATES: 'finance-tracker-templates',
  RECYCLE_BIN: 'finance-tracker-recycle-bin',
} as const;

class LocalStorageDB {
  private broadcastChannel: BroadcastChannel;

  constructor() {
    this.broadcastChannel = new BroadcastChannel('finance-tracker-db');
    this.broadcastChannel.onmessage = this.handleBroadcastMessage.bind(this);
  }

  private handleBroadcastMessage(event: MessageEvent) {
    // Force re-render in other tabs when data changes
    window.dispatchEvent(new Event('storage'));
  }

  private broadcastChange() {
    this.broadcastChannel.postMessage({ type: 'data-changed' });
  }

  // Transactions
  getTransactions(): Transaction[] {
    try {
      // SSR protection
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      
      // Safe JSON parsing with validation
      const transactions = JSON.parse(data);
      if (!Array.isArray(transactions)) {
        console.warn('Transactions data is not an array, clearing corrupted data');
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        return [];
      }
      
      return transactions
        .filter((t: any) => transactionSchema.safeParse(t).success)
        .filter((t: any) => !t.deletedAt); // Filter out soft-deleted transactions
    } catch (error) {
      console.error('Error reading transactions:', error);
      // Clear corrupted data to prevent future errors
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        }
      } catch (clearError) {
        console.error('Failed to clear corrupted transactions data:', clearError);
      }
      return [];
    }
  }

  // Get all transactions including deleted ones (for recycle bin)
  getAllTransactions(): Transaction[] {
    try {
      // SSR protection
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      
      // Safe JSON parsing with validation
      const transactions = JSON.parse(data);
      if (!Array.isArray(transactions)) {
        console.warn('All transactions data is not an array, clearing corrupted data');
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        return [];
      }
      
      return transactions.filter((t: any) => transactionSchema.safeParse(t).success);
    } catch (error) {
      console.error('Error reading all transactions:', error);
      // Clear corrupted data to prevent future errors
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        }
      } catch (clearError) {
        console.error('Failed to clear corrupted transactions data:', clearError);
      }
      return [];
    }
  }

  // Get only deleted transactions (for recycle bin)
  getDeletedTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return [];
      
      const transactions = JSON.parse(data);
      return transactions
        .filter((t: any) => transactionSchema.safeParse(t).success)
        .filter((t: any) => t.deletedAt); // Only return deleted transactions
    } catch (error) {
      console.error('Error reading deleted transactions:', error);
      return [];
    }
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    // Validate transaction data before adding (using input schema that doesn't require ID)
    const validationResult = transactionInputSchema.safeParse(transaction);
    if (!validationResult.success) {
      throw new Error(`Invalid transaction data: ${validationResult.error.message}`);
    }

    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
    };

    const transactions = this.getAllTransactions();
    transactions.push(newTransaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.broadcastChange();
    
    return newTransaction;
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const updatedTransaction = { ...transactions[index], ...updates };
    transactions[index] = updatedTransaction;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.broadcastChange();
    
    return updatedTransaction;
  }

  deleteTransaction(id: string): boolean {
    const transactions = this.getAllTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) return false;

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    this.broadcastChange();
    
    return true;
  }

  // Query helpers for transactions
  getTransactionsByMonth(year: number, month: number): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
    });
  }

  getTransactionsByCategory(category: string): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(t => t.category === category);
  }

  getTransactionsByDateRange(startDate: Date, endDate: Date): Transaction[] {
    const transactions = this.getTransactions();
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  // Categories
  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!data) return this.getDefaultCategories();
      
      const categories = JSON.parse(data);
      return categories.filter((c: any) => categorySchema.safeParse(c).success);
    } catch (error) {
      console.error('Error reading categories:', error);
      return this.getDefaultCategories();
    }
  }

  private getDefaultCategories(): Category[] {
    const defaultCategories: Omit<Category, 'id'>[] = [
      // Income categories
      { name: 'Salary', color: '#10b981', icon: '💰', type: 'income' },
      { name: 'Freelance', color: '#3b82f6', icon: '💼', type: 'income' },
      { name: 'Investments', color: '#8b5cf6', icon: '📈', type: 'income' },
      { name: 'Other Income', color: '#06b6d4', icon: '💵', type: 'income' },
      
      // Expense categories
      { name: 'Food', color: '#ef4444', icon: '🍔', type: 'expense' },
      { name: 'Transport', color: '#f59e0b', icon: '🚗', type: 'expense' },
      { name: 'Shopping', color: '#ec4899', icon: '🛍️', type: 'expense' },
      { name: 'Entertainment', color: '#8b5cf6', icon: '🎮', type: 'expense' },
      { name: 'Bills', color: '#6366f1', icon: '📄', type: 'expense' },
      { name: 'Healthcare', color: '#14b8a6', icon: '🏥', type: 'expense' },
      { name: 'Education', color: '#84cc16', icon: '📚', type: 'expense' },
      { name: 'Other', color: '#64748b', icon: '📌', type: 'expense' },
    ];

    const categoriesWithId = defaultCategories.map(cat => ({
      ...cat,
      id: crypto.randomUUID(),
    }));

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categoriesWithId));
    return categoriesWithId;
  }

  addCategory(category: Omit<Category, 'id'>): Category {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };

    const categories = this.getCategories();
    categories.push(newCategory);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.broadcastChange();
    
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return null;

    const updatedCategory = { ...categories[index], ...updates };
    const validated = categorySchema.safeParse(updatedCategory);
    
    if (!validated.success) return null;

    categories[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteCategory(id: string): boolean {
    const categories = this.getCategories();
    const categoryToDelete = categories.find(c => c.id === id);
    
    if (!categoryToDelete) return false;

    // Add to recycle bin before deletion
    this.addToRecycleBin({
      type: 'category',
      originalId: id,
      data: categoryToDelete,
    });

    const filteredCategories = categories.filter(c => c.id !== id);
    
    if (filteredCategories.length === categories.length) return false;

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));
    this.broadcastChange();
    
    return true;
  }

  softDeleteCategory(id: string): boolean {
    return this.deleteCategory(id);
  }

  // Budgets
  getBudgets(): Budget[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      if (!data) return [];
      
      const budgets = JSON.parse(data);
      return budgets.filter((b: any) => budgetSchema.safeParse(b).success);
    } catch (error) {
      console.error('Error reading budgets:', error);
      return [];
    }
  }

  addBudget(budget: Omit<Budget, 'id'>): Budget {
    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
    };

    const budgets = this.getBudgets();
    budgets.push(newBudget);
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.broadcastChange();
    
    return newBudget;
  }

  updateBudget(id: string, updates: Partial<Budget>): Budget | null {
    const budgets = this.getBudgets();
    const index = budgets.findIndex(b => b.id === id);
    
    if (index === -1) return null;

    const updatedBudget = { ...budgets[index], ...updates };
    const validated = budgetSchema.safeParse(updatedBudget);
    
    if (!validated.success) return null;

    budgets[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteBudget(id: string): boolean {
    const budgets = this.getBudgets();
    const budgetToDelete = budgets.find(b => b.id === id);
    
    if (!budgetToDelete) return false;

    // Add to recycle bin before deletion
    this.addToRecycleBin({
      type: 'budget',
      originalId: id,
      data: budgetToDelete,
    });

    const filteredBudgets = budgets.filter(b => b.id !== id);
    
    if (filteredBudgets.length === budgets.length) return false;

    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filteredBudgets));
    this.broadcastChange();
    
    return true;
  }

  softDeleteBudget(id: string): boolean {
    return this.deleteBudget(id);
  }

  // Accounts
  getAccounts(): Account[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) return this.getDefaultAccounts();
      
      const accounts = JSON.parse(data);
      return accounts.filter((a: any) => accountSchema.safeParse(a).success);
    } catch (error) {
      console.error('Error reading accounts:', error);
      return this.getDefaultAccounts();
    }
  }

  private getDefaultAccounts(): Account[] {
    const defaultAccounts: Omit<Account, 'id'>[] = [
      { name: 'Cash', type: 'cash', balance: 0, currency: 'USD' },
      { name: 'Main Bank Account', type: 'bank', balance: 0, currency: 'USD' },
      { name: 'Credit Card', type: 'credit', balance: 0, currency: 'USD' },
    ];

    const accountsWithId = defaultAccounts.map(account => ({
      ...account,
      id: crypto.randomUUID(),
    }));

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accountsWithId));
    return accountsWithId;
  }

  addAccount(account: Omit<Account, 'id'>): Account {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    };

    const accounts = this.getAccounts();
    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.broadcastChange();
    
    return newAccount;
  }

  updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;

    const updatedAccount = { ...accounts[index], ...updates };
    const validated = accountSchema.safeParse(updatedAccount);
    
    if (!validated.success) return null;

    accounts[index] = validated.data;
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    this.broadcastChange();
    
    return validated.data;
  }

  deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const accountToDelete = accounts.find(a => a.id === id);
    
    if (!accountToDelete) return false;

    // Add to recycle bin before deletion
    this.addToRecycleBin({
      type: 'account',
      originalId: id,
      data: accountToDelete,
    });

    const filteredAccounts = accounts.filter(a => a.id !== id);
    
    if (filteredAccounts.length === accounts.length) return false;

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccounts));
    this.broadcastChange();
    
    return true;
  }

  softDeleteAccount(id: string): boolean {
    return this.deleteAccount(id);
  }

  // Transaction Templates
  getTemplates(): TransactionTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (!data) return [];
      
      const templates = JSON.parse(data);
      return templates;
    } catch (error) {
      console.error('Error reading templates:', error);
      return [];
    }
  }

  addTemplate(template: Omit<TransactionTemplate, 'id' | 'usageCount'>): TransactionTemplate {
    const newTemplate: TransactionTemplate = {
      ...template,
      id: crypto.randomUUID(),
      usageCount: 0,
    };

    const templates = this.getTemplates();
    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    
return newTemplate;
}

updateTemplate(id: string, updates: Partial<TransactionTemplate>): TransactionTemplate | null {
    const templates = this.getTemplates();
    const index = templates.findIndex(t => t.id === id);
    
    if (index === -1) return null;

    const updatedTemplate = { ...templates[index], ...updates };
    templates[index] = updatedTemplate;
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    this.broadcastChange();
    
    return updatedTemplate;
  }

  deleteTemplate(id: string): boolean {
    const templates = this.getTemplates();
    const templateToDelete = templates.find(t => t.id === id);
    
    if (!templateToDelete) return false;

    // Add to recycle bin before deletion
    this.addToRecycleBin({
      type: 'template',
      originalId: id,
      data: templateToDelete,
    });

    const filteredTemplates = templates.filter(t => t.id !== id);
    
    if (filteredTemplates.length === templates.length) return false;

    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filteredTemplates));
    this.broadcastChange();
    
    return true;
  }

  softDeleteTemplate(id: string): boolean {
    return this.deleteTemplate(id);
  }

  // Enhanced transaction methods for recurring transactions
  generateRecurringTransactions(): Transaction[] {
    const transactions = this.getTransactions();
    const today = new Date();
    const newTransactions: Transaction[] = [];

    transactions.forEach(transaction => {
      if (transaction.isRecurring && transaction.recurringRule) {
        const rule = transaction.recurringRule;
        const nextDate = new Date(rule.nextDate);

        // Generate transactions up to 30 days in advance
        while (nextDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
          // Check if we should generate this occurrence
          if (rule.count && rule.lastGenerated) {
            const generatedCount = transactions.filter(t => 
              t.templateId === transaction.id && 
              new Date(t.date) <= nextDate
            ).length;
            
            if (generatedCount >= rule.count) break;
          }

          // Check end date
          if (rule.endDate && nextDate > new Date(rule.endDate)) break;

          // Check if this transaction already exists
          const exists = transactions.some(t => 
            t.templateId === transaction.id && 
            new Date(t.date).toDateString() === nextDate.toDateString()
          );

          if (!exists) {
            const recurringTransaction: Transaction = {
              ...transaction,
              id: crypto.randomUUID(),
              date: nextDate.toISOString().split('T')[0],
              templateId: transaction.id,
              isRecurring: false, // Generated transactions are not recurring themselves
            };

            newTransactions.push(recurringTransaction);
          }

          // Calculate next occurrence
          this.calculateNextOccurrence(nextDate, rule);
          nextDate.setTime(nextDate.getTime() + 24 * 60 * 60 * 1000); // Move to next day
        }
      }
    });

    // Add new transactions to storage
    if (newTransactions.length > 0) {
      const allTransactions = [...transactions, ...newTransactions];
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(allTransactions));
      this.broadcastChange();
    }

    return newTransactions;
  }

  private calculateNextOccurrence(currentDate: Date, rule: any): Date {
    const next = new Date(currentDate);
    
    switch (rule.frequency) {
      case 'daily':
        next.setDate(next.getDate() + rule.interval);
        break;
      case 'weekly':
        next.setDate(next.getDate() + (7 * rule.interval));
        break;
      case 'biweekly':
        next.setDate(next.getDate() + (14 * rule.interval));
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + rule.interval);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + (3 * rule.interval));
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + rule.interval);
        break;
    }
    
    return next;
  }

  // Export/Import functionality
  exportData() {
    return {
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      budgets: this.getBudgets(),
      accounts: this.getAccounts(),
      templates: this.getTemplates(),
      exportDate: new Date().toISOString(),
    };
  }

  importData(data: any) {
    try {
      if (data.transactions) {
        const validTransactions = data.transactions.filter((t: any) => 
          transactionSchema.safeParse(t).success
        );
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(validTransactions));
      }

      if (data.categories) {
        const validCategories = data.categories.filter((c: any) => 
          categorySchema.safeParse(c).success
        );
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(validCategories));
      }

      if (data.budgets) {
        const validBudgets = data.budgets.filter((b: any) => 
          budgetSchema.safeParse(b).success
        );
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(validBudgets));
      }

      if (data.accounts) {
        const validAccounts = data.accounts.filter((a: any) => 
          accountSchema.safeParse(a).success
        );
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(validAccounts));
      }

      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Recycle Bin Methods
  getRecycleBinItems(): RecycleBinItem[] {
    try {
      const items = localStorage.getItem(STORAGE_KEYS.RECYCLE_BIN);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error getting recycle bin items:', error);
      return [];
    }
  }

  addToRecycleBin(item: Omit<RecycleBinItem, 'id' | 'deletedAt'>): RecycleBinItem {
    try {
      const recycleBinItem: RecycleBinItem = {
        ...item,
        id: crypto.randomUUID(),
        deletedAt: new Date().toISOString(),
      };

      const items = this.getRecycleBinItems();
      items.push(recycleBinItem);
      localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify(items));
      this.broadcastChange();
      return recycleBinItem;
    } catch (error) {
      console.error('Error adding to recycle bin:', error);
      throw error;
    }
  }

  restoreFromRecycleBin(id: string): boolean {
    try {
      const items = this.getRecycleBinItems();
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return false;

      const item = items[itemIndex];
      
      // Restore the original item based on its type
      switch (item.type) {
        case 'transaction':
          this.restoreTransaction(item.originalId);
          break;
        case 'category':
          this.addCategory(item.data);
          break;
        case 'budget':
          this.addBudget(item.data);
          break;
        case 'account':
          this.addAccount(item.data);
          break;
        case 'template':
          this.addTemplate(item.data);
          break;
        default:
          console.warn('Unknown item type:', item.type);
          return false;
      }

      // Remove from recycle bin
      items.splice(itemIndex, 1);
      localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify(items));
      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error restoring from recycle bin:', error);
      return false;
    }
  }

  permanentDeleteFromRecycleBin(id: string): boolean {
    try {
      const items = this.getRecycleBinItems();
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex === -1) return false;

      items.splice(itemIndex, 1);
      localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify(items));
      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error permanently deleting from recycle bin:', error);
      return false;
    }
  }

  emptyRecycleBin(): boolean {
    try {
      localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify([]));
      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error emptying recycle bin:', error);
      return false;
    }
  }

  // Soft delete methods for transactions
  softDeleteTransaction(id: string): boolean {
    try {
      const transactions = this.getAllTransactions();
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return false;

      // Add to recycle bin
      this.addToRecycleBin({
        type: 'transaction',
        originalId: id,
        data: transaction,
        deletedBy: 'user',
      });

      // Update transaction with deletedAt timestamp
      const updatedTransaction = { ...transaction, deletedAt: new Date().toISOString() };
      this.updateTransaction(id, updatedTransaction);
      return true;
    } catch (error) {
      console.error('Error soft deleting transaction:', error);
      return false;
    }
  }

  restoreTransaction(id: string): boolean {
    try {
      const transactions = this.getAllTransactions();
      const transaction = transactions.find(t => t.id === id);
      if (!transaction || !transaction.deletedAt) return false;

      // Remove deletedAt timestamp
      const restoredTransaction = { ...transaction, deletedAt: undefined };
      this.updateTransaction(id, restoredTransaction);
      
      // Remove from recycle bin
      const items = this.getRecycleBinItems();
      const itemIndex = items.findIndex(item => 
        item.type === 'transaction' && item.originalId === id
      );
      
      if (itemIndex !== -1) {
        items.splice(itemIndex, 1);
        localStorage.setItem(STORAGE_KEYS.RECYCLE_BIN, JSON.stringify(items));
      }
      
      this.broadcastChange();
      return true;
    } catch (error) {
      console.error('Error restoring transaction:', error);
      return false;
    }
  }
}

export const db = new LocalStorageDB();
