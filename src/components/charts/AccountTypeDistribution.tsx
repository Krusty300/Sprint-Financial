'use client';

import { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart as PieChartIcon,
  BarChart3,
  CreditCard,
  Wallet,
  DollarSign,
  Smartphone,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account, Transaction } from '@/lib/types';

interface AccountTypeData {
  name: string;
  value: number;
  count: number;
  percentage: number;
  accounts: Account[];
}

interface AccountDetail {
  name: string;
  balance: number;
  transactions: number;
}

export function AccountTypeDistribution({ 
  accounts, 
  transactions 
}: { 
  accounts: Account[]; 
  transactions: Transaction[] 
}) {
  const { formatCurrency } = useCurrency();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'pie' | 'bar'>('pie');

  const accountTypeData = useMemo(() => {
    const typeGroups = accounts.reduce((acc, account) => {
      if (!acc[account.type]) {
        acc[account.type] = {
          accounts: [],
          totalBalance: 0
        };
      }
      acc[account.type].accounts.push(account);
      acc[account.type].totalBalance += account.balance;
      return acc;
    }, {} as Record<string, { accounts: Account[]; totalBalance: number }>);

    const totalBalance = Object.values(typeGroups).reduce((sum, group) => sum + group.totalBalance, 0);

    const data: AccountTypeData[] = Object.entries(typeGroups).map(([type, group]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: group.totalBalance,
      count: group.accounts.length,
      percentage: totalBalance > 0 ? (group.totalBalance / totalBalance) * 100 : 0,
      accounts: group.accounts
    }));

    return data.sort((a, b) => b.value - a.value);
  }, [accounts]);

  const accountDetails = useMemo(() => {
    if (!selectedType) return [];

    const typeAccounts = accountTypeData.find(d => d.name.toLowerCase() === selectedType.toLowerCase());
    if (!typeAccounts) return [];

    return typeAccounts.accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.account === account.name);
      return {
        name: account.name,
        balance: account.balance,
        transactions: accountTransactions.length
      };
    });
  }, [selectedType, accountTypeData, transactions]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'bank': return <DollarSign className="h-4 w-4" />;
      case 'credit': return <CreditCard className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {getAccountIcon(data.name)}
            <p className="font-medium">{data.name}</p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span>Total Balance:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(data.value)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Accounts:</span>
              <span className="font-medium">{data.count}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Percentage:</span>
              <span className="font-medium">{data.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handlePieClick = (data: any) => {
    setSelectedType(data.name);
  };

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
      <PieChart>
        <Pie
          data={accountTypeData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) => `${entry.name} ${entry.percentage.toFixed(1)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          onClick={handlePieClick}
        >
          {accountTypeData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300} minWidth={300} minHeight={300}>
      <BarChart data={accountTypeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" fill="#3b82f6" onClick={handlePieClick}>
          {accountTypeData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (selectedType) {
    const typeData = accountTypeData.find(d => d.name.toLowerCase() === selectedType.toLowerCase());
    
    return (
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getAccountIcon(selectedType)}
              {selectedType} Accounts
              <Badge variant="outline">{typeData?.count} accounts</Badge>
            </CardTitle>
            <Button variant="ghost" onClick={() => setSelectedType(null)}>
              <ArrowRight className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(typeData?.value || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Balance</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {typeData?.count || 0}
                </div>
                <div className="text-sm text-muted-foreground">Accounts</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency((typeData?.value || 0) / (typeData?.count || 1))}
                </div>
                <div className="text-sm text-muted-foreground">Avg Balance</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {typeData?.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Portfolio Share</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Account Details</h4>
              <div className="space-y-2">
                {accountDetails.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAccountIcon(selectedType)}
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.transactions} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-blue-600">
                        {formatCurrency(account.balance)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {((account.balance / (typeData?.value || 1)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Account Type Distribution
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('pie')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'pie' ? renderPieChart() : renderBarChart()}
        
        <div className="mt-4 space-y-2">
          <h4 className="font-medium">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {accountTypeData.map((type, index) => (
              <div 
                key={type.name}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedType(type.name)}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1 text-sm">
                    {getAccountIcon(type.name)}
                    <span className="font-medium">{type.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {type.count} accounts • {formatCurrency(type.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
