'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface GlobalLoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  operation?: string;
}

interface GlobalLoadingContextType {
  globalLoading: GlobalLoadingState;
  setGlobalLoading: (loading: Partial<GlobalLoadingState>) => void;
  startGlobalLoading: (message?: string, operation?: string) => void;
  stopGlobalLoading: () => void;
  setGlobalProgress: (progress: number, message?: string) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [globalLoading, setGlobalLoadingState] = useState<GlobalLoadingState>({
    isLoading: false,
    message: undefined,
    progress: undefined,
    operation: undefined
  });

  const setGlobalLoading = useCallback((loading: Partial<GlobalLoadingState>) => {
    setGlobalLoadingState(prev => ({ ...prev, ...loading }));
  }, []);

  const startGlobalLoading = useCallback((message?: string, operation?: string) => {
    setGlobalLoadingState({
      isLoading: true,
      message,
      operation,
      progress: undefined
    });
  }, []);

  const stopGlobalLoading = useCallback(() => {
    setGlobalLoadingState({
      isLoading: false,
      message: undefined,
      progress: undefined,
      operation: undefined
    });
  }, []);

  const setGlobalProgress = useCallback((progress: number, message?: string) => {
    setGlobalLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message
    }));
  }, []);

  return (
    <GlobalLoadingContext.Provider value={{
      globalLoading,
      setGlobalLoading,
      startGlobalLoading,
      stopGlobalLoading,
      setGlobalProgress
    }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
}
