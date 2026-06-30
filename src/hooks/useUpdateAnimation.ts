import { useState, useCallback } from 'react';

export type AnimationType = 'success' | 'warning' | 'error' | 'none';

interface UseUpdateAnimationReturn {
  animationType: AnimationType;
  triggerAnimation: (type: AnimationType) => void;
  isAnimating: boolean;
}

export function useUpdateAnimation(): UseUpdateAnimationReturn {
  const [animationType, setAnimationType] = useState<AnimationType>('none');
  const [isAnimating, setIsAnimating] = useState(false);

  const triggerAnimation = useCallback((type: AnimationType) => {
    if (type === 'none') return;
    
    setAnimationType(type);
    setIsAnimating(true);
    
    // Reset animation after it completes
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType('none');
    }, 500);
  }, []);

  return {
    animationType,
    triggerAnimation,
    isAnimating,
  };
}

// Hook for animating a specific item when it updates
export function useItemAnimation<T>(itemId: string | number, triggerId: string | number | null) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<AnimationType>('success');

  const triggerItemAnimation = useCallback((type: AnimationType = 'success') => {
    setAnimationType(type);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  }, []);

  // Trigger animation when the item ID matches the trigger ID
  const shouldAnimate = triggerId === itemId && isAnimating;

  return {
    shouldAnimate,
    animationType,
    triggerItemAnimation,
    isAnimating,
  };
}
