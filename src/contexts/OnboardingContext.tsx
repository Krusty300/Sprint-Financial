'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the target element
  position?: 'top' | 'bottom' | 'left' | 'right';
  completed: boolean;
  skipped?: boolean;
}

export interface OnboardingProgress {
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  currentStep: number;
  isCompleted: boolean;
}

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  steps: OnboardingStep[];
  progress: OnboardingProgress;
  startOnboarding: () => void;
  completeStep: (stepId: string) => void;
  skipStep: (stepId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  pauseOnboarding: () => void;
  resumeOnboarding: () => void;
  resetOnboarding: () => void;
  skipOnboarding: () => void;
  setStepCompleted: (stepId: string, completed: boolean) => void;
  jumpToStep: (stepIndex: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sprint Financial!',
    content: 'Let us show you around the key features to help you get started with managing your finances.',
    target: '[data-onboarding="dashboard-title"]',
    position: 'bottom',
    completed: false,
  },
  {
    id: 'dashboard-overview',
    title: 'Dashboard Overview',
    content: 'This is your financial dashboard. Here you\'ll see your balance, income, expenses, and recent transactions at a glance.',
    target: '[data-onboarding="dashboard-cards"]',
    position: 'bottom',
    completed: false,
  },
  {
    id: 'sidebar-navigation',
    title: 'Navigation Sidebar',
    content: 'Use the sidebar to navigate between different sections. You can collapse it for more space.',
    target: '[data-onboarding="sidebar"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'transactions-page',
    title: 'Transactions Management',
    content: 'View, edit, and manage all your transactions here. You can filter, sort, and export your data.',
    target: '[data-onboarding="transactions-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'budgets',
    title: 'Budget Planning',
    content: 'Set and track budgets for different categories to help you stay within your financial goals.',
    target: '[data-onboarding="budgets-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'reports',
    title: 'Financial Reports',
    content: 'Generate detailed reports to analyze your spending patterns and financial health.',
    target: '[data-onboarding="reports-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'accounts',
    title: 'Accounts Management',
    content: 'Manage your bank accounts, credit cards, and cash accounts here. Track balances and account details.',
    target: '[data-onboarding="accounts-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'banking',
    title: 'Banking Integration',
    content: 'Connect your bank accounts for automatic transaction imports and real-time balance updates.',
    target: '[data-onboarding="banking-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'notifications',
    title: 'Notifications Center',
    content: 'Stay informed with budget alerts, transaction confirmations, and important financial updates.',
    target: '[data-onboarding="notifications-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'templates',
    title: 'Transaction Templates',
    content: 'Create templates for recurring transactions like rent, utilities, and subscriptions to save time.',
    target: '[data-onboarding="templates-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'recycle-bin',
    title: 'Recycle Bin',
    content: 'Accidentally deleted something? Restore deleted transactions and data from here within 30 days.',
    target: '[data-onboarding="recycle-bin-nav"]',
    position: 'right',
    completed: false,
  },
  {
    id: 'settings',
    title: 'Settings & Preferences',
    content: 'Customize your experience, import/export data, and manage your preferences here.',
    target: '[data-onboarding="settings-nav"]',
    position: 'right',
    completed: false,
  },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_STEPS);

  // Load onboarding state from localStorage
  useEffect(() => {
    const loadState = () => {
      const savedState = localStorage.getItem('onboarding-state');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          setSteps(parsed.steps || DEFAULT_STEPS);
          setCurrentStepIndex(parsed.currentStepIndex || 0);
          setIsActive(parsed.isActive || false);
        } catch (error) {
          console.error('Failed to load onboarding state:', error);
        }
      }
      setIsLoaded(true);
    };

    loadState();
  }, []);

  // Save onboarding state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    
    const stateToSave = {
      isActive,
      currentStepIndex,
      steps,
    };
    localStorage.setItem('onboarding-state', JSON.stringify(stateToSave));
  }, [isActive, currentStepIndex, steps, isLoaded]);

  // Calculate progress
  const progress: OnboardingProgress = {
    totalSteps: steps.length,
    completedSteps: steps.filter(step => step.completed).length,
    percentage: Math.round((steps.filter(step => step.completed).length / steps.length) * 100),
    currentStep: currentStepIndex + 1,
    isCompleted: steps.every(step => step.completed),
  };

  const startOnboarding = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const completeStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
  };

  const skipStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, skipped: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsActive(false);
    }
  };

  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const jumpToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStepIndex(stepIndex);
      setIsActive(true);
    }
  };

  const pauseOnboarding = () => {
    setIsActive(false);
  };

  const resumeOnboarding = () => {
    setIsActive(true);
  };

  const resetOnboarding = () => {
    setSteps(DEFAULT_STEPS.map(step => ({ ...step, completed: false, skipped: false })));
    setCurrentStepIndex(0);
    setIsActive(false);
  };

  const skipOnboarding = () => {
    setIsActive(false);
    setSteps(prev => prev.map(step => ({ ...step, skipped: true })));
  };

  const setStepCompleted = (stepId: string, completed: boolean) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed } : step
    ));
  };

  // Prevent rendering until onboarding state is loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        steps,
        progress,
        startOnboarding,
        completeStep,
        skipStep,
        nextStep,
        previousStep,
        pauseOnboarding,
        resumeOnboarding,
        resetOnboarding,
        skipOnboarding,
        setStepCompleted,
        jumpToStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
