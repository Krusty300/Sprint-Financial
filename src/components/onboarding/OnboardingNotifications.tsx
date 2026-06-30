'use client';

import { useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { toast } from 'sonner';
import { getOnboardingStorage } from '@/utils/storageHelpers';

export function OnboardingNotifications() {
  const { progress, isActive, startOnboarding } = useOnboarding();
  const storage = getOnboardingStorage();

  // Show welcome notification for first-time users
  useEffect(() => {
    const hasSeenWelcome = storage.getWelcomeSeen();
    const hasSkippedOnboarding = storage.getSkipped();
    
    if (!hasSeenWelcome && !hasSkippedOnboarding && progress.percentage === 0 && !isActive) {
      setTimeout(() => {
        toast('Welcome to Sprint Financial! 👋', {
          description: 'Take a quick tour to learn about all the features.',
          action: {
            label: 'Start Tour',
            onClick: () => {
              startOnboarding();
              storage.setWelcomeSeen(true);
            },
          },
          cancel: {
            label: 'Skip Tour',
            onClick: () => {
              storage.setWelcomeSeen(true);
              storage.setSkipped(true);
            },
          },
          duration: 10000,
        });
      }, 2000);
    }
  }, [progress.percentage, isActive, startOnboarding, storage]);

  // Show milestone notifications
  useEffect(() => {
    const milestones = [25, 50, 75];
    const currentPercentage = progress.percentage;

    milestones.forEach(milestone => {
      if (currentPercentage === milestone) {
        const hasSeenMilestone = storage.getMilestoneSeen(milestone);
        
        if (!hasSeenMilestone) {
          toast(`${milestone}% Complete!`, {
            description: `You're making great progress learning the app.`,
            duration: 5000,
          });
          storage.setMilestoneSeen(milestone, true);
        }
      }
    });

    // Completion notification
    if (progress.isCompleted) {
      const hasSeenCompletion = storage.getCompletionSeen();
      if (!hasSeenCompletion) {
        toast('Onboarding Complete! 🎉', {
          description: 'You\'re all set to make the most of Sprint Financial, your personal finance companion.',
          duration: 8000,
        });
        storage.setCompletionSeen(true);
      }
    }
  }, [progress.percentage, progress.isCompleted]);

  return null;
}

// Contextual hints based on user behavior
export function OnboardingHints() {
  const { progress } = useOnboarding();
  const storage = getOnboardingStorage();

  useEffect(() => {
    // Only show hints if onboarding is not active or completed
    if (progress.isCompleted) return;

    const hints = [
      {
        condition: () => {
          const transactions = storage.getTransactions();
          return !transactions || transactions.length === 0;
        },
        message: 'Tip: Start by adding your first transaction to see your dashboard come to life!',
        delay: 30000, // 30 seconds after page load
        key: 'hint-first-transaction',
      },
      {
        condition: () => {
          const transactions = storage.getTransactions();
          const txCount = transactions ? transactions.length : 0;
          return txCount > 0 && txCount < 3;
        },
        message: 'Great start! Add a few more transactions to see meaningful insights on your dashboard.',
        delay: 60000, // 1 minute
        key: 'hint-more-transactions',
      },
      {
        condition: () => {
          const budgets = storage.getBudgets();
          return !budgets || budgets.length === 0;
        },
        message: 'Try creating a budget to better control your spending in key categories.',
        delay: 120000, // 2 minutes
        key: 'hint-create-budget',
      },
    ];

    hints.forEach(hint => {
      if (hint.condition()) {
        const hasSeenHint = storage.getHintSeen(hint.key);
        if (!hasSeenHint) {
          setTimeout(() => {
            toast(hint.message, {
              duration: 8000,
            });
            storage.setHintSeen(hint.key, true);
          }, hint.delay);
        }
      }
    });
  }, [progress, storage]);

  return null;
}

// Feature discovery notifications
export function FeatureDiscoveryNotifications() {
  useEffect(() => {
    // Check if user has discovered certain features
    const checkFeatureDiscovery = () => {
      const features = [
        {
          key: 'export-discovered',
          condition: () => localStorage.getItem('finance-tracker-export-used') === 'true',
          message: 'Did you know? You can export your data in multiple formats including CSV and PDF!',
        },
        {
          key: 'bulk-operations-discovered',
          condition: () => localStorage.getItem('finance-tracker-bulk-used') === 'true',
          message: 'Pro tip: Use bulk operations to edit or delete multiple transactions at once!',
        },
        {
          key: 'keyboard-shortcuts-discovered',
          condition: () => localStorage.getItem('finance-tracker-shortcuts-used') === 'true',
          message: 'Speed up your workflow! Press Ctrl+B to toggle the sidebar anytime.',
        },
      ];

      features.forEach(feature => {
        if (feature.condition()) {
          const hasSeenFeature = localStorage.getItem(`feature-hint-${feature.key}`);
          if (!hasSeenFeature) {
            setTimeout(() => {
              toast(feature.message, {
                duration: 5000,
              });
              localStorage.setItem(`feature-hint-${feature.key}`, 'true');
            }, 5000);
          }
        }
      });
    };

    // Check after some user activity
    const timer = setTimeout(checkFeatureDiscovery, 180000); // 3 minutes
    return () => clearTimeout(timer);
  }, []);

  return null;
}
