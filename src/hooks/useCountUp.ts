import { useEffect, useState, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  start?: number;
  decimals?: number;
  easing?: (t: number) => number;
  onComplete?: () => void;
}

// Easing functions
const easingFunctions: Record<string, (t: number) => number> = {
  linear: (t: number) => t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

export function useCountUp(
  end: number,
  options: UseCountUpOptions = {}
) {
  const {
    duration = 1000,
    start = 0,
    decimals = 0,
    easing = easingFunctions.easeOutCubic,
    onComplete,
  } = options;

  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Skip if end equals start
    if (end === start) {
      setCount(end);
      return;
    }

    setIsAnimating(true);
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - (startTimeRef.current || 0);
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const currentCount = start + (end - start) * easedProgress;
      setCount(currentCount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setCount(end);
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, start, duration, easing, onComplete]);

  return {
    count: Number(count.toFixed(decimals)),
    isAnimating,
  };
}

// Hook for currency formatting with count-up animation
export function useCurrencyCountUp(
  end: number,
  options: UseCountUpOptions & { formatCurrency?: (value: number) => string } = {}
) {
  const { formatCurrency = (val) => val.toFixed(2), ...countUpOptions } = options;
  const { count, isAnimating } = useCountUp(end, countUpOptions);

  return {
    formatted: formatCurrency(count),
    count,
    isAnimating,
  };
}

// Hook for percentage formatting with count-up animation
export function usePercentageCountUp(
  end: number,
  options: UseCountUpOptions = {}
) {
  const { count, isAnimating } = useCountUp(end, {
    ...options,
    decimals: options.decimals ?? 1,
  });

  return {
    percentage: `${count.toFixed(options.decimals ?? 1)}%`,
    count,
    isAnimating,
  };
}
