'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3,
  Radar as RadarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Target,
  Scale
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account, Transaction } from '@/lib/types';

interface ComparisonData {
  name: string;
  balance: number;
  income: number;
  expenses: number;
  transactions: number;
  avgTransaction: number;
  efficiency: number;
}

interface AccountComparisonProps {
  accounts: Account[];
  transactions: Transaction[];
  metric?: 'balance' | 'income' | 'expenses' | 'transactions' | 'efficiency';
  chartType?: 'bar' | 'radar';
}

export function AccountComparison({ 
  accounts, 
  transactions,
  metric = 'balance',
  chartType = 'bar'
}: AccountComparisonProps) {
  const { formatCurrency } = useCurrency();
  const [selectedMetric, setSelectedMetric] = useState(metric);
  const [selectedChartType, setSelectedChartType] = useState(chartType);

  const comparisonData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return t.account === account.name && 
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });

      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalTransactions = accountTransactions.length;
      const avgTransaction = totalTransactions > 0 ? (income + expenses) / totalTransactions : 0;
      
      // Calculate efficiency (income vs expenses ratio)
      const efficiency = expenses > 0 ? (income / expenses) * 100 : 100;

      return {
        name: account.name,
        balance: account.balance,
        income,
        expenses,
        transactions: totalTransactions,
        avgTransaction,
        efficiency
      } as ComparisonData;
    });
  }, [accounts, transactions]);

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'balance': return '#3b82f6';
      case 'income': return '#10b981';
      case 'expenses': return '#ef4444';
      case 'transactions': return '#f59e0b';
      case 'efficiency': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'balance': return <DollarSign className="h-4 w-4" />;
      case 'income': return <TrendingUp className="h-4 w-4" />;
      case 'expenses': return <TrendingDown className="h-4 w-4" />;
      case 'transactions': return <Activity className="h-4 w-4" />;
      case 'efficiency': return <Target className="h-4 w-4" />;
      default: return <Scale className="h-4 w-4" />;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'balance': return 'Balance';
      case 'income': return 'Income';
      case 'expenses': return 'Expenses';
      case 'transactions': return 'Transactions';
      case 'efficiency': return 'Efficiency %';
      default: return 'Value';
    }
  };

  const formatMetricValue = (value: number, metric: string) => {
    switch (metric) {
      case 'balance':
      case 'income':
      case 'expenses':
      case 'avgTransaction':
        return formatCurrency(value);
      case 'transactions':
        return value.toString();
      case 'efficiency':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Balance:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(data.balance)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Income:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(data.income)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Expenses:</span>
              <span className="font-medium text-red-600">
                {formatCurrency(data.expenses)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Transactions:</span>
              <span className="font-medium text-orange-600">
                {data.transactions}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Efficiency:</span>
              <span className="font-medium text-purple-600">
                {data.efficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
      <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar dataKey={selectedMetric} fill={getMetricColor(selectedMetric)} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderRadarChart = () => {
    const radarData = comparisonData.map(account => ({
      account: account.name,
      balance: Math.max(0, (account.balance / Math.max(...comparisonData.map(a => Math.abs(a.balance)))) * 100),
      income: Math.max(0, (account.income / Math.max(...comparisonData.map(a => a.income))) * 100),
      expenses: Math.max(0, (account.expenses / Math.max(...comparisonData.map(a => a.expenses))) * 100),
      transactions: Math.max(0, (account.transactions / Math.max(...comparisonData.map(a => a.transactions))) * 100),
      efficiency: Math.min(100, account.efficiency)
    }));

    return (
      <ResponsiveContainer width="100%" height={400} minWidth={300} minHeight={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="account" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar name="Balance" dataKey="balance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
          <Radar name="Income" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
          <Radar name="Expenses" dataKey="expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
          <Radar name="Transactions" dataKey="transactions" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
          <Radar name="Efficiency" dataKey="efficiency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const getTopAccounts = (metric: string, limit: number = 3) => {
    return [...comparisonData]
      .sort((a, b) => {
        const aValue = a[metric as keyof ComparisonData] as number;
        const bValue = b[metric as keyof ComparisonData] as number;
        return bValue - aValue;
      })
      .slice(0, limit);
  };

  const topAccounts = getTopAccounts(selectedMetric);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Account Comparison
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expenses">Expenses</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="efficiency">Efficiency</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={selectedChartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedChartType === 'radar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChartType('radar')}
            >
              <RadarIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedChartType === 'bar' ? renderBarChart() : renderRadarChart()}

        {/* Top Performers */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            {getMetricIcon(selectedMetric)}
            <h4 className="font-medium">Top {getMetricLabel(selectedMetric)}</h4>
          </div>
          <div className="space-y-2">
            {topAccounts.map((account, index) => (
              <div key={account.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.transactions} transactions
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium`} style={{ color: getMetricColor(selectedMetric) }}>
                    {formatMetricValue(account[selectedMetric as keyof ComparisonData] as number, selectedMetric)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(((account[selectedMetric as keyof ComparisonData] as number) / 
                      Math.max(...comparisonData.map(a => a[selectedMetric as keyof ComparisonData] as number))) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {formatMetricValue(
                Math.max(...comparisonData.map(a => a[selectedMetric as keyof ComparisonData] as number)),
                selectedMetric
              )}
            </div>
            <div className="text-sm text-muted-foreground">Highest {getMetricLabel(selectedMetric)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatMetricValue(
                Math.min(...comparisonData.map(a => a[selectedMetric as keyof ComparisonData] as number)),
                selectedMetric
              )}
            </div>
            <div className="text-sm text-muted-foreground">Lowest {getMetricLabel(selectedMetric)}</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatMetricValue(
                comparisonData.reduce((sum, a) => sum + (a[selectedMetric as keyof ComparisonData] as number), 0) / comparisonData.length,
                selectedMetric
              )}
            </div>
            <div className="text-sm text-muted-foreground">Average {getMetricLabel(selectedMetric)}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {comparisonData.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Accounts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
