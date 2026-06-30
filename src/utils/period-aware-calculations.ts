import { Budget, Transaction } from '@/lib/types';

export function getPeriodStartEnd(budget: Budget, referenceDate: Date = new Date()) {
  // Validate referenceDate
  const safeReferenceDate = referenceDate instanceof Date && !isNaN(referenceDate.getTime()) 
    ? referenceDate 
    : new Date();
  
  const { period, startDate, endDate } = budget;
  
  console.log('getPeriodStartEnd called for budget:', {
    budgetId: budget.id,
    period,
    startDate,
    endDate,
    referenceDate: safeReferenceDate.toISOString()
  });
  
  // Validate budget structure
  if (!budget || !period) {
    console.warn('Invalid budget structure:', budget);
    // Default to current month
    const now = safeReferenceDate;
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    };
  }
  
  if (period === 'custom' && startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate custom dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid custom dates:', { startDate, endDate });
      // Fallback to current month
      const now = safeReferenceDate;
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      };
    }
    
    return { start, end };
  }

  const now = safeReferenceDate;
  let start: Date;
  let end: Date;

  switch (period) {
    case 'weekly':
      // Get start of current week (Sunday)
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      
      // Get end of current week (Saturday)
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;

    case 'biweekly':
      // For simplicity, use 1st and 15th of the month as biweekly periods
      if (now.getDate() <= 15) {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 16);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      break;

    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;

    case 'quarterly':
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterStart, 1);
      end = new Date(now.getFullYear(), quarterStart + 3, 0, 23, 59, 59, 999);
      break;

    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;

    default:
      // Default to monthly if period is unrecognized
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
  }

  return { start, end };
}

export function calculatePeriodSpending(budget: Budget, transactions: Transaction[]): number {
  // Validate inputs
  if (!budget || !Array.isArray(transactions)) {
    console.warn('Invalid inputs for calculatePeriodSpending:', { budget, transactions });
    return 0;
  }
  
  const { start, end } = getPeriodStartEnd(budget);
  console.log('calculatePeriodSpending for budget:', {
    budgetId: budget.id,
    category: budget.category,
    period: budget.period,
    periodRange: { start: start.toISOString(), end: end.toISOString() },
    totalTransactions: transactions.length
  });
  
  const filteredTransactions = transactions
    .filter(t => 
      t && 
      t.type === 'expense' && 
      t.category === budget.category &&
      !t.deletedAt &&
      t.date &&
      typeof t.amount === 'number' && t.amount >= 0
    )
    .filter(t => {
      const transactionDate = new Date(t.date);
      // Validate transaction date
      if (isNaN(transactionDate.getTime())) {
        console.warn('Invalid transaction date:', t.date);
        return false;
      }
      return transactionDate >= start && transactionDate <= end;
    });
  
  const totalSpent = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  console.log('calculatePeriodSpending result:', {
    matchedTransactions: filteredTransactions.length,
    totalSpent
  });
  
  return totalSpent;
}

export function getPeriodDisplayText(budget: Budget): string {
  console.log('getPeriodDisplayText called with budget:', budget);
  
  const periodLabels = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    custom: 'Custom'
  };
  
  const baseLabel = periodLabels[budget.period] || budget.period;
  
  if (budget.period === 'custom' && budget.startDate && budget.endDate) {
    const start = new Date(budget.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = new Date(budget.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const displayText = `${baseLabel}: ${start} - ${end}`;
    console.log('Custom period display text:', displayText);
    return displayText;
  }
  
  console.log('Standard period display text:', baseLabel);
  return baseLabel;
}

export function getPeriodProgress(budget: Budget): number {
  try {
    const { start, end } = getPeriodStartEnd(budget);
    const now = new Date();
    
    // Validate dates
    if (!(start instanceof Date) || !(end instanceof Date) || 
        isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalDuration = end.getTime() - start.getTime();
    if (totalDuration <= 0) return 0; // Prevent division by zero
    
    const elapsedDuration = now.getTime() - start.getTime();
    
    return Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  } catch (error) {
    console.warn('Error calculating period progress:', error);
    return 0;
  }
}
