'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

interface PageTransitionOptions {
  minLoadingTime?: number;
  loadingMessage?: string;
  operation?: string;
}

export function usePageTransition(options: PageTransitionOptions = {}) {
  const { minLoadingTime = 300, loadingMessage = 'Loading...', operation = 'Navigation' } = options;
  const { startGlobalLoading, stopGlobalLoading } = useGlobalLoading();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  const startTransition = useCallback((message?: string) => {
    setIsTransitioning(true);
    setStartTime(Date.now());
    startGlobalLoading(message || loadingMessage, operation);
  }, [startGlobalLoading, loadingMessage, operation]);

  const endTransition = useCallback(() => {
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);
    
    if (remainingTime > 0) {
      setTimeout(() => {
        setIsTransitioning(false);
        stopGlobalLoading();
      }, remainingTime);
    } else {
      setIsTransitioning(false);
      stopGlobalLoading();
    }
  }, [startTime, minLoadingTime, stopGlobalLoading]);

  const withTransition = useCallback(async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startTransition(message);
    
    try {
      const result = await operation();
      return result;
    } finally {
      endTransition();
    }
  }, [startTransition, endTransition]);

  return {
    isTransitioning,
    startTransition,
    endTransition,
    withTransition
  };
}

// Hook for detecting page changes and showing loading states
export function usePageLoading() {
  const { startGlobalLoading, stopGlobalLoading } = useGlobalLoading();
  const [currentPath, setCurrentPath] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for path changes
    const newPath = window.location.pathname;
    
    if (currentPath && currentPath !== newPath) {
      // Page is changing
      setIsLoading(true);
      startGlobalLoading('Loading page...', 'Navigation');
      
      // Simulate minimum loading time for better UX
      setTimeout(() => {
        setIsLoading(false);
        stopGlobalLoading();
        setCurrentPath(newPath);
      }, 500);
    } else if (!currentPath) {
      // Initial load
      setCurrentPath(newPath);
    }
  }, [currentPath, startGlobalLoading, stopGlobalLoading]);

  return { isLoading };
}
