'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Link, 
  Unlink, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Banknote,
  CreditCard,
  Wallet
} from 'lucide-react';
import { BankAccount, BankProvider } from '@/lib/types';
import { useBankIntegration } from '@/hooks/useBankIntegration';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';

interface BankLinkingProps {
  onAccountLinked?: (account: BankAccount) => void;
}

export function BankLinking({ onAccountLinked }: BankLinkingProps) {
  const { bankAccounts, linkBankAccount, unlinkBankAccount, syncBankTransactions, loading } = useBankIntegration();
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linking, setLinking] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'plaid' as BankProvider,
    institutionName: '',
    accountName: '',
    accountType: 'checking' as const,
    accountNumberLast4: '',
    balance: 0,
    currency: 'USD',
    autoSync: true,
    syncFrequency: 'daily' as const
  });

  const handleLinkAccount = async () => {
    if (!formData.institutionName || !formData.accountName || !formData.accountNumberLast4) {
      return;
    }

    setLinking(true);
    try {
      const newAccount = await linkBankAccount({
        ...formData,
        providerAccountId: `${formData.provider}_${Date.now()}`,
        lastSync: new Date().toISOString(),
        isActive: true,
        syncStatus: 'connected'
      });

      setShowLinkDialog(false);
      setFormData({
        provider: 'plaid',
        institutionName: '',
        accountName: '',
        accountType: 'checking',
        accountNumberLast4: '',
        balance: 0,
        currency: 'USD',
        autoSync: true,
        syncFrequency: 'daily'
      });

      if (onAccountLinked) {
        onAccountLinked(newAccount);
      }
    } catch (error) {
      console.error('Error linking bank account:', error);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkAccount = async (accountId: string) => {
    try {
      await unlinkBankAccount(accountId);
    } catch (error) {
      console.error('Error unlinking bank account:', error);
    }
  };

  const handleSyncAccount = async (accountId: string) => {
    try {
      await syncBankTransactions(accountId);
    } catch (error) {
      console.error('Error syncing bank account:', error);
    }
  };

  const getProviderIcon = (provider: BankProvider) => {
    switch (provider) {
      case 'plaid': return <Banknote className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      case 'manual': return <Wallet className="h-4 w-4" />;
      case 'csv': return <Wallet className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'disconnected': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-success/20 text-success">Connected</Badge>;
      case 'error': return <Badge className="bg-destructive/20 text-destructive">Error</Badge>;
      case 'pending': return <Badge className="bg-warning/20 text-warning">Pending</Badge>;
      case 'disconnected': return <Badge className="bg-muted/20 text-muted-foreground">Disconnected</Badge>;
      default: return <Badge className="bg-muted/20 text-muted-foreground">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Integration</h2>
          <p className="text-muted-foreground">Connect and manage your bank accounts for automatic transaction imports</p>
        </div>
        <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
          <DialogTrigger asChild>
            <Button>
              Link Bank Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Link Bank Account</DialogTitle>
              <DialogDescription>
                Connect your bank account to automatically sync transactions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value: BankProvider) => 
                    setFormData(prev => ({ ...prev, provider: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plaid">Plaid</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="csv">CSV Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select value={formData.accountType} onValueChange={(value: any) => 
                    setFormData(prev => ({ ...prev, accountType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="credit">Credit Card</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="institutionName">Institution Name</Label>
                <Input
                  id="institutionName"
                  value={formData.institutionName}
                  onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
                  placeholder="e.g., Chase Bank, Bank of America"
                />
              </div>

              <div>
                <Label htmlFor="accountName">Account Name</Label>
                <Input
                  id="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="e.g., My Checking Account"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="accountNumberLast4">Last 4 Digits</Label>
                  <Input
                    id="accountNumberLast4"
                    value={formData.accountNumberLast4}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumberLast4: e.target.value }))}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="balance">Current Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, currency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="syncFrequency">Sync Frequency</Label>
                  <Select value={formData.syncFrequency} onValueChange={(value: any) => 
                    setFormData(prev => ({ ...prev, syncFrequency: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={formData.autoSync}
                  onChange={(e) => setFormData(prev => ({ ...prev, autoSync: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="autoSync">Enable automatic sync</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLinkAccount} disabled={linking}>
                  {linking ? 'Linking...' : 'Link Account'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bank Accounts List */}
      <div className="space-y-4">
        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Link className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No bank accounts linked</h3>
                  <p className="text-muted-foreground">
                    Link your first bank account to start automatic transaction imports
                  </p>
                </div>
                <Button onClick={() => setShowLinkDialog(true)}>
                  Link Bank Account
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          bankAccounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(account.provider)}
                      <div>
                        <h3 className="font-semibold">{account.accountName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {account.institutionName} • {account.accountType} • ****{account.accountNumberLast4}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(account.syncStatus)}
                      {getStatusBadge(account.syncStatus)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(account.balance, account.currency as any)}</div>
                      <div className="text-sm text-muted-foreground">
                        Last sync: {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncAccount(account.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAccount(account.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {account.autoSync && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Auto-sync enabled • {account.syncFrequency}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
