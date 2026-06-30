'use client';

import { ReactNode, useRef, useEffect } from 'react';
import { usePageAnimation } from '@/hooks/useAnimatedPageTransition';
import { cn } from '@/lib/utils';

interface PageTransitionWrapperProps {
  children: ReactNode;
  className?: string;
}

export function PageTransitionWrapper({ children, className }: PageTransitionWrapperProps) {
  const { isTransitioning, transform, opacity, animationStyles } = usePageAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply smooth transitions to the container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = transform;
      containerRef.current.style.opacity = opacity.toString();
    }
  }, [transform, opacity]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'transition-all duration-300 ease-out',
        'will-change-transform, will-change-opacity',
        isTransitioning && 'pointer-events-none',
        className
      )}
      style={{
        ...animationStyles,
        transform,
        opacity
      }}
    >
      {children}
    </div>
  );
}

// Alternative slide transition component
export function SlideTransition({ 
  children, 
  direction = 'left',
  isActive = false 
}: { 
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  isActive?: boolean;
}) {
  const getSlideTransform = () => {
    if (!isActive) return 'translateX(0)';
    
    switch (direction) {
      case 'left':
        return 'translateX(-100%)';
      case 'right':
        return 'translateX(100%)';
      case 'up':
        return 'translateY(-100%)';
      case 'down':
        return 'translateY(100%)';
      default:
        return 'translateX(0)';
    }
  };

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        'will-change-transform'
      )}
      style={{
        transform: getSlideTransform()
      }}
    >
      {children}
    </div>
  );
}

// Fade transition component
export function FadeTransition({ 
  children, 
  isActive = false,
  duration = 300 
}: { 
  children: ReactNode;
  isActive?: boolean;
  duration?: number;
}) {
  return (
    <div
      className={cn(
        'transition-opacity',
        'will-change-opacity'
      )}
      style={{
        opacity: isActive ? 0 : 1,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
      }}
    >
      {children}
    </div>
  );
}
