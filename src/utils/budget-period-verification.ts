import { Budget, Transaction } from '@/lib/types';
import { getPeriodStartEnd, calculatePeriodSpending } from './period-aware-calculations';

export function verifyBudgetPeriods(budgets: Budget[], transactions: Transaction[]) {
  const verificationResults = budgets.map(budget => {
    const { start, end } = getPeriodStartEnd(budget);
    const spent = calculatePeriodSpending(budget, transactions);
    
    // Count transactions in this period for debugging
    const periodTransactions = transactions.filter(t => {
      if (t.type !== 'expense' || t.category !== budget.category || t.deletedAt) return false;
      const transactionDate = new Date(t.date);
      return transactionDate >= start && transactionDate <= end;
    });

    return {
      budgetId: budget.id,
      category: budget.category,
      period: budget.period,
      periodRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      customDates: budget.period === 'custom' ? {
        startDate: budget.startDate,
        endDate: budget.endDate
      } : null,
      calculatedSpent: spent,
      transactionCount: periodTransactions.length,
      transactions: periodTransactions.map(t => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description
      })),
      budgetAmount: budget.amount,
      remaining: budget.amount - spent,
      percentageUsed: budget.amount > 0 ? (spent / budget.amount) * 100 : 0
    };
  });

  return verificationResults;
}

export function detectPeriodIssues(budgets: Budget[], transactions: Transaction[]) {
  const results = verifyBudgetPeriods(budgets, transactions);
  const issues = [];

  for (const result of results) {
    // Check for custom period issues
    if (result.period === 'custom') {
      if (!result.customDates?.startDate || !result.customDates?.endDate) {
        issues.push({
          type: 'missing_custom_dates',
          budgetId: result.budgetId,
          category: result.category,
          message: 'Custom period budget missing start or end date'
        });
      }
    }

    // Check for negative spending (shouldn't happen)
    if (result.calculatedSpent < 0) {
      issues.push({
        type: 'negative_spending',
        budgetId: result.budgetId,
        category: result.category,
        message: `Negative spending calculated: ${result.calculatedSpent}`
      });
    }

    // Check for unusually high spending (potential calculation error)
    if (result.calculatedSpent > result.budgetAmount * 5) {
      issues.push({
        type: 'unusual_high_spending',
        budgetId: result.budgetId,
        category: result.category,
        message: `Spending (${result.calculatedSpent}) is 5x+ budget amount (${result.budgetAmount})`
      });
    }
  }

  return issues;
}
