'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CreditCard, 
  Wallet, 
  Smartphone, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Eye,
  Settings,
  Plus
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Account, Transaction } from '@/lib/types';

interface QuickAccountSwitcherProps {
  accounts: Account[];
  transactions: Transaction[];
  selectedAccount?: Account | null;
  onAccountSelect?: (account: Account) => void;
  onAccountView?: (account: Account) => void;
  onAccountEdit?: (account: Account) => void;
  showAddButton?: boolean;
  onAddAccount?: () => void;
}

export function QuickAccountSwitcher({
  accounts,
  transactions,
  selectedAccount,
  onAccountSelect,
  onAccountView,
  onAccountEdit,
  showAddButton = true,
  onAddAccount
}: QuickAccountSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate account stats
  const accountStats = accounts.map(account => {
    const accountTransactions = transactions.filter(t => t.account === account.name);
    const balance = account.balance;
    const netChange = accountTransactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : -t.amount), 0
    );

    return {
      ...account,
      balance,
      transactionCount: accountTransactions.length,
      netChange,
      healthScore: calculateHealthScore(account, netChange, accountTransactions.length)
    };
  });

  function calculateHealthScore(account: Account, netChange: number, transactionCount: number): number {
    let score = 100;
    
    if (account.balance < 0) score -= 40;
    else if (account.balance < 100) score -= 20;
    
    if (transactionCount === 0) score -= 30;
    else if (transactionCount < 5) score -= 10;
    
    if (netChange < -100) score -= 30;
    else if (netChange < 0) score -= 15;
    
    return Math.max(0, score);
  }

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Wallet className="h-4 w-4" />;
      case 'bank': return <DollarSign className="h-4 w-4" />;
      case 'credit': return <CreditCard className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800 text-xs">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800 text-xs">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800 text-xs">Poor</Badge>;
  };

  const filteredAccounts = accountStats.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {selectedAccount ? (
            <>
              <span className="truncate">{selectedAccount.name}</span>
              <span className="text-muted-foreground">
                {formatCurrency(selectedAccount.balance)}
              </span>
            </>
          ) : (
            <>
              <ArrowUpDown className="h-4 w-4" />
              <span>Select Account</span>
            </>
          )}
        </div>
      </Button>
      
      {showAddButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onAddAccount}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {open && (
        <Card className="absolute top-full mt-2 w-96 z-50 shadow-lg rounded-xl">
          <CardContent className="p-4">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
              
              {onAddAccount && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddAccount}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Account
                </Button>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      onAccountSelect?.(account);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{account.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.type} • {account.transactionCount} transactions
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className={`font-medium ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </div>
                        <div className={`text-xs flex items-center gap-1 ${getHealthColor(account.healthScore)}`}>
                          {account.netChange >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatCurrency(account.netChange)}
                        </div>
                      </div>
                      {getHealthBadge(account.healthScore)}
                    </div>
                  </div>
                ))}
                
                {filteredAccounts.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No accounts found
                  </div>
                )}
              </div>
              
              {selectedAccount && (
                <div className="border-t pt-2 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAccountView?.(selectedAccount);
                      setOpen(false);
                    }}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onAccountEdit?.(selectedAccount);
                      setOpen(false);
                    }}
                    className="w-full"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Account
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Account Summary Badge
export function AccountSummaryBadge({ 
  account, 
  showBalance = true 
}: { 
  account: Account; 
  showBalance?: boolean;
}) {
  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Wallet className="h-3 w-3" />;
      case 'bank': return <DollarSign className="h-3 w-3" />;
      case 'credit': return <CreditCard className="h-3 w-3" />;
      case 'mobile': return <Smartphone className="h-3 w-3" />;
      default: return <Wallet className="h-3 w-3" />;
    }
  };

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      <span className="truncate max-w-24">{account.name}</span>
      {showBalance && (
        <span className="text-muted-foreground">
          {formatCurrency(account.balance)}
        </span>
      )}
    </Badge>
  );
}
