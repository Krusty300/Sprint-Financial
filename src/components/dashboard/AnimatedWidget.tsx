import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedWidgetProps {
  children: React.ReactNode;
  widgetId: string;
  index: number;
  className?: string;
  isLoading?: boolean;
  skeletonType?: 'card' | 'chart' | 'list' | 'heatmap' | 'progress';
}

export function AnimatedWidget({ 
  children, 
  widgetId, 
  index, 
  className,
  isLoading = false,
  skeletonType = 'card'
}: AnimatedWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Staggered animation delay based on index
    const delay = index * 100;
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [index]);

  useEffect(() => {
    if (!isLoading) {
      const timeout = setTimeout(() => {
        setIsLoaded(true);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className={cn('opacity-0', className)}>
        <div className="animate-pulse">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
      style={{
        transitionDelay: `${index * 50}ms`,
      }}
    >
      {children}
    </div>
  );
}
