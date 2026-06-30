'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Account } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Wallet, TrendingUp, CreditCard, Smartphone, DollarSign, AlertCircle } from 'lucide-react';

interface AccountSummaryProps {
  accounts: Account[];
  totalBalance: number;
  accountTypeDistribution: Record<string, number>;
  lowBalanceAccounts: number;
  overdrawnAccounts: number;
  creditDebtAccounts: number;
}

const accountTypeIcons = {
  cash: Wallet,
  bank: DollarSign,
  credit: CreditCard,
  mobile: Smartphone,
};

const accountTypeLabels = {
  cash: 'Cash',
  bank: 'Bank',
  credit: 'Credit Cards',
  mobile: 'Mobile',
};

export function AccountSummary({
  accounts,
  totalBalance,
  accountTypeDistribution,
  lowBalanceAccounts,
  overdrawnAccounts,
  creditDebtAccounts,
}: AccountSummaryProps) {
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const hasIssues = lowBalanceAccounts > 0 || overdrawnAccounts > 0 || creditDebtAccounts > 0;
  
  const getAccountTypeBreakdown = () => {
    return Object.entries(accountTypeDistribution).map(([type, count]) => {
      const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons];
      const percentage = accounts.length > 0 ? (count / accounts.length) * 100 : 0;
      
      return {
        type,
        label: accountTypeLabels[type as keyof typeof accountTypeLabels],
        count,
        percentage,
        icon: <Icon className="h-4 w-4" />,
      };
    });
  };

  const accountTypeBreakdown = getAccountTypeBreakdown();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalBalance < 0 ? 'text-destructive' : 'text-success'}`}>
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {accountTypeDistribution.bank || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {accounts.length > 0 ? `${((accountTypeDistribution.bank || 0) / accounts.length * 100).toFixed(0)}% of total` : '0%'}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {accountTypeDistribution.credit || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            {creditDebtAccounts > 0 ? `${creditDebtAccounts} with debt` : 'No debt'}
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Health</CardTitle>
          {hasIssues ? (
            <AlertCircle className="h-4 w-4 text-warning" />
          ) : (
            <TrendingUp className="h-4 w-4 text-success" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {hasIssues ? (
              <span className="text-warning">Issues</span>
            ) : (
              <span className="text-success">Good</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {overdrawnAccounts > 0 && `${overdrawnAccounts} overdrawn`}
            {overdrawnAccounts > 0 && lowBalanceAccounts > 0 && ' • '}
            {lowBalanceAccounts > 0 && `${lowBalanceAccounts} low balance`}
            {overdrawnAccounts === 0 && lowBalanceAccounts === 0 && 'All accounts healthy'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function AccountTypeDistribution({ accountTypeDistribution }: { accountTypeDistribution: Record<string, number> }) {
  const totalAccounts = Object.values(accountTypeDistribution).reduce((sum, count) => sum + count, 0);
  
  if (totalAccounts === 0) return null;

  const breakdown = Object.entries(accountTypeDistribution)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => {
      const Icon = accountTypeIcons[type as keyof typeof accountTypeIcons];
      const percentage = (count / totalAccounts) * 100;
      
      return {
        type,
        label: accountTypeLabels[type as keyof typeof accountTypeLabels],
        count,
        percentage,
        icon: <Icon className="h-4 w-4" />,
      };
    });

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20 rounded-xl">
      <CardHeader>
        <CardTitle>Account Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {breakdown.map(({ type, label, count, percentage, icon }) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
              </div>
              <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
