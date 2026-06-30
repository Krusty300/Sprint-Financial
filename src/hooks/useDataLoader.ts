import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { toast } from 'sonner';

interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  progress: number;
  stage: string;
  error: Error | null;
}

interface DataLoaderOptions {
  name: string;
  loadData: () => Promise<any>;
  dependencies?: string[];
  retryCount?: number;
  timeout?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number, stage: string) => void;
}

interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

export class DataLoader {
  private static cache: DataCache = {};
  private static loadingPromises: Map<string, Promise<any>> = new Map();
  private static retryAttempts: Map<string, number> = new Map();
  
  // Cache TTL in milliseconds (default 5 minutes)
  private static DEFAULT_TTL = 5 * 60 * 1000;
  
  /**
   * Load data with caching, retry logic, and progress tracking
   */
  static async loadData<T>(options: DataLoaderOptions): Promise<T> {
    const {
      name,
      loadData,
      dependencies = [],
      retryCount = 3,
      timeout = 30000,
      onSuccess,
      onError,
      onProgress
    } = options;

    // Check cache first
    const cached = this.getCachedData<T>(name);
    if (cached !== null) {
      onProgress?.(100, 'Loaded from cache');
      onSuccess?.(cached);
      return cached;
    }

    // Check if already loading
    const existingPromise = this.loadingPromises.get(name);
    if (existingPromise) {
      return existingPromise;
    }

    // Check dependencies
    for (const dep of dependencies) {
      if (this.loadingPromises.has(dep)) {
        onProgress?.(0, `Waiting for ${dep}...`);
        // Wait for dependency to load
        await this.loadingPromises.get(dep);
      }
    }

    // Create loading promise
    const loadingPromise = this.executeLoadWithRetry<T>({
      name,
      loadData,
      retryCount,
      timeout,
      onProgress: (progress, stage) => {
        onProgress?.(progress, stage);
      }
    });

    // Store promise to prevent duplicate loads
    this.loadingPromises.set(name, loadingPromise);

    try {
      const result = await loadingPromise;
      
      // Cache the result
      this.setCachedData(name, result);
      
      // Clean up
      this.loadingPromises.delete(name);
      this.retryAttempts.delete(name);
      
      onSuccess?.(result);
      return result;
      
    } catch (error) {
      // Clean up
      this.loadingPromises.delete(name);
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      onError?.(errorObj);
      throw errorObj;
    }
  }

  /**
   * Execute load with retry logic and timeout
   */
  private static async executeLoadWithRetry<T>({
    name,
    loadData,
    retryCount,
    timeout,
    onProgress
  }: {
    name: string;
    loadData: () => Promise<T>;
    retryCount: number;
    timeout: number;
    onProgress?: (progress: number, stage: string) => void;
  }): Promise<T> {
    let lastError: Error | null = null;
    const currentAttempts = this.retryAttempts.get(name) || 0;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        onProgress?.((attempt * 100) / (retryCount + 1), `Loading... (Attempt ${attempt + 1})`);
        
        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Loading timeout after ${timeout}ms`)), timeout);
        });

        // Race between load and timeout
        const result = await Promise.race([
          loadData(),
          timeoutPromise
        ]);

        onProgress?.(100, 'Complete');
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Load attempt ${attempt + 1} failed for ${name}:`, lastError);
        
        // Don't retry on certain errors
        if (lastError.message.includes('timeout') || attempt === retryCount) {
          this.retryAttempts.set(name, currentAttempts + 1);
          throw lastError;
        }
        
        // Wait before retry
        if (attempt < retryCount) {
          onProgress?.((attempt + 1) * (100 / (retryCount + 1)), `Retrying... (${attempt + 1}/${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    this.retryAttempts.set(name, currentAttempts + 1);
    throw lastError;
  }

  /**
   * Get cached data if valid
   */
  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache[key];
    if (!cached || cached.data === undefined) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return cached.data as T;
  }

  /**
   * Set cached data with TTL
   */
  private static setCachedData<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  /**
   * Clear cache for specific key or all
   */
  static clearCache(key?: string): void {
    if (key) {
      delete this.cache[key];
      this.retryAttempts.delete(key);
    } else {
      this.cache = {};
      this.retryAttempts.clear();
    }
  }

  /**
   * Get loading status
   */
  static getLoadingStatus(key: string): boolean {
    return this.loadingPromises.has(key);
  }

  /**
   * Preload data for better UX
   */
  static async preloadData<T>(options: DataLoaderOptions): Promise<void> {
    try {
      await this.loadData<T>(options);
    } catch (error) {
      // Silent fail for preloading
      console.warn('Preload failed:', error);
    }
  }

  /**
   * Batch load multiple data sources
   */
  static async loadBatch<T>(options: DataLoaderOptions[]): Promise<T[]> {
    const results = await Promise.allSettled(
      options.map(option => this.loadData<T>(option))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch load failed for ${options[index].name}:`, result.reason);
        throw result.reason;
      }
    });
  }
}

