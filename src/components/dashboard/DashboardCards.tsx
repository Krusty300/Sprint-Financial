'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { AnimatedCounter } from './AnimatedCounter';

interface DashboardCardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  monthlyTrend?: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

function Sparkline({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) {
  if (!data || data.length === 0) return null;
  
  const trend = data.length > 1 ? data[data.length - 1][dataKey] - data[0][dataKey] : 0;
  const isPositive = trend >= 0;
  
  return (
    <div className="h-12 w-full min-h-[48px] min-w-[200px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={48}>
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-background border rounded px-2 py-1 text-xs">
                    {payload[0]?.value?.toLocaleString() || '0'}
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FinancialHealthIndicator({ value, type }: { value: number; type: 'balance' | 'income' | 'expense' | 'networth' }) {
  const getHealthStatus = () => {
    switch (type) {
      case 'balance':
        if (value < 0) return { status: 'critical', color: 'border-destructive', icon: AlertCircle, bgColor: 'bg-destructive/10' };
        if (value < 100) return { status: 'warning', color: 'border-warning', icon: AlertCircle, bgColor: 'bg-warning/10' };
        return { status: 'healthy', color: 'border-success', icon: CheckCircle2, bgColor: 'bg-success/10' };
      case 'income':
        if (value < 1000) return { status: 'warning', color: 'border-warning', icon: AlertCircle, bgColor: 'bg-warning/10' };
        return { status: 'healthy', color: 'border-success', icon: CheckCircle2, bgColor: 'bg-success/10' };
      case 'expense':
        if (value > 5000) return { status: 'warning', color: 'border-warning', icon: AlertCircle, bgColor: 'bg-warning/10' };
        return { status: 'healthy', color: 'border-success', icon: CheckCircle2, bgColor: 'bg-success/10' };
      case 'networth':
        if (value < 0) return { status: 'critical', color: 'border-destructive', icon: AlertCircle, bgColor: 'bg-destructive/10' };
        if (value < 10000) return { status: 'warning', color: 'border-warning', icon: AlertCircle, bgColor: 'bg-warning/10' };
        return { status: 'healthy', color: 'border-success', icon: CheckCircle2, bgColor: 'bg-success/10' };
      default:
        return { status: 'healthy', color: 'border-success', icon: CheckCircle2, bgColor: 'bg-success/10' };
    }
  };

  const { status, color, icon: HealthIcon, bgColor } = getHealthStatus();

  return (
    <div className={`absolute top-2 right-2 p-1.5 rounded-full ${color} ${bgColor} border-2`}>
      <HealthIcon className="h-3 w-3" />
    </div>
  );
}

export function DashboardCards({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netWorth,
  monthlyTrend = [],
}: DashboardCardsProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  // Validate numeric values
  const safeTotalBalance = typeof totalBalance === 'number' && !isNaN(totalBalance) ? totalBalance : 0;
  const safeMonthlyIncome = typeof monthlyIncome === 'number' && !isNaN(monthlyIncome) ? monthlyIncome : 0;
  const safeMonthlyExpenses = typeof monthlyExpenses === 'number' && !isNaN(monthlyExpenses) ? monthlyExpenses : 0;
  const safeNetWorth = typeof netWorth === 'number' && !isNaN(netWorth) ? netWorth : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 min-h-[160px] rounded-lg cursor-pointer relative overflow-hidden"
        onClick={() => router.push('/accounts')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="text-2xl sm:text-3xl font-bold truncate tabular-nums">
            <AnimatedCounter value={safeTotalBalance} />
          </div>
          <Sparkline data={monthlyTrend} dataKey="income" color="#3b82f6" />
          <p className="text-xs text-muted-foreground">
            Across all accounts
          </p>
        </CardContent>
      </Card>

      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-success/20 min-h-[160px] rounded-lg cursor-pointer relative overflow-hidden"
        onClick={() => router.push('/transactions?filter=income')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="text-2xl sm:text-3xl font-bold text-success truncate tabular-nums">
            +<AnimatedCounter value={safeMonthlyIncome} />
          </div>
          <Sparkline data={monthlyTrend} dataKey="income" color="#22c55e" />
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-destructive/20 min-h-[160px] rounded-lg cursor-pointer relative overflow-hidden"
        onClick={() => router.push('/transactions?filter=expense')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className="text-2xl sm:text-3xl font-bold text-destructive truncate tabular-nums">
            -<AnimatedCounter value={safeMonthlyExpenses} />
          </div>
          <Sparkline data={monthlyTrend} dataKey="expenses" color="#ef4444" />
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card 
        className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 min-h-[160px] rounded-lg cursor-pointer relative overflow-hidden"
        onClick={() => router.push('/reports')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          <div className={`text-2xl sm:text-3xl font-bold truncate tabular-nums ${safeNetWorth >= 0 ? 'text-success' : 'text-destructive'}`}>
            <AnimatedCounter value={safeNetWorth} />
          </div>
          <Sparkline data={monthlyTrend} dataKey="income" color={safeNetWorth >= 0 ? "#22c55e" : "#ef4444"} />
          <p className="text-xs text-muted-foreground">
            Total assets minus liabilities
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
