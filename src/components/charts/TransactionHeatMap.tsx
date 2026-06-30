'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Activity,
  TrendingUp,
  Filter,
  Grid3X3
} from 'lucide-react';
import { Account, Transaction } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';

interface HeatMapData {
  date: string;
  day: number;
  month: number;
  year: number;
  count: number;
  amount: number;
  intensity: number;
}

export function TransactionHeatMap({ 
  account, 
  transactions 
}: { 
  account: Account; 
  transactions: Transaction[] 
}) {
  const { formatCurrency } = useCurrency();
  const [selectedMetric, setSelectedMetric] = useState<'count' | 'amount'>('count');

  const heatMapData = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Filter transactions for this account and date range
    const accountTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.account === account.name && transactionDate >= startDate && transactionDate <= endDate;
    });

    // Create heat map data for each day
    const data: HeatMapData[] = [];
    const countByDay = accountTransactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      acc[dayOfYear] = (acc[dayOfYear] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const amountByDay = accountTransactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      acc[dayOfYear] = (acc[dayOfYear] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);

    const maxCount = Math.max(...Object.values(countByDay), 0);
    const maxAmount = Math.max(...Object.values(amountByDay), 0);

    // Generate data for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayTransactions = accountTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === date.toDateString();
      });

      const count = dayTransactions.length;
      const amount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const intensity = selectedMetric === 'count' 
        ? (count / maxCount) * 100 
        : (amount / maxAmount) * 100;

      data.push({
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        month: date.getMonth(),
        year: date.getFullYear(),
        count,
        amount,
        intensity
      });
    }

    return data;
  }, [account, transactions, selectedMetric]);

  // Group data by weeks for calendar view
  const calendarData = useMemo(() => {
    const weeks: HeatMapData[][] = [];
    let currentWeek: HeatMapData[] = [];

    heatMapData.forEach((day, index) => {
      currentWeek.push(day);
      
      // Start new week on Sunday (day 0) or when we reach the end
      if (day.day === 0 && index > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatMapData]);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100';
    if (intensity < 20) return 'bg-blue-100';
    if (intensity < 40) return 'bg-blue-200';
    if (intensity < 60) return 'bg-blue-300';
    if (intensity < 80) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getIntensityTextColor = (intensity: number) => {
    if (intensity < 40) return 'text-gray-600';
    return 'text-white';
  };

  const formatMonth = (month: number, year: number) => {
    return new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getStatistics = () => {
    const totalTransactions = heatMapData.reduce((sum, day) => sum + day.count, 0);
    const totalAmount = heatMapData.reduce((sum, day) => sum + day.amount, 0);
    const activeDays = heatMapData.filter(day => day.count > 0).length;
    const avgTransactionsPerDay = activeDays > 0 ? totalTransactions / activeDays : 0;
    const avgAmountPerDay = activeDays > 0 ? totalAmount / activeDays : 0;

    return {
      totalTransactions,
      totalAmount,
      activeDays,
      avgTransactionsPerDay,
      avgAmountPerDay
    };
  };

  const stats = getStatistics();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Transaction Heat Map - {account.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Transaction Count</SelectItem>
                <SelectItem value="amount">Transaction Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
            <div className="text-sm text-muted-foreground">Total Transactions</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.activeDays}</div>
            <div className="text-sm text-muted-foreground">Active Days</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.avgTransactionsPerDay.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Avg per Day</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{stats.totalAmount.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.avgAmountPerDay.toFixed(0)}</div>
            <div className="text-sm text-muted-foreground">Avg per Day</div>
          </div>
        </div>

        {/* Calendar Heat Map */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Activity Calendar</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-100 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-300 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              </div>
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Month headers */}
            <div className="grid grid-cols-53 gap-1 text-xs text-muted-foreground">
              {calendarData.map((week, weekIndex) => {
                if (week.length === 0) return null;
                const firstDay = week[0];
                return (
                  <div key={weekIndex} className="col-span-7 text-center">
                    {formatMonth(firstDay.month, firstDay.year)}
                  </div>
                );
              })}
            </div>

            {/* Week days header */}
            <div className="grid grid-cols-53 gap-1 text-xs text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center w-8">{day}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-1">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-53 gap-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const dayData = week.find(d => {
                      const date = new Date(d.date);
                      return date.getDay() === dayIndex;
                    });
                    
                    if (!dayData) {
                      return <div key={dayIndex} className="w-8 h-8"></div>;
                    }

                    return (
                      <div
                        key={dayIndex}
                        className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs cursor-pointer hover:ring-2 hover:ring-blue-400 ${getIntensityColor(dayData.intensity)} ${getIntensityTextColor(dayData.intensity)}`}
                        title={`${dayData.date}: ${dayData.count} transactions, ${formatCurrency(dayData.amount)}`}
                      >
                        {dayData.day}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <p>Heat map showing {selectedMetric === 'count' ? 'transaction frequency' : 'transaction volume'} over the last 12 months.</p>
            <p>Darker colors indicate higher {selectedMetric === 'count' ? 'number of transactions' : 'transaction amounts'}.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
