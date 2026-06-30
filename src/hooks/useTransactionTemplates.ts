import { useState, useEffect, useCallback } from 'react';
import { TransactionTemplate, Transaction } from '@/lib/types';
import { db } from '@/lib/db';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { validateTemplateUsage } from '@/utils/templateValidation';

export function useTransactionTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  const loadTemplates = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getTemplates();
      // Sort by usage count and last used
      const sortedTemplates = data.sort((a, b) => {
        if (a.isQuickAdd && !b.isQuickAdd) return -1;
        if (!a.isQuickAdd && b.isQuickAdd) return 1;
        if (a.lastUsed && b.lastUsed) {
          return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
        }
        return b.usageCount - a.usageCount;
      });
      setTemplates(sortedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version to prevent event storms
  const debouncedLoadTemplates = useDebounceCallback(loadTemplates, 300);

  useEffect(() => {
    loadTemplates();

    const handleStorageChange = () => {
      debouncedLoadTemplates();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [debouncedLoadTemplates]);

  const addTemplate = useCallback((template: Omit<TransactionTemplate, 'id' | 'usageCount'>) => {
    try {
      const newTemplate = db.addTemplate(template);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      throw error;
    }
  }, []);

  const updateTemplate = useCallback(async (id: string, updates: Partial<TransactionTemplate>) => {
    // Prevent concurrent updates for the same template
    if (updatingIds.has(id)) {
      console.warn(`Template ${id} is already being updated, skipping concurrent update`);
      return null;
    }

    try {
      // Mark as updating
      setUpdatingIds(prev => new Set(prev).add(id));

      const updated = db.updateTemplate(id, updates);
      if (updated) {
        setTemplates(prev => 
          prev.map(t => t.id === id ? updated : t)
        );
      }
      return updated;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    } finally {
      // Clear updating flag
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }, [updatingIds]);

  const deleteTemplate = useCallback((id: string) => {
    try {
      const success = db.deleteTemplate(id);
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        throw new Error('Template not found or could not be deleted');
      }
      return success;
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete template: ${errorMessage}`);
    }
  }, []);

  const useTemplate = useCallback(async (template: TransactionTemplate): Promise<Omit<Transaction, 'id'>> => {
    // Validate template before usage
    const errors = validateTemplateUsage(template);
    if (errors.length > 0) {
      throw new Error(`Template validation failed: ${errors.map(e => e.message).join(', ')}`);
    }

    // Increment usage count with race condition protection
    try {
      // Get current template data to ensure we have the latest count
      const currentTemplates = db.getTemplates();
      const currentTemplate = currentTemplates.find(t => t.id === template.id);
      const currentCount = currentTemplate?.usageCount || 0;
      
      await updateTemplate(template.id, { 
        usageCount: currentCount + 1,
        lastUsed: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Failed to update template usage count:', error);
      // Continue with template usage even if count update fails
    }

    // Return transaction data from template
    return {
      amount: template.amount,
      type: template.type,
      category: template.category,
      date: new Date().toISOString().split('T')[0],
      description: template.name,
      account: template.account,
      tags: template.tags,
      splits: template.splits,
    };
  }, [updateTemplate]);

  const getQuickAddTemplates = useCallback(() => {
    return templates.filter(t => t.isQuickAdd);
  }, [templates]);

  const getMostUsedTemplates = useCallback((limit = 5) => {
    return templates
      .filter(t => !t.isQuickAdd)
      .slice(0, limit);
  }, [templates]);

  const createTemplateFromTransaction = useCallback((transaction: Transaction, name: string) => {
    const template: Omit<TransactionTemplate, 'id' | 'usageCount'> = {
      name,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      account: transaction.account,
      tags: transaction.tags,
      splits: transaction.splits,
      isQuickAdd: false,
      icon: getCategoryIcon(transaction.category),
      color: getCategoryColor(transaction.category),
    };

    return addTemplate(template);
  }, [addTemplate]);

  return {
    templates,
    loading,
    updatingIds,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    useTemplate,
    getQuickAddTemplates,
    getMostUsedTemplates,
    createTemplateFromTransaction,
    refreshTemplates: loadTemplates,
  };
}

// Helper functions (you may want to move these to a utils file)
function getCategoryIcon(category: string): string {
  const iconMap: Record<string, string> = {
    'Salary': '💰',
    'Freelance': '💼',
    'Investments': '📈',
    'Food': '🍔',
    'Transport': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎮',
    'Bills': '📄',
    'Healthcare': '🏥',
    'Education': '📚',
  };
  return iconMap[category] || '📌';
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Salary': '#10b981',
    'Freelance': '#3b82f6',
    'Investments': '#8b5cf6',
    'Food': '#ef4444',
    'Transport': '#f59e0b',
    'Shopping': '#ec4899',
    'Entertainment': '#8b5cf6',
    'Bills': '#6366f1',
    'Healthcare': '#14b8a6',
    'Education': '#84cc16',
  };
  return colorMap[category] || '#64748b';
}
