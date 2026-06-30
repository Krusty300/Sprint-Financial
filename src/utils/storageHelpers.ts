/**
 * Safe storage utilities for onboarding system
 * Prevents crashes from corrupted localStorage data
 */

export const safeParseJSON = <T = any>(data: string | null, defaultValue: T): T => {
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.warn('Failed to parse localStorage data:', error);
    return defaultValue;
  }
};

export const safeStringifyJSON = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Failed to stringify data for localStorage:', error);
    return null;
  }
};

export const getStorageItem = <T = any>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return safeParseJSON(item, defaultValue);
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageItem = (key: string, value: any): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const serialized = safeStringifyJSON(value);
    if (serialized !== null) {
      localStorage.setItem(key, serialized);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error);
    return false;
  }
};

export const removeStorageItem = (key: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

// Onboarding-specific storage helpers
export const getOnboardingStorage = () => ({
  getWelcomeSeen: () => getStorageItem('onboarding-welcome-seen', false),
  setWelcomeSeen: (seen: boolean) => setStorageItem('onboarding-welcome-seen', seen),
  
  getSkipped: () => getStorageItem('onboarding-skipped', false),
  setSkipped: (skipped: boolean) => setStorageItem('onboarding-skipped', skipped),
  
  getCompletionSeen: () => getStorageItem('onboarding-completion-seen', false),
  setCompletionSeen: (seen: boolean) => setStorageItem('onboarding-completion-seen', seen),
  
  getMilestoneSeen: (milestone: number) => getStorageItem(`onboarding-milestone-${milestone}`, false),
  setMilestoneSeen: (milestone: number, seen: boolean) => setStorageItem(`onboarding-milestone-${milestone}`, seen),
  
  getTransactions: () => getStorageItem('finance-tracker-transactions', []),
  getBudgets: () => getStorageItem('finance-tracker-budgets', []),
  
  getHintSeen: (hintKey: string) => getStorageItem(`hint-${hintKey}`, false),
  setHintSeen: (hintKey: string, seen: boolean) => setStorageItem(`hint-${hintKey}`, seen),
});
