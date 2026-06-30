/**
 * Performance optimization utilities and helpers
 */

import { useCallback, useMemo, useRef, useEffect, useState, RefObject } from 'react';

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }

  endMeasure(name: string): number {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.recordMetric(name, measure.duration);
        return measure.duration;
      }
    }
    return 0;
  }

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = this.getMetrics(name)!;
    });
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Web Worker utilities

interface WorkerTask<T = unknown> {
  id: string;
  task: T;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (error: ErrorEvent) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<WorkerTask<unknown>> = [];
  private busyWorkers: Set<Worker> = new Set();

  constructor(private workerScript: string, private poolSize: number = navigator.hardwareConcurrency || 4) {
    this.initializeWorkers();
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.poolSize; i++) {
      try {
        const worker = new Worker(this.workerScript);
        this.workers.push(worker);
      } catch (error) {
        console.warn('Failed to create worker:', error);
      }
    }
  }

  async execute<T>(task: T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskId = Math.random().toString(36).substr(2, 9);
      
      this.taskQueue.push({
        id: taskId,
        task,
        resolve: resolve as (value: unknown) => void,
        reject
      });
      
      this.processQueue();
    });
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;
    
    const taskItem = this.taskQueue.shift()!;
    this.busyWorkers.add(availableWorker);
    
    const handleMessage = (event: MessageEvent) => {
      this.busyWorkers.delete(availableWorker);
      availableWorker.removeEventListener('message', handleMessage);
      availableWorker.removeEventListener('error', handleError);
      
      if (event.data.id === taskItem.id) {
        taskItem.resolve(event.data.result);
      }
    };
    
    const handleError = (error: ErrorEvent) => {
      this.busyWorkers.delete(availableWorker);
      availableWorker.removeEventListener('message', handleMessage);
      availableWorker.removeEventListener('error', handleError);
      
      taskItem.reject(error);
    };
    
    availableWorker.addEventListener('message', handleMessage);
    availableWorker.addEventListener('error', handleError);
    
    availableWorker.postMessage({ id: taskItem.id, task: taskItem.task });
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers.clear();
  }
}

// Memoization helpers
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T } | undefined>(undefined);
  
  if (!ref.current || !depsEqual(deps, ref.current.deps)) {
    ref.current = { deps: [...deps], value: factory() };
  }
  
  return ref.current.value;
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  
  return true;
}

// Debounce utility
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (ref.current) {
      clearTimeout(ref.current);
    }
    
    ref.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// Throttle utility
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
}

// Virtual scrolling utilities
export interface VirtualScrollProps<T = unknown> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll<T>({ items, itemHeight, containerHeight, overscan = 5 }: VirtualScrollProps<T>) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, 0 - overscan);
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);
    
    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;
    
    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetY,
      totalHeight: items.length * itemHeight
    };
  }, [items, itemHeight, containerHeight, overscan]);
}

// Lazy loading utilities
export function useLazyLoad<T>(
  loader: () => Promise<T>,
  deps: unknown[] = []
): { data: T | null; loading: boolean; error: Error | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loader();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, deps);
  
  useEffect(() => {
    load();
  }, [load]);
  
  return { data, loading, error, reload: load };
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startMeasure: (name: string) => monitor.startMeasure(`${componentName}-${name}`),
    endMeasure: (name: string) => monitor.endMeasure(`${componentName}-${name}`),
    recordMetric: (name: string, value: number) => monitor.recordMetric(`${componentName}-${name}`, value),
    getMetrics: () => monitor.getMetrics(componentName)
  };
}

// Bundle size monitoring
export function measureBundleSize() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.endsWith('.js') && resource.name.includes('chunk')
    );
    
    const totalSize = jsResources.reduce((sum, resource) => {
      return sum + (resource.transferSize || 0);
    }, 0);
    
    return {
      chunks: jsResources.length,
      totalSize,
      averageSize: jsResources.length > 0 ? totalSize / jsResources.length : 0
    };
  }
  
  return null;
}

// Memory monitoring

interface MemoryInfo {
  used: number;
  total: number;
  limit: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export function useMemoryMonitor(): MemoryInfo | null {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemory = () => {
        const perf = performance as PerformanceWithMemory;
        if (perf.memory) {
          setMemoryInfo({
            used: perf.memory.usedJSHeapSize,
            total: perf.memory.totalJSHeapSize,
            limit: perf.memory.jsHeapSizeLimit
          });
        }
      };
      
      updateMemory();
      const interval = setInterval(updateMemory, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return memoryInfo;
}

// Intersection Observer for lazy loading
export function useIntersectionObserver(
  ref: RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return isIntersecting;
}

// RequestIdleCallback utility
export function useIdleCallback(callback: () => void, deps: unknown[] = []): void {
  useEffect(() => {
    const handleIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback);
      } else {
        setTimeout(callback, 1);
      }
    };
    
    handleIdle();
  }, deps);
}

// Performance decorator for functions
export function measurePerformance<T extends (...args: unknown[]) => unknown>(
  name: string,
  fn: T
): T {
  const monitor = PerformanceMonitor.getInstance();
  
  return ((...args: Parameters<T>) => {
    monitor.startMeasure(name);
    const result = fn(...args);
    monitor.endMeasure(name);
    return result;
  }) as T;
}
