import { Budget } from '@/lib/types';

export interface ArchiveCleanupConfig {
  monthsToKeep: number;
  autoCleanup: boolean;
}

const DEFAULT_CONFIG: ArchiveCleanupConfig = {
  monthsToKeep: 6,
  autoCleanup: true,
};

export function getArchiveCleanupConfig(): ArchiveCleanupConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  
  const saved = localStorage.getItem('archiveCleanupConfig');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function setArchiveCleanupConfig(config: ArchiveCleanupConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('archiveCleanupConfig', JSON.stringify(config));
}

export function shouldCleanupArchivedBudget(budget: Budget, config: ArchiveCleanupConfig): boolean {
  if (!config.autoCleanup || !budget.archivedAt) return false;
  
  const archivedDate = new Date(budget.archivedAt);
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - config.monthsToKeep);
  
  return archivedDate < cutoffDate;
}

export function getBudgetsToCleanup(budgets: Budget[]): Budget[] {
  const config = getArchiveCleanupConfig();
  return budgets.filter(b => shouldCleanupArchivedBudget(b, config));
}

export async function cleanupArchivedBudgets(
  budgets: Budget[],
  deleteBudget: (id: string) => Promise<boolean>
): Promise<{ deleted: number; failed: number }> {
  const budgetsToDelete = getBudgetsToCleanup(budgets);
  let deleted = 0;
  let failed = 0;

  for (const budget of budgetsToDelete) {
    try {
      const success = await deleteBudget(budget.id);
      if (success) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to delete archived budget ${budget.id}:`, error);
      failed++;
    }
  }

  return { deleted, failed };
}
