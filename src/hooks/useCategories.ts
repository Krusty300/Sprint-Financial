import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/lib/types';
import { db } from '@/lib/db';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { toast } from 'sonner';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(() => {
    setLoading(true);
    try {
      const data = db.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced version to prevent event storms
  const debouncedLoadCategories = useDebounceCallback(loadCategories, 300);

  useEffect(() => {
    loadCategories();

    const handleStorageChange = () => {
      debouncedLoadCategories();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [debouncedLoadCategories]);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    try {
      const newCategory = db.addCategory(category);
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category added successfully');
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category. Please try again.');
      throw error;
    }
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    try {
      const updated = db.updateCategory(id, updates);
      if (updated) {
        setCategories(prev => 
          prev.map(c => c.id === id ? updated : c)
        );
      }
      return updated;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }, []);

  const deleteCategory = useCallback((id: string) => {
    try {
      const success = db.deleteCategory(id);
      if (success) {
        setCategories(prev => prev.filter(c => c.id !== id));
      }
      return success;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }, []);

  const getCategoriesByType = useCallback((type: 'income' | 'expense') => {
    return categories.filter(c => c.type === type);
  }, [categories]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
    getCategoryById,
    refreshCategories: loadCategories,
  };
}
