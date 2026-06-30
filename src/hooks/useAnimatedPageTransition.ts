'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';

interface TransitionConfig {
  duration?: number;
  easing?: string;
  slideDistance?: number;
}

interface PageTransitionState {
  isTransitioning: boolean;
  direction: 'forward' | 'backward' | 'none';
  progress: number;
}

export function useAnimatedPageTransition(config: TransitionConfig = {}) {
  const {
    duration = 300,
    easing = 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    slideDistance = 100
  } = config;

  const pathname = usePathname();
  const router = useRouter();
  const { startGlobalLoading, stopGlobalLoading } = useGlobalLoading();
  
  const [state, setState] = useState<PageTransitionState>({
    isTransitioning: false,
    direction: 'none',
    progress: 0
  });

  const previousPathRef = useRef(pathname);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine transition direction based on path hierarchy
  const getDirection = useCallback((from: string, to: string): 'forward' | 'backward' => {
    const fromSegments = from.split('/').filter(Boolean);
    const toSegments = to.split('/').filter(Boolean);
    
    // Simple heuristic: if going deeper in navigation, it's forward
    if (toSegments.length > fromSegments.length) return 'forward';
    if (toSegments.length < fromSegments.length) return 'backward';
    
    // Same level - use alphabetical order as tiebreaker
    return to > from ? 'forward' : 'backward';
  }, []);

  // Animate progress during transition
  const animateProgress = useCallback(() => {
    let progress = 0;
    const increment = 100 / (duration / 16); // 60fps approximation
    
    progressIntervalRef.current = setInterval(() => {
      progress = Math.min(100, progress + increment);
      setState(prev => ({ ...prev, progress }));
      
      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 16);
  }, [duration]);

  const transitionTo = useCallback(async (path: string, customMessage?: string) => {
    if (path === pathname || state.isTransitioning) return;

    const direction = getDirection(pathname, path);
    
    // Start transition
    setState(prev => ({
      ...prev,
      isTransitioning: true,
      direction,
      progress: 0
    }));

    // Start global loading with contextual message
    const messages = {
      '/dashboard': 'Opening dashboard...',
      '/transactions': 'Loading transactions...',
      '/accounts': 'Opening accounts...',
      '/budgets': 'Loading budgets...',
      '/reports': 'Generating reports...',
      '/settings': 'Opening settings...'
    };

    startGlobalLoading(
      customMessage || messages[path as keyof typeof messages] || 'Loading...',
      'Navigation'
    );

    // Animate progress
    animateProgress();

    // Perform navigation after a short delay for animation
    transitionTimeoutRef.current = setTimeout(() => {
      router.push(path);
      
      // Clean up transition state after navigation
      setTimeout(() => {
        setState({
          isTransitioning: false,
          direction: 'none',
          progress: 0
        });
        stopGlobalLoading();
      }, 100);
    }, duration / 2); // Navigate halfway through animation

  }, [pathname, state.isTransitioning, getDirection, startGlobalLoading, stopGlobalLoading, animateProgress, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Detect external navigation changes
  useEffect(() => {
    if (pathname !== previousPathRef.current && !state.isTransitioning) {
      const direction = getDirection(previousPathRef.current, pathname);
      setState({
        isTransitioning: false,
        direction,
        progress: 100
      });
      
      previousPathRef.current = pathname;
      
      // Reset progress after a brief moment
      setTimeout(() => {
        setState(prev => ({ ...prev, progress: 0, direction: 'none' }));
      }, 200);
    }
  }, [pathname, state.isTransitioning, getDirection]);

  // Generate CSS custom properties for animation
  const animationStyles = {
    '--transition-duration': `${duration}ms`,
    '--transition-easing': easing,
    '--slide-distance': `${slideDistance}px`,
    '--progress': state.progress
  } as React.CSSProperties;

  return {
    ...state,
    transitionTo,
    animationStyles
  };
}

// Hook for page transition animations
export function usePageAnimation() {
  const { isTransitioning, direction, progress, animationStyles } = useAnimatedPageTransition();

  const getTransform = useCallback(() => {
    if (!isTransitioning) return 'translateX(0)';
    
    const slideDistance = 100; // pixels
    const progressFactor = progress / 100;
    
    if (direction === 'forward') {
      return `translateX(${slideDistance * (1 - progressFactor)}px)`;
    } else if (direction === 'backward') {
      return `translateX(${-slideDistance * (1 - progressFactor)}px)`;
    }
    
    return 'translateX(0)';
  }, [isTransitioning, direction, progress]);

  const getOpacity = useCallback(() => {
    if (!isTransitioning) return 1;
    return 0.7 + (0.3 * (progress / 100));
  }, [isTransitioning, progress]);

  return {
    isTransitioning,
    direction,
    progress,
    animationStyles,
    transform: getTransform(),
    opacity: getOpacity()
  };
}
