import { BudgetTemplate } from '@/lib/types';

export const budgetTemplates: BudgetTemplate[] = [
  {
    id: 'student',
    name: 'Student Budget',
    description: 'Balanced budget for students with focus on essentials and education',
    category: 'student',
    totalBudget: 1500,
    period: 'monthly',
    isRecommended: true,
    allocations: [
      { categoryName: 'Housing', percentage: 35, description: 'Rent, utilities, internet' },
      { categoryName: 'Food', percentage: 20, description: 'Groceries and dining' },
      { categoryName: 'Transportation', percentage: 10, description: 'Public transit, gas' },
      { categoryName: 'Education', percentage: 15, description: 'Books, supplies, courses' },
      { categoryName: 'Entertainment', percentage: 10, description: 'Movies, games, hobbies' },
      { categoryName: 'Personal Care', percentage: 5, description: 'Healthcare, hygiene' },
      { categoryName: 'Savings', percentage: 5, description: 'Emergency fund' },
    ],
  },
  {
    id: 'family',
    name: 'Family Budget',
    description: 'Comprehensive budget for families with children',
    category: 'family',
    totalBudget: 5000,
    period: 'monthly',
    isRecommended: true,
    allocations: [
      { categoryName: 'Housing', percentage: 30, description: 'Mortgage/rent, utilities' },
      { categoryName: 'Food', percentage: 15, description: 'Groceries and family meals' },
      { categoryName: 'Transportation', percentage: 12, description: 'Car payments, gas, insurance' },
      { categoryName: 'Childcare', percentage: 15, description: 'Daycare, babysitting' },
      { categoryName: 'Education', percentage: 8, description: 'School supplies, activities' },
      { categoryName: 'Healthcare', percentage: 8, description: 'Insurance, medical expenses' },
      { categoryName: 'Entertainment', percentage: 7, description: 'Family activities' },
      { categoryName: 'Savings', percentage: 5, description: 'Family savings' },
    ],
  },
  {
    id: 'minimalist',
    name: 'Minimalist Budget',
    description: 'Simple budget focused on essential expenses only',
    category: 'minimalist',
    totalBudget: 2000,
    period: 'monthly',
    allocations: [
      { categoryName: 'Housing', percentage: 40, description: 'Rent, utilities' },
      { categoryName: 'Food', percentage: 25, description: 'Essential groceries' },
      { categoryName: 'Transportation', percentage: 15, description: 'Essential commuting' },
      { categoryName: 'Healthcare', percentage: 10, description: 'Medical expenses' },
      { categoryName: 'Savings', percentage: 10, description: 'Emergency fund' },
    ],
  },
  {
    id: 'professional',
    name: 'Professional Budget',
    description: 'Budget for working professionals with career development focus',
    category: 'professional',
    totalBudget: 4000,
    period: 'monthly',
    isRecommended: true,
    allocations: [
      { categoryName: 'Housing', percentage: 30, description: 'Rent/mortgage, utilities' },
      { categoryName: 'Food', percentage: 15, description: 'Groceries, dining out' },
      { categoryName: 'Transportation', percentage: 12, description: 'Car, transit, travel' },
      { categoryName: 'Professional Development', percentage: 10, description: 'Courses, conferences' },
      { categoryName: 'Entertainment', percentage: 10, description: 'Social activities' },
      { categoryName: 'Personal Care', percentage: 8, description: 'Healthcare, wellness' },
      { categoryName: 'Technology', percentage: 5, description: 'Software, devices' },
      { categoryName: 'Savings', percentage: 10, description: 'Investments, emergency fund' },
    ],
  },
  {
    id: 'retired',
    name: 'Retired Budget',
    description: 'Budget for retirees with healthcare and leisure focus',
    category: 'retired',
    totalBudget: 3500,
    period: 'monthly',
    allocations: [
      { categoryName: 'Housing', percentage: 35, description: 'Mortgage, maintenance, utilities' },
      { categoryName: 'Food', percentage: 18, description: 'Groceries, dining' },
      { categoryName: 'Healthcare', percentage: 20, description: 'Insurance, medications, care' },
      { categoryName: 'Transportation', percentage: 10, description: 'Car, transit' },
      { categoryName: 'Entertainment', percentage: 12, description: 'Hobbies, travel' },
      { categoryName: 'Gifts', percentage: 5, description: 'Family gifts, donations' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom Budget',
    description: 'Start from scratch and create your own budget',
    category: 'custom',
    totalBudget: 0,
    period: 'monthly',
    allocations: [],
  },
];

export const getTemplateById = (id: string): BudgetTemplate | undefined => {
  return budgetTemplates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): BudgetTemplate[] => {
  return budgetTemplates.filter(template => template.category === category);
};

export const getRecommendedTemplates = (): BudgetTemplate[] => {
  return budgetTemplates.filter(template => template.isRecommended);
};

export const calculateAllocationAmount = (totalBudget: number, percentage: number): number => {
  return (totalBudget * percentage) / 100;
};
