'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BankLinking } from '@/components/banking/BankLinking';
import { TransactionReconciliation } from '@/components/banking/TransactionReconciliation';
import { CSVImport } from '@/components/banking/CSVImport';
import { useBankIntegration } from '@/hooks/useBankIntegration';
import { useTheme } from '@/contexts/ThemeContext';
import { FavoriteButton } from '@/components/layout/FavoriteButton';

export default function BankingPage() {
  const { bankFeedStatus } = useBankIntegration();
  const { resolvedTheme } = useTheme();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bank Integration</h1>
          <p className="text-muted-foreground">
            Connect your bank accounts, import transactions, and reconcile your finances
          </p>
        </div>
        <FavoriteButton size="sm" variant="outline" showLabel={false} />
      </div>

      {/* Bank Feed Status */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Bank Feed Status</h3>
            <p className="text-sm text-muted-foreground">
              {bankFeedStatus.totalAccounts} accounts connected • 
              {bankFeedStatus.totalTransactions} transactions imported
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              bankFeedStatus.status === 'active' ? 'bg-success' :
              bankFeedStatus.status === 'error' ? 'bg-destructive' : 'bg-muted'
            }`} />
            <span className="text-sm font-medium capitalize">{bankFeedStatus.status}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="linking" className="space-y-6">
        <TabsList>
          <TabsTrigger value="linking">Bank Linking</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
          <TabsTrigger value="csv-import">CSV Import</TabsTrigger>
        </TabsList>

        <TabsContent value="linking">
          <BankLinking />
        </TabsContent>

        <TabsContent value="reconciliation">
          <TransactionReconciliation bankAccountId={selectedAccountId} />
        </TabsContent>

        <TabsContent value="csv-import">
          <CSVImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
