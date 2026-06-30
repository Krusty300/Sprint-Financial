'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useVirtualScroll, useIntersectionObserver } from '@/utils/performance';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { visibleItems, startIndex, endIndex, offsetY, totalHeight } = useVirtualScroll({
    items,
    itemHeight,
    containerHeight,
    overscan
  });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Memoize the visible items to prevent unnecessary re-renders
  const memoizedVisibleItems = useMemo(() => {
    return visibleItems.map((item, index) => ({
      item,
      actualIndex: startIndex + index,
      key: `${startIndex + index}`
    }));
  }, [visibleItems, startIndex]);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {memoizedVisibleItems.map(({ item, actualIndex, key }) => (
            <div
              key={key}
              style={{
                height: itemHeight,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lazy loading virtual list component
interface LazyVirtualListProps<T> extends VirtualListProps<T> {
  loadMore?: () => void;
  hasMore?: boolean;
  loadingComponent?: React.ReactNode;
  threshold?: number;
}

export function LazyVirtualList<T>({
  items,
  loadMore,
  hasMore = false,
  loadingComponent,
  threshold = 0.8,
  ...virtualListProps
}: LazyVirtualListProps<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Intersection observer for infinite scrolling
  const shouldLoadMore = useIntersectionObserver(loadMoreRef as React.RefObject<HTMLElement>, {
    threshold,
    rootMargin: '100px'
  });

  useEffect(() => {
    if (shouldLoadMore && hasMore && !isLoading && loadMore) {
      setIsLoading(true);
      loadMore();
      // Reset loading state after a delay to prevent rapid successive calls
      setTimeout(() => setIsLoading(false), 1000);
    }
  }, [shouldLoadMore, hasMore, isLoading, loadMore]);

  return (
    <div>
      <VirtualList
        {...virtualListProps}
        items={items}
      />
      
      {/* Loading trigger and loading indicator */}
      <div ref={loadMoreRef} style={{ height: 1 }} />
      
      {isLoading && loadingComponent && (
        <div className="flex justify-center p-4">
          {loadingComponent}
        </div>
      )}
    </div>
  );
}

// Memoized item component for performance
export function MemoizedItem<T extends { id?: string | number }>({
  item,
  index,
  renderItem
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return useMemo(() => {
    return renderItem(item, index);
  }, [item.id ?? index, item, index, renderItem]);
}
