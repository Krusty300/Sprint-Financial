import { DashboardStats } from '@/lib/types';

export interface FinancialHealthScore {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    savingsRate: number;
    debtRatio: number;
    spendingControl: number;
    emergencyFund: number;
  };
  recommendations: string[];
}

export function calculateFinancialHealthScore(stats: DashboardStats): FinancialHealthScore {
  // Calculate savings rate (income - expenses) / income
  const savingsRate = stats.monthlyIncome > 0 
    ? ((stats.monthlyIncome - stats.monthlyExpenses) / stats.monthlyIncome) * 100 
    : 0;

  // Calculate debt ratio (assuming debt accounts have negative balances)
  const debtRatio = stats.totalBalance > 0 
    ? (Math.abs(Math.min(0, stats.totalBalance)) / stats.totalBalance) * 100 
    : 0;

  // Calculate spending control (budget adherence)
  const spendingControl = stats.budgetCount > 0 
    ? (1 - (stats.overdueTransactions / Math.max(1, stats.transactionCount))) * 100 
    : 50;

  // Calculate emergency fund (assuming 3 months of expenses is ideal)
  const emergencyFund = stats.totalBalance > 0 
    ? Math.min(100, (stats.totalBalance / (stats.monthlyExpenses * 3)) * 100) 
    : 0;

  // Calculate overall score (weighted average)
  const overallScore = (
    (savingsRate * 0.3) +
    ((100 - debtRatio) * 0.25) +
    (spendingControl * 0.25) +
    (emergencyFund * 0.2)
  );

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 75) grade = 'B';
  else if (overallScore >= 60) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  // Generate recommendations
  const recommendations: string[] = [];
  if (savingsRate < 20) {
    recommendations.push('Increase your savings rate to at least 20% of income');
  }
  if (debtRatio > 30) {
    recommendations.push('Focus on reducing debt to improve financial health');
  }
  if (spendingControl < 70) {
    recommendations.push('Review your budget adherence and reduce overspending');
  }
  if (emergencyFund < 50) {
    recommendations.push('Build an emergency fund covering at least 3 months of expenses');
  }
  if (recommendations.length === 0) {
    recommendations.push('Great job! Your financial health is excellent');
  }

  return {
    score: Math.round(overallScore),
    grade,
    components: {
      savingsRate: Math.round(savingsRate),
      debtRatio: Math.round(debtRatio),
      spendingControl: Math.round(spendingControl),
      emergencyFund: Math.round(emergencyFund)
    },
    recommendations
  };
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 75) return 'text-blue-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBackgroundColor(score: number): string {
  if (score >= 90) return 'bg-green-100 dark:bg-green-900/20';
  if (score >= 75) return 'bg-blue-100 dark:bg-blue-900/20';
  if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
  if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/20';
  return 'bg-red-100 dark:bg-red-900/20';
}