/**
 * Hook for using data loader in components
 */
export function useDataLoader() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async <T>(options: DataLoaderOptions): Promise<T> => {
    const { name, onProgress, onSuccess, onError } = options;

    // Update loading state
    if (mountedRef.current) {
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        newStates.set(name, {
          isLoading: true,
          isRefreshing: DataLoader.getLoadingStatus(name),
          progress: 0,
          stage: 'Starting...',
          error: null
        });
        return newStates;
      });
    }

    try {
      const result = await DataLoader.loadData<T>({
        ...options,
        onProgress: (progress, stage) => {
          if (mountedRef.current) {
            setLoadingStates(prev => {
              const newStates = new Map(prev);
              const current = newStates.get(name) || { isLoading: false, isRefreshing: false, progress: 0, stage: '', error: null };
              newStates.set(name, { ...current, progress, stage });
              return newStates;
            });
          }
          onProgress?.(progress, stage);
        },
        onSuccess: (data) => {
          if (mountedRef.current) {
            setLoadingStates(prev => {
              const newStates = new Map(prev);
              newStates.set(name, {
                isLoading: false,
                isRefreshing: false,
                progress: 100,
                stage: 'Complete',
                error: null
              });
              return newStates;
            });
          }
          onSuccess?.(data);
        },
        onError: (error) => {
          if (mountedRef.current) {
            setLoadingStates(prev => {
              const newStates = new Map(prev);
              newStates.set(name, {
                isLoading: false,
                isRefreshing: false,
                progress: 0,
                stage: 'Error',
                error
              });
              return newStates;
            });
          }
          toast.error(`Failed to load ${name}: ${error.message}`);
          onError?.(error);
        }
      });

      return result;
    } catch (error) {
      if (mountedRef.current) {
        setLoadingStates(prev => {
          const newStates = new Map(prev);
          newStates.set(name, {
            isLoading: false,
            isRefreshing: false,
            progress: 0,
            stage: 'Error',
            error: error instanceof Error ? error : new Error(String(error))
          });
          return newStates;
        });
      }
      throw error;
    }
  }, []);

  const getLoadingState = useCallback((key: string): LoadingState => {
    return loadingStates.get(key) || {
      isLoading: false,
      isRefreshing: false,
      progress: 0,
      stage: '',
      error: null
    };
  }, [loadingStates]);

  const clearLoadingState = useCallback((key: string): void => {
    if (mountedRef.current) {
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        newStates.delete(key);
        return newStates;
      });
    }
    DataLoader.clearCache(key);
  }, []);

  const isAnyLoading = useCallback((): boolean => {
    for (const state of loadingStates.values()) {
      if (state.isLoading) return true;
    }
    return false;
  }, [loadingStates]);

  return {
    loadData,
    getLoadingState,
    clearLoadingState,
    isAnyLoading,
    loadingStates: Object.fromEntries(loadingStates)
  };
}

/**
 * Higher-order component for data loading
 */
export function withDataLoader<P extends object>(
  Component: React.ComponentType<P & { loading: LoadingState; reloadData: () => void }>,
  dataLoaderOptions: DataLoaderOptions
): React.ComponentType<P> {
  return function WrappedComponent(wrappedProps: P) {
    const { loadData, getLoadingState } = useDataLoader();
    const loadingState = getLoadingState(dataLoaderOptions.name);

    const handleReloadData = () => {
      loadData(dataLoaderOptions);
    };

    useEffect(() => {
      loadData(dataLoaderOptions);
    }, []);

    const componentProps = {
      ...wrappedProps,
      loading: loadingState,
      reloadData: handleReloadData
    } as P & { loading: LoadingState; reloadData: () => void };

    return React.createElement(Component, componentProps);
  };
}
