'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EnhancedPieChartProps {
  data: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  title?: string;
  onDrillDown?: (category: string) => void;
  showDrillDown?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export function EnhancedPieChart({ 
  data, 
  title = "Category Breakdown", 
  onDrillDown,
  showDrillDown = true 
}: EnhancedPieChartProps) {
  const { formatCurrency } = useCurrency();
  const [selectedSegment, setSelectedSegment] = useState<string | undefined>(undefined);
  const [hoveredSegment, setHoveredSegment] = useState<string | undefined>(undefined);

  const chartData = data.map(item => ({
    ...item,
    value: item.amount,
    name: item.category
  }));

  const handleSegmentClick = (data: any) => {
    if (showDrillDown && onDrillDown && data.name) {
      setSelectedSegment(data.name);
      onDrillDown(data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm font-medium">
            {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label for small segments
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {selectedSegment && showDrillDown && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSegment(undefined)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onClick={handleSegmentClick}
                onMouseEnter={(data) => setHoveredSegment(data.name)}
                onMouseLeave={() => setHoveredSegment(undefined)}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      filter: hoveredSegment === entry.name ? 'brightness(1.1)' : 'none',
                      cursor: showDrillDown ? 'pointer' : 'default',
                      opacity: selectedSegment && selectedSegment !== entry.name ? 0.3 : 1
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Category Details */}
        <div className="mt-4 space-y-2">
          {[...data]
            .sort((a, b) => b.amount - a.amount)
            .map((item, index) => (
              <div 
                key={item.category}
                className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                  hoveredSegment === item.category ? 'bg-muted' : ''
                } ${selectedSegment && selectedSegment !== item.category ? 'opacity-50' : ''}`}
                onMouseEnter={() => setHoveredSegment(item.category)}
                onMouseLeave={() => setHoveredSegment(undefined)}
                onClick={() => handleSegmentClick(item)}
                style={{ cursor: showDrillDown ? 'pointer' : 'default' }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Categories</span>
            <span className="font-medium">{data.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Average</span>
            <span className="font-medium">
              {formatCurrency(totalAmount / data.length)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
