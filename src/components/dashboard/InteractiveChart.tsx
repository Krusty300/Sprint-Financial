'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartDataPoint {
  name: string;
  value: number;
  category?: string;
  date?: string;
  details?: any;
}

interface DrillDownLevel {
  level: number;
  category?: string;
  timeRange?: string;
  parentData?: any;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type: 'bar' | 'pie' | 'line';
  title: string;
  height?: number;
  onDrillDown?: (data: DrillDownLevel) => void;
  showDrillDown?: boolean;
  colors?: string[];
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export function InteractiveChart({
  data,
  type,
  title,
  height = 300,
  onDrillDown,
  showDrillDown = true,
  colors = DEFAULT_COLORS,
  className
}: InteractiveChartProps) {
  const [selectedSegment, setSelectedSegment] = useState<ChartDataPoint | null>(null);
  const [drillDownHistory, setDrillDownHistory] = useState<DrillDownLevel[]>([]);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>(type);

  // Calculate chart statistics
  const chartStats = useMemo(() => {
    if (!data.length) return { total: 0, average: 0, max: 0, min: 0 };

    const values = data.map(d => d.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { total, average, max, min };
  }, [data]);

  // Handle chart click
  const handleChartClick = useCallback((data: any) => {
    if (!data || !showDrillDown) return;

    const clickedData: ChartDataPoint = {
      name: data.name || data.category,
      value: data.value || data.amount,
      category: data.category,
      details: data.payload || data
    };

    setSelectedSegment(clickedData);

    // Trigger drill down if callback provided
    if (onDrillDown) {
      const newLevel: DrillDownLevel = {
        level: drillDownHistory.length + 1,
        category: clickedData.category,
        timeRange: 'current-month',
        parentData: data
      };

      setDrillDownHistory(prev => [...prev, newLevel]);
      onDrillDown(newLevel);
    }
  }, [drillDownHistory.length, onDrillDown, showDrillDown]);

  // Handle drill down back
  const handleDrillUp = useCallback(() => {
    if (drillDownHistory.length > 0) {
      const newHistory = drillDownHistory.slice(0, -1);
      setDrillDownHistory(newHistory);
      setSelectedSegment(null);
    }
  }, [drillDownHistory]);

  // Reset drill down
  const handleReset = useCallback(() => {
    setDrillDownHistory([]);
    setSelectedSegment(null);
  }, []);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-muted-foreground">
            Value: ${data.value?.toLocaleString()}
          </p>
          {data.details && (
            <div className="text-xs text-muted-foreground mt-1">
              {Object.entries(data.details || {}).map(([key, value]) => (
                <div key={key}>
                  {key}: {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Render bar chart
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height} minWidth={300} minHeight={320}>
      <BarChart data={data} onClick={handleChartClick}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          radius={[4, 4, 0, 4]}
          className="cursor-pointer hover:opacity-80"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              className="hover:opacity-80"
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // Render pie chart
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height} minWidth={300} minHeight={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={height * 0.3}
          fill="#8884d8"
          dataKey="value"
          onClick={handleChartClick}
          className="cursor-pointer"
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              className="hover:opacity-80"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  // Render line chart
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height} minWidth={300} minHeight={320}>
      <LineChart data={data} onClick={handleChartClick}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12 }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]}
          strokeWidth={2}
          dot={{ fill: colors[0], r: 4 }}
          activeDot={{ r: 6 }}
          className="cursor-pointer"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'line':
        return renderLineChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card className={cn("interactive-chart", className)}>
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          {selectedSegment && (
            <Badge variant="secondary" className="text-xs">
              {selectedSegment.name} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Chart type selector */}
          <div className="flex border rounded-md">
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="rounded-r-none"
            >
              Bar
            </Button>
            <Button
              variant={chartType === 'pie' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="rounded-none"
            >
              Pie
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChartType('line')}
              className="rounded-l-none"
            >
              Line
            </Button>
          </div>

          {/* Drill down controls */}
          {showDrillDown && (
            <div className="flex items-center gap-1">
              {drillDownHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDrillUp}
                  title="Drill up"
                >
                  <TrendingUp className="h-4 w-4 rotate-180" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                title="Reset drill down"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Chart statistics */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">
              ${chartStats.total.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${chartStats.average.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Average</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              ${chartStats.max.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Max</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              ${chartStats.min.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Min</p>
          </div>
        </div>

        {/* Selected segment details */}
        {selectedSegment && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">
                {selectedSegment.name} Details
              </h4>
              {showDrillDown && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDrillDown?.({
                    level: drillDownHistory.length + 1,
                    category: selectedSegment.category,
                    timeRange: 'current-month',
                    parentData: selectedSegment
                  })}
                >
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Drill Down
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Value</p>
                <p className="font-semibold">
                  ${selectedSegment.value.toLocaleString()}
                </p>
              </div>
              {selectedSegment.details && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Info</p>
                  <div className="text-sm">
                    {Object.entries(selectedSegment.details || {}).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium">{key}:</span> {String(value)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="h-full w-full min-w-0 min-h-0">
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
