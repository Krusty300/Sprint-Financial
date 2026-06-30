'use client';

import React, { Suspense, lazy, useState, useEffect, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function LazySection({
  children,
  fallback,
  delay = 0,
  threshold = 0.1,
  rootMargin = '50px',
}: LazySectionProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [hasDelayPassed, setHasDelayPassed] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setHasDelayPassed(true);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!hasDelayPassed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasDelayPassed, threshold, rootMargin]);

  const defaultFallback = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );

  return (
    <div ref={containerRef}>
      {shouldRender ? (
        <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
}

interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>;
  fallback?: React.ReactNode;
  props?: Record<string, any>;
}

export function LazyComponent({ loader, fallback, props = {} }: LazyComponentProps) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadComponent = async () => {
      try {
        const module = await loader();
        if (isMounted) {
          setComponent(() => module.default);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load component'));
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      isMounted = false;
    };
  }, [loader]);

  const defaultFallback = (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Failed to load component</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !Component) {
    return fallback || defaultFallback;
  }

  return <Component {...props} />;
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    fallback?: React.ReactNode;
    delay?: number;
    threshold?: number;
  } = {}
) {
  return function LazyWrapper(props: P) {
    return (
      <LazySection
        fallback={options.fallback}
        delay={options.delay}
        threshold={options.threshold}
      >
        <Component {...props} />
      </LazySection>
    );
  };
}

// Hook for progressive loading
export function useProgressiveLoad<T>(
  items: T[],
  batchSize: number = 10,
  delay: number = 100
) {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setVisibleItems([]);
      setHasMore(false);
      return;
    }

    // Load first batch immediately
    const firstBatch = items.slice(0, batchSize);
    setVisibleItems(firstBatch);
    setHasMore(items.length > batchSize);

    if (items.length <= batchSize) {
      return;
    }

    // Set up progressive loading
    let currentIndex = batchSize;
    const interval = setInterval(() => {
      if (currentIndex >= items.length) {
        clearInterval(interval);
        setHasMore(false);
        return;
      }

      setIsLoading(true);
      const nextBatch = items.slice(currentIndex, currentIndex + batchSize);
      setVisibleItems((prev) => [...prev, ...nextBatch]);
      currentIndex += batchSize;
      setIsLoading(false);
    }, delay);

    return () => clearInterval(interval);
  }, [items, batchSize, delay]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    const currentLength = visibleItems.length;
    const nextBatch = items.slice(currentLength, currentLength + batchSize);
    
    setTimeout(() => {
      setVisibleItems((prev) => [...prev, ...nextBatch]);
      setIsLoading(false);
      setHasMore(currentLength + nextBatch.length < items.length);
    }, 100);
  }, [items, visibleItems.length, batchSize, hasMore, isLoading]);

  return { visibleItems, hasMore, isLoading, loadMore };
}
