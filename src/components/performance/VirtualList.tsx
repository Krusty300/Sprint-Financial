'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = visibleRange.startIndex + index;
            return (
              <div
                key={getItemKey(item, actualIndex)}
                style={{ height: itemHeight }}
                className="flex-shrink-0"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface VirtualNavigationItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  description?: string;
  color?: string;
  draggable?: boolean;
}

interface VirtualNavigationProps {
  items: VirtualNavigationItem[];
  pathname: string;
  isCollapsed?: boolean;
  containerHeight?: number;
  showIcons?: boolean;
  onItemClick?: (item: VirtualNavigationItem) => void;
}

export function VirtualNavigation({
  items,
  pathname,
  isCollapsed = false,
  containerHeight = 400,
  showIcons = true,
  onItemClick,
}: VirtualNavigationProps) {
  const renderItem = useCallback(
    (item: VirtualNavigationItem, index: number) => {
      const isActive = pathname === item.href;
      
      return (
        <div className="px-2 py-1">
          <button
            data-onboarding={`${item.id}-nav`}
            className={cn(
              'w-full justify-start relative transition-all duration-300 ease-out',
              'hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
              'before:absolute before:inset-0 before:rounded-md before:opacity-0 before:transition-opacity before:duration-200',
              'hover:before:opacity-10 hover:before:bg-gradient-to-r hover:before:from-primary/20 hover:before:to-primary/10',
              'flex items-center px-2 sm:px-3 rounded-md text-sm font-medium',
              isActive && [
                `border-l-4 border-l-${item.color?.replace('text-', '')}`,
                'bg-gradient-to-r from-secondary/50 to-secondary/30',
                'shadow-md'
              ],
              !isActive && 'hover:border-l-2 hover:border-l-gray-300',
              'h-10 sm:h-9',
              isActive
                ? 'text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            onClick={() => onItemClick?.(item)}
            title={isCollapsed ? `${item.name}: ${item.description}` : item.description}
          >
            {showIcons && item.icon && (
              <div className="relative">
                <item.icon
                  className={cn(
                    'h-4 w-4 sm:h-4 sm:w-4 transition-all duration-300 ease-out',
                    'group-hover:scale-110 group-hover:rotate-12 group-hover:text-primary',
                    'flex-shrink-0',
                    !isCollapsed && 'mr-2 sm:mr-3',
                    item.color
                  )}
                />
                {isCollapsed && item.badge && (
                  <div
                    className={cn(
                      'absolute -top-1 -right-1 h-3 w-3 rounded-full text-[10px] font-bold',
                      'flex items-center justify-center transition-all duration-200',
                      'group-hover:scale-110 group-hover:shadow-md',
                      'animate-pulse',
                      item.badge === '!'
                        ? 'bg-red-500 text-white shadow-red-500/50'
                        : parseInt(item.badge) > 0
                        ? 'bg-blue-500 text-white shadow-blue-500/50'
                        : 'bg-gray-400 text-white shadow-gray-400/50'
                    )}
                  >
                    {item.badge === '!'
                      ? '!'
                      : parseInt(item.badge) > 9
                      ? '9+'
                      : parseInt(item.badge) > 0
                      ? item.badge
                      : ''}
                  </div>
                )}
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center flex-1">
                <span className={cn(
                  'truncate transition-all duration-200 ease-out',
                  'group-hover:translate-x-1 group-hover:font-semibold'
                )}>
                  {item.name}
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      'ml-2 text-xs px-2 py-1 rounded-full transition-all duration-200',
                      'group-hover:scale-105 group-hover:shadow-sm',
                      item.badge === '!'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
      );
    },
    [pathname, isCollapsed, onItemClick]
  );

  return (
    <VirtualList
      items={items}
      itemHeight={44}
      containerHeight={containerHeight}
      renderItem={renderItem}
      getItemKey={(item) => item.id}
      overscan={3}
    />
  );
}
