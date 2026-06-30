'use client';

import { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  Target,
  Calendar,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  AreaChart as AreaChartIcon
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

interface BudgetData {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'on-track' | 'near-limit' | 'over-budget';
  period?: string;
}

interface BudgetComparisonChartProps {
  data: BudgetData[];
  title?: string;
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  showComparison?: boolean;
  period?: 'current' | 'previous' | 'comparison';
}

export function BudgetComparisonChart({ 
  data, 
  title = "Budget vs Spending Analysis", 
  chartType = 'bar',
  showComparison = true,
  period = 'current'
}: BudgetComparisonChartProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const [selectedChart, setSelectedChart] = useState(chartType);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Validate data
  const safeData = Array.isArray(data) ? data : [];
  const validatedData = safeData.filter(item => 
    item && 
    typeof item.budget === 'number' && item.budget >= 0 &&
    typeof item.spent === 'number' && item.spent >= 0 &&
    typeof item.percentageUsed === 'number' &&
    item.category
  );

  // Calculate summary statistics with validation
  const totalBudget = validatedData.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = validatedData.reduce((sum, item) => sum + item.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Status distribution for pie chart
  const statusData = [
    { name: 'On Track', value: validatedData.filter(d => d.status === 'on-track').length, color: resolvedTheme === 'dark' ? '#22c55e' : '#16a34a' },
    { name: 'Near Limit', value: validatedData.filter(d => d.status === 'near-limit').length, color: resolvedTheme === 'dark' ? '#eab308' : '#ca8a04' },
    { name: 'Over Budget', value: validatedData.filter(d => d.status === 'over-budget').length, color: resolvedTheme === 'dark' ? '#ef4444' : '#dc2626' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label || data.category}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Budget:</span>
              <span className="font-medium text-primary">
                {formatCurrency(data.budget)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Spent:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-destructive' : 
                data.percentageUsed >= 80 ? 'text-warning' : 'text-success'
              }`}>
                {formatCurrency(data.spent)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Remaining:</span>
              <span className="font-medium text-muted-foreground">
                {formatCurrency(data.remaining)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Used:</span>
              <span className={`font-medium ${
                data.percentageUsed > 100 ? 'text-destructive' : 
                data.percentageUsed >= 80 ? 'text-warning' : 'text-success'
              }`}>
                {data.percentageUsed.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: validatedData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (selectedChart) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="budget" 
              stroke={resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'} 
              strokeWidth={2}
              name="Budget"
            />
            <Line 
              type="monotone" 
              dataKey="spent" 
              stroke={resolvedTheme === 'dark' ? '#f87171' : '#ef4444'} 
              strokeWidth={2}
              name="Spent"
            />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="budget" 
              stroke={resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'} 
              fill={resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'} 
              fillOpacity={0.3}
              name="Budget"
            />
            <Area 
              type="monotone" 
              dataKey="spent" 
              stroke={resolvedTheme === 'dark' ? '#fbbf24' : '#f59e0b'} 
              fill={resolvedTheme === 'dark' ? '#fbbf24' : '#f59e0b'} 
              fillOpacity={0.1}
              strokeDasharray="5 5"
              name="Projected"
            />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }) => `${name}: ${value} (${(percent ? percent * 100 : 0).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );
      default:
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="budget" fill={resolvedTheme === 'dark' ? '#60a5fa' : '#3b82f6'} name="Budget" />
            <Bar dataKey="spent" fill={resolvedTheme === 'dark' ? '#f87171' : '#ef4444'} name="Spent" />
          </BarChart>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'near-limit': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'over-budget': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Target className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Handle empty data case
  if (validatedData.length === 0) {
    return (
      <Card className="w-full rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No budget data available</p>
            <p className="text-sm">Create budgets to see spending analysis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {data.length > 0 && data[0].period && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{data[0].period}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Bar</span>
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Line</span>
                  </div>
                </SelectItem>
                <SelectItem value="area">
                  <div className="flex items-center gap-2">
                    <AreaChartIcon className="h-4 w-4" />
                    <span>Area</span>
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    <span>Pie</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full min-h-[320px] min-w-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={320}>
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`text-center p-3 rounded-lg ${
            resolvedTheme === 'dark' ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'
          }`}>
            <div className={`text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-primary' : 'text-primary'
            }`}>
              Total Budget
            </div>
            <div className={`text-lg font-bold ${
              resolvedTheme === 'dark' ? 'text-primary' : 'text-primary'
            }`}>
              {formatCurrency(totalBudget)}
            </div>
            <div className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-primary' : 'text-primary'
            }`}>
              Across {data.length} categories
            </div>
          </div>
          
          <div className={`text-center p-3 rounded-lg ${
            resolvedTheme === 'dark' ? 'bg-destructive/20 text-destructive' : 'bg-destructive/10 text-destructive'
          }`}>
            <div className={`text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-destructive' : 'text-destructive'
            }`}>
              Total Spent
            </div>
            <div className={`text-lg font-bold ${
              resolvedTheme === 'dark' ? 'text-destructive' : 'text-destructive'
            }`}>
              {formatCurrency(totalSpent)}
            </div>
            <div className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-destructive' : 'text-destructive'
            }`}>
              {overallPercentage.toFixed(1)}% used
            </div>
          </div>
          
          <div className={`text-center p-3 rounded-lg ${
            resolvedTheme === 'dark' ? 'bg-success/20 text-success' : 'bg-success/10 text-success'
          }`}>
            <div className={`text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-success' : 'text-success'
            }`}>
              Remaining
            </div>
            <div className={`text-lg font-bold ${
              resolvedTheme === 'dark' ? 'text-success' : 'text-success'
            }`}>
              {formatCurrency(totalRemaining)}
            </div>
            <div className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-success' : 'text-success'
            }`}>
              {((totalRemaining / totalBudget) * 100).toFixed(1)}% left
            </div>
          </div>
          
          <div className={`text-center p-3 rounded-lg ${
            resolvedTheme === 'dark' ? 'bg-info/20 text-info' : 'bg-info/10 text-info'
          }`}>
            <div className={`text-sm font-medium ${
              resolvedTheme === 'dark' ? 'text-info' : 'text-info'
            }`}>
              Budget Health
            </div>
            <div className={`text-lg font-bold ${
              resolvedTheme === 'dark' ? 'text-info' : 'text-info'
            }`}>
              {overallPercentage > 100 ? 'Over' : overallPercentage >= 80 ? 'Warning' : 'Good'}
            </div>
            <div className={`text-xs ${
              resolvedTheme === 'dark' ? 'text-info' : 'text-info'
            }`}>
              {data.filter(d => d.status === 'over-budget').length} over budget
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Category Breakdown</h4>
          <div className="space-y-2">
            {data
              .filter(item => item && item.percentageUsed !== undefined && item.percentageUsed !== null)
              .sort((a, b) => b.percentageUsed - a.percentageUsed)
              .slice(0, 5)
              .map((item) => (
                <div 
                  key={item.category}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    hoveredCategory === item.category ? 'bg-muted' : ''
                  }`}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                    </span>
                    <Badge 
                      variant={item.status === 'over-budget' ? 'destructive' : 
                               item.status === 'near-limit' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {item.percentageUsed.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${resolvedTheme === 'dark' ? 'bg-success' : 'bg-success'}`}></div>
                <span>On Track: {validatedData.filter(d => d.status === 'on-track').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${resolvedTheme === 'dark' ? 'bg-warning' : 'bg-warning'}`}></div>
                <span>Near Limit: {validatedData.filter(d => d.status === 'near-limit').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${resolvedTheme === 'dark' ? 'bg-destructive' : 'bg-destructive'}`}></div>
                <span>Over Budget: {validatedData.filter(d => d.status === 'over-budget').length}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Budget Performance
              </div>
              <div className={`text-sm font-medium ${
                overallPercentage > 100 ? 'text-destructive' : 
                overallPercentage >= 80 ? 'text-warning' : 'text-success'
              }`}>
                {overallPercentage > 100 ? 'Over Budget' : 
                 overallPercentage >= 80 ? 'Near Limit' : 'On Track'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
