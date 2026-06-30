'use client';

import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  progress?: number;
  message?: string;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  timeout?: number;
  onTimeout?: () => void;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialLoading = false, timeout, onTimeout } = options;
  
  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    error: null,
    progress: undefined,
    message: undefined
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startLoading = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      message
    }));

    if (timeout && onTimeout) {
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
        onTimeout();
      }, timeout);
    }
  }, [timeout, onTimeout]);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      progress: undefined,
      message: undefined
    }));
  }, []);

  const setError = useCallback((error: Error | string | null) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: errorObj
    }));
  }, []);

  const setProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
      message: message || prev.message
    }));
  }, []);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      isLoading: false,
      error: null,
      progress: undefined,
      message: undefined
    });
  }, []);

  return {
    ...state,
    startLoading,
    stopLoading,
    setError,
    setProgress,
    reset,
    isLoading: state.isLoading
  };
}

export function useAsyncOperation<T = any>() {
  const { isLoading, error, startLoading, stopLoading, setError } = useLoadingState();
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async (
    operation: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T | null> => {
    startLoading(loadingMessage);
    
    try {
      const result = await operation();
      setData(result);
      stopLoading();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      return null;
    }
  }, [startLoading, stopLoading, setError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    stopLoading();
  }, [setData, setError, stopLoading]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset
  };
}
