'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'striped' | 'glow';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  showLabel = true,
  size = 'md',
  variant = 'default',
  color = 'default',
  animated = true,
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [prevValue, setPrevValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  // Animate value changes
  useEffect(() => {
    if (!animated) {
      setDisplayValue(percentage);
      return;
    }

    const duration = 500;
    const startTime = performance.now();
    const startValue = prevValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (percentage - startValue) * easeOut;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPrevValue(percentage);
      }
    };

    requestAnimationFrame(animate);
  }, [percentage, animated, prevValue]);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    default: 'bg-primary',
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const glowColorClasses = {
    default: 'shadow-[0_0_10px_rgba(var(--primary),0.5)]',
    primary: 'shadow-[0_0_10px_rgba(var(--primary),0.5)]',
    success: 'shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    warning: 'shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    error: 'shadow-[0_0_10px_rgba(239,68,68,0.5)]'
  };

  const stripedBackground = variant === 'striped' 
    ? `repeating-linear-gradient(
      45deg,
      ${colorClasses[color].replace('bg-', '')} 0px,
      ${colorClasses[color].replace('bg-', '')} 10px,
      rgba(255,255,255,0.1) 10px,
      rgba(255,255,255,0.1) 20px
    )`
    : '';

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium tabular-nums">{Math.round(displayValue)}%</span>
        </div>
      )}
      <div className={cn(
        'relative w-full overflow-hidden rounded-full bg-muted',
        sizeClasses[size]
      )}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            colorClasses[color],
            variant === 'striped' && 'animate-progress-stripes',
            variant === 'glow' && glowColorClasses[color]
          )}
          style={{
            width: `${displayValue}%`,
            backgroundImage: stripedBackground,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
    </div>
  );
}

interface CircularProgressAnimatedProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
  animated?: boolean;
}

export function CircularProgressAnimated({
  value,
  max = 100,
  size = 40,
  strokeWidth = 4,
  className,
  showLabel = true,
  color = 'hsl(var(--primary))',
  animated = true,
}: CircularProgressAnimatedProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [prevValue, setPrevValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  // Animate value changes
  useEffect(() => {
    if (!animated) {
      setDisplayValue(percentage);
      return;
    }

    const duration = 500;
    const startTime = performance.now();
    const startValue = prevValue;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (percentage - startValue) * easeOut;
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPrevValue(percentage);
      }
    };

    requestAnimationFrame(animate);
  }, [percentage, animated, prevValue]);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            'transition-all duration-500 ease-out',
            animated && 'animate-pulse-slow'
          )}
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0 0 2px currentColor)'
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium tabular-nums">{Math.round(displayValue)}%</span>
        </div>
      )}
    </div>
  );
}
