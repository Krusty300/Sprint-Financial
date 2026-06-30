'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  className?: string;
  size?: number;
}

export function PieChart({ data, className, size = 200 }: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <span className="text-muted-foreground text-sm">No data</span>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (isNaN(item.value) ? 0 : item.value), 0);
  
  // Return early if no valid data
  if (total === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ width: size, height: size }}>
        <span className="text-muted-foreground text-sm">No data</span>
      </div>
    );
  }
  
  // Generate colors if not provided
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
  ];

  const dataWithColors = data.map((item, index) => ({
    ...item,
    value: isNaN(item.value) ? 0 : item.value,
    color: item.color || colors[index % colors.length]
  }));

  let currentAngle = -90; // Start from top

  const segments = dataWithColors.map((item) => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const angle = (percentage / 100) * 360;
    
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;

    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    return {
      ...item,
      percentage,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    };
  });

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            className="transition-all hover:opacity-80"
          />
        ))}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 space-y-2 w-full max-w-xs">
        {segments
          .sort((a, b) => b.value - a.value)
          .slice(0, 5) // Show top 5 categories
          .map((segment, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate max-w-32" title={segment.name}>{segment.name}</span>
              </div>
              <span className="text-muted-foreground">
                {segment.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
