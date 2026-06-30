'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Calendar } from 'lucide-react';

interface SpendingHeatmapProps {
  transactions: Array<{
    date: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
  months?: number;
}

interface DayData {
  date: string;
  amount: number;
  count: number;
  level: number; // 0-4 for color intensity
}

export function SpendingHeatmap({ transactions, months = 3 }: SpendingHeatmapProps) {
  const { formatCurrency } = useCurrency();
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  // Process transactions into daily data
  const dailyData = useMemo(() => {
    const data = new Map<string, DayData>();
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const date = new Date(transaction.date).toISOString().split('T')[0];
        const existing = data.get(date) || { date, amount: 0, count: 0, level: 0 };
        existing.amount += transaction.amount;
        existing.count += 1;
        data.set(date, existing);
      });

    // Calculate color levels based on amount distribution
    const amounts = Array.from(data.values()).map(d => d.amount).sort((a, b) => a - b);
    const quartiles = [
      amounts[Math.floor(amounts.length * 0.25)] || 0,
      amounts[Math.floor(amounts.length * 0.5)] || 0,
      amounts[Math.floor(amounts.length * 0.75)] || 0,
      amounts[Math.floor(amounts.length * 0.9)] || 0,
    ];

    data.forEach(day => {
      if (day.amount === 0) {
        day.level = 0;
      } else if (day.amount <= quartiles[0]) {
        day.level = 1;
      } else if (day.amount <= quartiles[1]) {
        day.level = 2;
      } else if (day.amount <= quartiles[2]) {
        day.level = 3;
      } else {
        day.level = 4;
      }
    });

    return data;
  }, [transactions]);

  // Generate calendar grid for the specified months
  const calendarGrid = useMemo(() => {
    const grid: Array<{ date: string; dayData?: DayData }> = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      grid.push({
        date: dateStr,
        dayData: dailyData.get(dateStr),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return grid;
  }, [dailyData, months]);

  const getColorClass = (level: number) => {
    const colors = [
      'bg-muted/30', // No data
      'bg-green-200 dark:bg-green-900/30', // Low
      'bg-green-400 dark:bg-green-700/50', // Medium-low
      'bg-green-500 dark:bg-green-600/70', // Medium-high
      'bg-green-600 dark:bg-green-500/90', // High
    ];
    return colors[level] || colors[0];
  };

  const getWeeks = () => {
    const weeks: typeof calendarGrid[] = [];
    let currentWeek: typeof calendarGrid = [];
    
    calendarGrid.forEach((day, index) => {
      const dayOfWeek = new Date(day.date).getDay();
      
      if (index === 0) {
        // Pad first week
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ date: '' });
        }
      }
      
      currentWeek.push(day);
      
      if (dayOfWeek === 6 || index === calendarGrid.length - 1) {
        // Pad last week if needed
        while (currentWeek.length < 7) {
          currentWeek.push({ date: '' });
        }
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  };

  const weeks = getWeeks();
  const totalSpending = Array.from(dailyData.values()).reduce((sum, day) => sum + day.amount, 0);
  const avgDailySpending = dailyData.size > 0 ? totalSpending / dailyData.size : 0;

  if (dailyData.size === 0) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Spending Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No spending data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Spending Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Spending</div>
              <div className="font-bold text-lg tabular-nums">{formatCurrency(totalSpending)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Daily</div>
              <div className="font-bold text-lg tabular-nums">{formatCurrency(avgDailySpending)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Active Days</div>
              <div className="font-bold text-lg tabular-nums">{dailyData.size}</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="overflow-x-auto">
            <TooltipProvider>
              <div className="flex gap-1 min-w-max">
                {/* Day labels */}
                <div className="flex flex-col gap-1 mr-2 text-xs text-muted-foreground flex-shrink-0">
                  <div className="h-3" />
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* Weeks */}
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1 flex-shrink-0">
                    {week.map((day, dayIndex) => {
                      if (!day.date) {
                        return <div key={dayIndex} className="h-3 w-3" />;
                      }

                      const dayData = day.dayData;
                      return (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-3 w-3 rounded-sm cursor-pointer transition-all hover:scale-125 ${
                                dayData ? getColorClass(dayData.level) : 'bg-muted/20'
                              }`}
                              onMouseEnter={() => dayData && setHoveredDay(dayData)}
                              onMouseLeave={() => setHoveredDay(null)}
                            />
                          </TooltipTrigger>
                          {dayData && (
                            <TooltipContent>
                              <div className="space-y-1">
                                <div className="font-medium">{new Date(day.date).toLocaleDateString()}</div>
                                <div className="text-sm font-bold tabular-nums">{formatCurrency(dayData.amount)}</div>
                                <div className="text-xs text-muted-foreground">{dayData.count} transactions</div>
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className={`h-3 w-3 rounded-sm ${getColorClass(level)}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
