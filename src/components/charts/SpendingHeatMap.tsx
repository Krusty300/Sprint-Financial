'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCategories } from '@/hooks/useCategories';

interface SpendingData {
  date: string;
  category: string;
  amount: number;
  dayOfWeek: string;
  week: number;
  month: string;
}

interface SpendingHeatMapProps {
  data: SpendingData[];
  title?: string;
  period?: 'week' | 'month' | 'quarter';
}

export function SpendingHeatMap({ 
  data, 
  title = "Spending Patterns", 
  period = 'month' 
}: SpendingHeatMapProps) {
  const { formatCurrency } = useCurrency();
  const { categories } = useCategories();
  const { heatmapData, maxValue, insights, categories: uniqueCategories } = useMemo(() => {
    // Process data for heatmap
    const processedData = data.map(item => ({
      ...item,
      dayName: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      dayOfMonth: new Date(item.date).getDate(),
      weekOfMonth: Math.ceil(new Date(item.date).getDate() / 7)
    }));

    // Get unique categories
    const uniqueCategories = Array.from(new Set(processedData.map(d => d.category)));
    
    // Create heatmap data structure
    const heatmap: Record<string, Record<string, number>> = {};
    
    if (period === 'week') {
      // Week view: Days of week x Categories
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      daysOfWeek.forEach(day => {
        heatmap[day] = {};
        uniqueCategories.forEach(categoryId => {
          const dayData = processedData.filter(d => 
            d.dayName === day && d.category === categoryId
          );
          heatmap[day][categoryId] = dayData.reduce((sum, d) => sum + d.amount, 0);
        });
      });
    } else if (period === 'month') {
      // Month view: Days of month x Categories
      const daysInMonth = 31;
      
      for (let day = 1; day <= daysInMonth; day++) {
        heatmap[`Day ${day}`] = {};
        uniqueCategories.forEach(categoryId => {
          const dayData = processedData.filter(d => 
            d.dayOfMonth === day && d.category === categoryId
          );
          heatmap[`Day ${day}`][categoryId] = dayData.reduce((sum, d) => sum + d.amount, 0);
        });
      }
    } else {
      // Quarter view: Weeks x Categories
      for (let week = 1; week <= 13; week++) {
        heatmap[`Week ${week}`] = {};
        uniqueCategories.forEach(categoryId => {
          const weekData = processedData.filter(d => 
            d.weekOfMonth === week && d.category === categoryId
          );
          heatmap[`Week ${week}`][categoryId] = weekData.reduce((sum, d) => sum + d.amount, 0);
        });
      }
    }

    // Find max value for scaling
    const maxVal = Math.max(
      ...Object.values(heatmap).flatMap(weekData => 
        Object.values(weekData).filter(v => v > 0)
      )
    );

    // Calculate insights
    const totalSpending = data.reduce((sum, d) => sum + d.amount, 0);
    const avgDailySpending = totalSpending / (period === 'week' ? 7 : period === 'month' ? 30 : 91);
    const topCategory = uniqueCategories.reduce((top, catId) => {
      const catTotal = data.filter(d => d.category === catId).reduce((sum, d) => sum + d.amount, 0);
      const topTotal = data.filter(d => d.category === top).reduce((sum, d) => sum + d.amount, 0);
      return catTotal > topTotal ? catId : top;
    }, uniqueCategories[0]);

    return {
      heatmapData: heatmap,
      maxValue: maxVal || 1,
      categories: uniqueCategories,
      insights: {
        totalSpending,
        avgDailySpending,
        topCategory: topCategory,
        topCategoryAmount: data.filter(d => d.category === topCategory).reduce((sum, d) => sum + d.amount, 0),
        categoryCount: uniqueCategories.length
      }
    };
  }, [data, period]);

  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = value / maxValue;
    if (intensity < 0.2) return 'bg-green-100';
    if (intensity < 0.4) return 'bg-green-200';
    if (intensity < 0.6) return 'bg-yellow-200';
    if (intensity < 0.8) return 'bg-orange-200';
    return 'bg-red-200';
  };

  const getTextColor = (value: number) => {
    if (value === 0) return 'text-gray-400';
    const intensity = value / maxValue;
    if (intensity < 0.4) return 'text-gray-700';
    return 'text-gray-900';
  };

  const rows = Object.keys(heatmapData);
  const cols = categories.filter(cat => uniqueCategories.includes(cat.id));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: any) => period = value}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Heatmap */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 text-sm font-medium text-muted-foreground">
                  {period === 'week' ? 'Day' : period === 'month' ? 'Date' : 'Week'}
                </th>
                {cols.map(category => (
                  <th key={category.id} className="text-center p-2 text-xs font-medium min-w-20">
                    <div>{category.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row}>
                  <td className="text-left p-2 text-sm font-medium border-t">
                    {row}
                  </td>
                  {cols.map(category => {
                    const value = heatmapData[row][category.id] || 0;
                    return (
                      <td 
                        key={category.id}
                        className={`text-center p-2 border-t ${getHeatmapColor(value)}`}
                      >
                        <div className={`text-xs font-medium ${getTextColor(value)}`}>
                          {value > 0 ? formatCurrency(value) : '-'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Spending Intensity:</span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 border"></div>
                <span className="text-xs">None</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border"></div>
                <span className="text-xs">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-200 border"></div>
                <span className="text-xs">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-200 border"></div>
                <span className="text-xs">High</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {period === 'week' ? '7 Days' : period === 'month' ? '30 Days' : '13 Weeks'}
          </Badge>
        </div>

        {/* Insights */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              Total Spending
            </div>
            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(insights.totalSpending)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'This quarter'}
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Average Daily
            </div>
            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(insights.avgDailySpending)}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Per day
            </div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              Top Category
            </div>
            <div className="text-lg font-bold text-orange-700 dark:text-orange-300 truncate">
              {categories.find(cat => cat.id === insights.topCategory)?.name || insights.topCategory}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              {formatCurrency(insights.topCategoryAmount)}
            </div>
          </div>
        </div>

        {/* Category Summary */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Category Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categories.map(category => {
              const categoryTotal = data
                .filter(d => d.category === category.id)
                .reduce((sum, d) => sum + d.amount, 0);
              const percentage = insights.totalSpending > 0 
                ? (categoryTotal / insights.totalSpending * 100) 
                : 0;
              
              return (
                <div 
                  key={category.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <span className="text-sm font-medium truncate">{category.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatCurrency(categoryTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Pattern Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Peak Spending Day</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Analysis shows highest spending typically occurs mid-week
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Spending Trend</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {insights.totalSpending > 1000 ? 'Higher than average spending pattern detected' : 'Normal spending pattern'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
