'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface CategoryBreakdownReportProps {
  categoryBreakdown: DashboardStats['categoryBreakdown'];
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'
];

export function CategoryBreakdownReport({ categoryBreakdown }: CategoryBreakdownReportProps) {
  const { categories } = useCategories();
  const { formatCurrency } = useCurrency();
  
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No category data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total expenses
  const totalExpenses = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryName = categories.find(cat => cat.id === data.category)?.name || data.category;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{categoryName}</p>
          <p className="text-sm">Amount: {formatCurrency(data.amount)}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percentage < 5) return null; // Don't show labels for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${percentage}%`}
      </text>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categoryBreakdown.length}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-2xl font-bold">
                {categories.find(cat => cat.id === categoryBreakdown[0]?.category)?.name || categoryBreakdown[0]?.category || 'N/A'}
              </p>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold mb-4">Distribution</h3>
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={undefined}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Comparison</h3>
              <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={undefined}>
                <BarChart data={categoryBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `$${value}`} />
                  <YAxis dataKey="category" type="category" width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#8884d8">
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Detailed Breakdown</h3>
            <div className="space-y-3">
              {categoryBreakdown.map((category, index) => {
                const categoryName = categories.find(cat => cat.id === category.category)?.name || category.category;
                return (
                <div key={category.category} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="font-medium">{categoryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(category.amount)} ({category.percentage}%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={category.percentage} className="w-20" />
                    <Badge variant="outline" className="min-w-[60px] justify-center">
                      {category.percentage}%
                    </Badge>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
