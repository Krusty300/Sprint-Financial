'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  className?: string;
  height?: number;
  color?: string;
  positive?: boolean;
}

export function SparklineChart({ 
  data, 
  className, 
  height = 40, 
  color = 'currentColor',
  positive = true 
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height, minHeight: height }}>
        <span className="text-muted-foreground text-xs">No data</span>
      </div>
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = isNaN(value) || range === 0 ? 50 : ((max - value) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue - firstValue;
  const trendPercent = firstValue !== 0 ? ((trend / firstValue) * 100).toFixed(1) : '0';

  return (
    <div className={cn("relative", className)} style={{ height, minHeight: height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 100 100`}
        preserveAspectRatio="none"
        style={{ minWidth: 0, minHeight: height }}
        className="overflow-visible"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-end pr-2 pb-1">
        <span className={cn(
          "text-xs font-medium",
          positive ? "text-green-600" : "text-red-600"
        )}>
          {trend > 0 ? '+' : ''}{trendPercent}%
        </span>
      </div>
    </div>
  );
}
