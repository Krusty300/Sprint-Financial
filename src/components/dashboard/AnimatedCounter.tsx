'use client';

import { useEffect, useState, useRef } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatAsCurrency?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  formatAsCurrency = true,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const { formatCurrency } = useCurrency();
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const startValueRef = useRef(0);

  useEffect(() => {
    // Skip animation for initial render or if value hasn't changed significantly
    if (Math.abs(displayValue - value) < 0.01) {
      return;
    }

    setIsAnimating(true);
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOutQuart;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, displayValue]);

  const formatValue = (val: number) => {
    if (formatAsCurrency) {
      return formatCurrency(val);
    }
    return val.toFixed(decimals);
  };

  return (
    <span className={`tabular-nums ${isAnimating ? 'transition-all' : ''} ${className}`}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}
