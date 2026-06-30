'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LineChartProps {
  data: { label: string; income: number; expenses: number }[];
  className?: string;
  height?: number;
}

export function LineChart({ data, className, height = 200 }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center", className)} style={{ height }}>
        <span className="text-muted-foreground">No data</span>
      </div>
    );
  }

  const allValues = data.flatMap(d => [d.income, d.expenses]);
  const maxValue = Math.max(...allValues);
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  const createPath = (values: number[]) => {
    if (values.length === 0) return '';
    
    return values.map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
      const y = isNaN(value) || valueRange === 0 ? 50 : ((maxValue - value) / valueRange) * 100;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const incomePath = createPath(data.map(d => d.income));
  const expensesPath = createPath(data.map(d => d.expenses));

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 100 100`}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-muted-foreground/20"
          />
        ))}

        {/* Income line */}
        <path
          d={incomePath}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expenses line */}
        <path
          d={expensesPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points for income */}
        {data.map((_, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = ((maxValue - data[index].income) / valueRange) * 100;
          return (
            <circle
              key={`income-${index}`}
              cx={x}
              cy={y}
              r="2"
              fill="#10b981"
              className="hover:r-3 transition-all"
            />
          );
        })}

        {/* Data points for expenses */}
        {data.map((_, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
          const y = ((maxValue - data[index].expenses) / valueRange) * 100;
          return (
            <circle
              key={`expenses-${index}`}
              cx={x}
              cy={y}
              r="2"
              fill="#ef4444"
              className="hover:r-3 transition-all"
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute top-2 right-2 flex gap-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-green-500"></div>
          <span className="text-xs text-muted-foreground">Income</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500"></div>
          <span className="text-xs text-muted-foreground">Expenses</span>
        </div>
      </div>
    </div>
  );
}
