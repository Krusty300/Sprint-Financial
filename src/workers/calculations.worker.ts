/**
 * Web Worker for heavy financial calculations
 */

// Types for worker messages
interface WorkerMessage {
  id: string;
  type: 'calculate_stats' | 'filter_transactions' | 'calculate_budgets' | 'generate_report';
  data: any;
}

interface WorkerResponse {
  id: string;
  result: any;
  error?: string;
}

// Heavy calculation functions
function calculateTransactionStats(transactions: any[]) {
  const stats = {
    totalIncome: 0,
    totalExpenses: 0,
    totalTransactions: transactions.length,
    averageTransaction: 0,
    categoryBreakdown: {} as Record<string, number>,
    monthlyBreakdown: {} as Record<string, number>,
    dailyAverage: 0
  };

  let sum = 0;
  const now = new Date();
  
  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount) || 0;
    sum += Math.abs(amount);
    
    if (amount > 0) {
      stats.totalIncome += amount;
    } else {
      stats.totalExpenses += Math.abs(amount);
    }
    
    // Category breakdown
    const category = transaction.category || 'Uncategorized';
    stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + Math.abs(amount);
    
    // Monthly breakdown
    const monthKey = new Date(transaction.date).toISOString().slice(0, 7);
    stats.monthlyBreakdown[monthKey] = (stats.monthlyBreakdown[monthKey] || 0) + Math.abs(amount);
  });
  
  stats.averageTransaction = stats.totalTransactions > 0 ? sum / stats.totalTransactions : 0;
  stats.dailyAverage = stats.totalTransactions > 0 ? sum / 30 : 0; // Approximate daily average
  
  return stats;
}

function filterTransactions(transactions: any[], filters: any) {
  return transactions.filter(transaction => {
    // Date range filter
    if (filters.startDate && new Date(transaction.date) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(transaction.date) > new Date(filters.endDate)) {
      return false;
    }
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(transaction.category)) {
        return false;
      }
    }
    
    // Amount range filter
    const amount = Math.abs(parseFloat(transaction.amount) || 0);
    if (filters.minAmount !== undefined && amount < filters.minAmount) {
      return false;
    }
    if (filters.maxAmount !== undefined && amount > filters.maxAmount) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const description = (transaction.description || '').toLowerCase();
      const category = (transaction.category || '').toLowerCase();
      const account = (transaction.account || '').toLowerCase();
      
      if (!description.includes(searchLower) && 
          !category.includes(searchLower) && 
          !account.includes(searchLower)) {
        return false;
      }
    }
    
    // Type filter
    if (filters.type && filters.type !== 'all') {
      const transactionAmount = parseFloat(transaction.amount) || 0;
      if (filters.type === 'income' && transactionAmount <= 0) return false;
      if (filters.type === 'expense' && transactionAmount > 0) return false;
    }
    
    return true;
  });
}

function calculateBudgetPerformance(budgets: any[], transactions: any[], period: 'monthly' | 'yearly' = 'monthly') {
  const now = new Date();
  const currentPeriod = period === 'monthly' 
    ? now.toISOString().slice(0, 7)
    : now.toISOString().slice(0, 4);
  
  return budgets.map(budget => {
    const budgetPeriod = period === 'monthly'
      ? new Date(budget.startDate || budget.date).toISOString().slice(0, 7)
      : new Date(budget.startDate || budget.date).toISOString().slice(0, 4);
    
    const budgetTransactions = transactions.filter(transaction => {
      const transactionPeriod = period === 'monthly'
        ? new Date(transaction.date).toISOString().slice(0, 7)
        : new Date(transaction.date).toISOString().slice(0, 4);
      
      return transactionPeriod === budgetPeriod && 
             transaction.category === budget.category;
    });
    
    const spent = budgetTransactions.reduce((sum, transaction) => {
      const amount = parseFloat(transaction.amount) || 0;
      return sum + (amount < 0 ? Math.abs(amount) : 0);
    }, 0);
    
    const budgetAmount = parseFloat(budget.amount) || 0;
    const remaining = budgetAmount - spent;
    const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    
    return {
      ...budget,
      spent,
      remaining,
      percentageUsed,
      isOverBudget: remaining < 0,
      isCurrentPeriod: budgetPeriod === currentPeriod,
      transactionCount: budgetTransactions.length
    };
  });
}

function generateFinancialReport(transactions: any[], categories: any[], accounts: any[]) {
  const stats = calculateTransactionStats(transactions);
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Find top spending categories
  const topCategories = Object.entries(stats.categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([category, amount]) => ({ category, amount }));
  
  // Find largest transactions
  const largestTransactions = sortedTransactions
    .filter(t => parseFloat(t.amount) < 0)
    .slice(0, 10)
    .map(t => ({
      ...t,
      amount: Math.abs(parseFloat(t.amount))
    }));
  
  // Account balances
  const accountBalances = accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.account === account.name);
    const balance = accountTransactions.reduce((sum, t) => 
      sum + (parseFloat(t.amount) || 0), 0
    );
    
    return {
      ...account,
      currentBalance: balance
    };
  });
  
  // Monthly trends
  const monthlyTrends = Object.entries(stats.monthlyBreakdown)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return {
    summary: stats,
    topCategories,
    largestTransactions,
    accountBalances,
    monthlyTrends,
    generatedAt: new Date().toISOString(),
    totalTransactions: transactions.length
  };
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'calculate_stats':
        result = calculateTransactionStats(data.transactions);
        break;
        
      case 'filter_transactions':
        result = filterTransactions(data.transactions, data.filters);
        break;
        
      case 'calculate_budgets':
        result = calculateBudgetPerformance(data.budgets, data.transactions, data.period);
        break;
        
      case 'generate_report':
        result = generateFinancialReport(data.transactions, data.categories, data.accounts);
        break;
        
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }
    
    const response: WorkerResponse = { id, result };
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = { 
      id, 
      result: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
    self.postMessage(response);
  }
});

// Export types for external use
export type { WorkerMessage, WorkerResponse };
