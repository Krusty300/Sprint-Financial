import { useState, useEffect, useCallback } from 'react';
import { 
  BankAccount, 
  BankTransaction, 
  BankSync, 
  ImportRule, 
  ReconciliationReport,
  BankFeed,
  BankAggregation,
  TransactionCategorization
} from '@/lib/types';
import { bankIntegrationService } from '@/services/bankIntegration';
import { bankAggregationService } from '@/services/bankAggregation';
import { transactionCategorizationService } from '@/services/transactionCategorization';
import { financialInstitutionsService } from '@/services/financialInstitutions';

export function useBankIntegration() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [syncs, setSyncs] = useState<BankSync[]>([]);
  const [importRules, setImportRules] = useState<ImportRule[]>([]);
  const [reconciliationReports, setReconciliationReports] = useState<ReconciliationReport[]>([]);
  const [aggregations, setAggregations] = useState<BankAggregation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    try {
      setBankAccounts(bankIntegrationService.getBankAccounts());
      setBankTransactions(bankIntegrationService.getBankTransactions());
      setSyncs(bankIntegrationService.getBankSyncs());
      setImportRules(bankIntegrationService.getImportRules());
      setReconciliationReports(bankIntegrationService.getReconciliationReports());
      setAggregations(bankAggregationService.getAggregations());
    } catch (error) {
      console.error('Error loading bank integration data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);

  // Bank Account Management
  const linkBankAccount = useCallback(async (bankAccount: Omit<BankAccount, 'id'>) => {
    try {
      const newAccount = await bankIntegrationService.linkBankAccount(bankAccount);
      setBankAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (error) {
      console.error('Error linking bank account:', error);
      throw error;
    }
  }, []);

  const unlinkBankAccount = useCallback(async (bankAccountId: string) => {
    try {
      const success = await bankIntegrationService.unlinkBankAccount(bankAccountId);
      if (success) {
        setBankAccounts(prev => prev.filter(account => account.id !== bankAccountId));
      }
      return success;
    } catch (error) {
      console.error('Error unlinking bank account:', error);
      throw error;
    }
  }, []);

  const updateBankAccount = useCallback(async (id: string, updates: Partial<BankAccount>) => {
    try {
      const updatedAccount = await bankIntegrationService.updateBankAccount(id, updates);
      if (updatedAccount) {
        setBankAccounts(prev => prev.map(account => 
          account.id === id ? updatedAccount : account
        ));
      }
      return updatedAccount;
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  }, []);

  // Transaction Sync
  const syncBankTransactions = useCallback(async (bankAccountId: string) => {
    try {
      const sync = await bankIntegrationService.syncBankTransactions(bankAccountId);
      setSyncs(prev => [...prev, sync]);
      
      // Reload data after sync
      setTimeout(() => {
        loadData();
      }, 1000);
      
      return sync;
    } catch (error) {
      console.error('Error syncing bank transactions:', error);
      throw error;
    }
  }, [loadData]);

  // Import Rules Management
  const createImportRule = useCallback(async (rule: Omit<ImportRule, 'id'>) => {
    try {
      const newRule = await bankIntegrationService.createImportRule(rule);
      setImportRules(prev => [...prev, newRule]);
      return newRule;
    } catch (error) {
      console.error('Error creating import rule:', error);
      throw error;
    }
  }, []);

  // Reconciliation
  const generateReconciliationReport = useCallback(async (bankAccountId: string, period: string) => {
    try {
      const report = await bankIntegrationService.generateReconciliationReport(bankAccountId, period);
      setReconciliationReports(prev => [...prev, report]);
      return report;
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }, []);

  // CSV Import
  const importFromCSV = useCallback(async (file: File, bankAccountId: string) => {
    try {
      const sync = await bankIntegrationService.importFromCSV(file, bankAccountId);
      setSyncs(prev => [...prev, sync]);
      
      // Reload data after import
      setTimeout(() => {
        loadData();
      }, 1000);
      
      return sync;
    } catch (error) {
      console.error('Error importing from CSV:', error);
      throw error;
    }
  }, [loadData]);

  // Get bank transactions for specific account
  const getBankTransactions = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return bankTransactions.filter(t => t.bankAccountId === bankAccountId);
    }
    return bankTransactions;
  }, [bankTransactions]);

  // Get syncs for specific account
  const getSyncs = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return syncs.filter(s => s.bankAccountId === bankAccountId);
    }
    return syncs;
  }, [syncs]);

  // Get reconciliation reports for specific account
  const getReconciliationReports = useCallback((bankAccountId?: string) => {
    if (bankAccountId) {
      return reconciliationReports.filter(r => r.bankAccountId === bankAccountId);
    }
    return reconciliationReports;
  }, [reconciliationReports]);

  // Bank Feed Status
  const getBankFeedStatus = useCallback((): BankFeed => {
    const activeAccounts = bankAccounts.filter(account => account.isActive);
    const totalAccounts = bankAccounts.length;
    const totalTransactions = bankTransactions.length;
    const errorCount = bankAccounts.filter(account => account.syncStatus === 'error').length;
    const lastSync = bankAccounts
      .filter(account => account.lastSync)
      .map(account => account.lastSync)
      .sort()
      .pop() || '';

    const nextSync = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Per-account status
    const perAccountStatus: BankFeed['perAccountStatus'] = {};
    bankAccounts.forEach(account => {
      perAccountStatus[account.id] = {
        status: account.feedStatus?.status || (account.isActive ? 'active' : 'inactive'),
        lastSync: account.lastSync,
        nextSync: account.autoSync ? nextSync : '',
        errorMessage: account.feedStatus?.errorMessage
      };
    });

    return {
      id: 'main-feed',
      provider: 'plaid',
      status: errorCount > 0 ? 'error' : activeAccounts.length > 0 ? 'active' : 'inactive',
      lastSync,
      nextSync,
      totalAccounts,
      totalTransactions,
      errorCount,
      settings: {
        autoCategorization: true,
        duplicateDetection: true,
        reconciliationEnabled: true
      },
      perAccountStatus
    };
  }, [bankAccounts, bankTransactions]);

  // Bank Aggregation
  const createAggregation = useCallback((name: string, accountIds: string[], currency: string, autoSync?: boolean) => {
    const aggregation = bankAggregationService.createAggregation(name, accountIds, currency, autoSync);
    setAggregations(prev => [...prev, aggregation]);
    return aggregation;
  }, []);

  const updateAggregation = useCallback((id: string, updates: Partial<BankAggregation>) => {
    const updated = bankAggregationService.updateAggregation(id, updates);
    if (updated) {
      setAggregations(prev => prev.map(agg => agg.id === id ? updated : agg));
    }
    return updated;
  }, []);

  const deleteAggregation = useCallback((id: string) => {
    const success = bankAggregationService.deleteAggregation(id);
    if (success) {
      setAggregations(prev => prev.filter(agg => agg.id !== id));
    }
    return success;
  }, []);

  const syncAggregations = useCallback(() => {
    bankAggregationService.syncAllAggregations(bankAccounts);
    setAggregations(bankAggregationService.getAggregations());
  }, [bankAccounts]);

  const getAggregationStats = useCallback((aggregationId: string) => {
    return bankAggregationService.getAggregationStats(aggregationId, bankAccounts, bankTransactions);
  }, [bankAccounts, bankTransactions]);

  // Transaction Categorization
  const categorizeTransaction = useCallback((transaction: BankTransaction): TransactionCategorization => {
    return transactionCategorizationService.categorizeTransaction(transaction);
  }, []);

  const categorizeTransactions = useCallback((transactions: BankTransaction[]): TransactionCategorization[] => {
    return transactionCategorizationService.categorizeTransactions(transactions);
  }, []);

  const learnFromCorrection = useCallback((transactionId: string, correctCategory: string) => {
    transactionCategorizationService.learnFromCorrection(transactionId, correctCategory);
  }, []);

  const getCategorySuggestions = useCallback((text: string) => {
    return transactionCategorizationService.getCategorySuggestions(text);
  }, []);

  // Financial Institutions
  const getFinancialInstitutions = useCallback(() => {
    return financialInstitutionsService.getAllInstitutions();
  }, []);

  const getInstitutionsByCountry = useCallback((country: string) => {
    return financialInstitutionsService.getInstitutionsByCountry(country);
  }, []);

  const searchInstitutions = useCallback((query: string) => {
    return financialInstitutionsService.searchInstitutions(query);
  }, []);

  return {
    // Data
    bankAccounts,
    bankTransactions,
    syncs,
    importRules,
    reconciliationReports,
    aggregations,
    loading,
    bankFeedStatus: getBankFeedStatus(),

    // Bank Account Management
    linkBankAccount,
    unlinkBankAccount,
    updateBankAccount,

    // Transaction Sync
    syncBankTransactions,

    // Import Rules
    createImportRule,

    // Reconciliation
    generateReconciliationReport,

    // CSV Import
    importFromCSV,

    // Getters
    getBankTransactions,
    getSyncs,
    getReconciliationReports,

    // Bank Aggregation
    createAggregation,
    updateAggregation,
    deleteAggregation,
    syncAggregations,
    getAggregationStats,

    // Transaction Categorization
    categorizeTransaction,
    categorizeTransactions,
    learnFromCorrection,
    getCategorySuggestions,

    // Financial Institutions
    getFinancialInstitutions,
    getInstitutionsByCountry,
    searchInstitutions,

    // Refresh
    refresh: loadData
  };
}
