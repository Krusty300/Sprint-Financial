'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Search,
  Filter,
  Scale,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BankTransaction, ReconciliationReport } from '@/lib/types';
import { useBankIntegration } from '@/hooks/useBankIntegration';

interface TransactionReconciliationProps {
  bankAccountId?: string;
}

export function TransactionReconciliation({ bankAccountId }: TransactionReconciliationProps) {
  const { 
    bankAccounts, 
    bankTransactions, 
    getBankTransactions, 
    getReconciliationReports,
    generateReconciliationReport,
    loading 
  } = useBankIntegration();

  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [generatingReport, setGeneratingReport] = useState(false);

  const accountBankTransactions = useMemo(() => {
    return bankAccountId ? getBankTransactions(bankAccountId) : bankTransactions;
  }, [bankAccountId, bankTransactions, getBankTransactions, bankAccountId]);

  const reports = useMemo(() => {
    return bankAccountId ? getReconciliationReports(bankAccountId) : getReconciliationReports();
  }, [bankAccountId, getReconciliationReports, bankAccountId]);

  const reconciliationStats = useMemo(() => {
    const total = accountBankTransactions.length;
    const matched = accountBankTransactions.filter(t => t.reconciliationStatus === 'matched').length;
    const unmatched = accountBankTransactions.filter(t => t.reconciliationStatus === 'unmatched').length;
    const discrepancies = accountBankTransactions.filter(t => t.reconciliationStatus === 'discrepancy').length;
    const duplicates = accountBankTransactions.filter(t => t.isDuplicate).length;

    return {
      total,
      matched,
      unmatched,
      discrepancies,
      duplicates,
      matchedPercentage: total > 0 ? (matched / total) * 100 : 0
    };
  }, [accountBankTransactions]);

  const handleGenerateReport = async () => {
    if (!bankAccountId) return;
    
    setGeneratingReport(true);
    try {
      await generateReconciliationReport(bankAccountId, selectedPeriod);
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'unmatched': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'discrepancy': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <AlertTriangle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched': return <Badge className="bg-success/20 text-success">Matched</Badge>;
      case 'unmatched': return <Badge className="bg-warning/20 text-warning">Unmatched</Badge>;
      case 'discrepancy': return <Badge className="bg-destructive/20 text-destructive">Discrepancy</Badge>;
      default: return <Badge className="bg-muted/20 text-muted-foreground">Unknown</Badge>;
    }
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case 'balanced': return <Badge className="bg-success/20 text-success">Balanced</Badge>;
      case 'discrepancy': return <Badge className="bg-destructive/20 text-destructive">Discrepancy</Badge>;
      case 'pending': return <Badge className="bg-warning/20 text-warning">Pending</Badge>;
      default: return <Badge className="bg-muted/20 text-muted-foreground">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction Reconciliation</h2>
          <p className="text-muted-foreground">Match bank transactions with your records and identify discrepancies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={!bankAccountId || generatingReport}
          >
            <Scale className="mr-2 h-4 w-4" />
            {generatingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Reconciliation Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{reconciliationStats.total}</div>
              <div className="text-sm text-muted-foreground">Total Transactions</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{reconciliationStats.matched}</div>
              <div className="text-sm text-muted-foreground">Matched</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{reconciliationStats.unmatched}</div>
              <div className="text-sm text-muted-foreground">Unmatched</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{reconciliationStats.discrepancies}</div>
              <div className="text-sm text-muted-foreground">Discrepancies</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-info">{reconciliationStats.duplicates}</div>
              <div className="text-sm text-muted-foreground">Duplicates</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reconciliation Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{reconciliationStats.matchedPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={reconciliationStats.matchedPercentage} className="h-2" />
            </div>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>Matched ({reconciliationStats.matched})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span>Unmatched ({reconciliationStats.unmatched})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <span>Discrepancies ({reconciliationStats.discrepancies})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-info rounded-full"></div>
                <span>Duplicates ({reconciliationStats.duplicates})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Views */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Bank Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountBankTransactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.reconciliationStatus)}
                        {getStatusBadge(transaction.reconciliationStatus)}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()} • {transaction.merchantName}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      {transaction.isDuplicate && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Duplicate
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {accountBankTransactions.length > 10 && (
                  <div className="text-center">
                    <Button variant="outline">
                      Load More Transactions
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Reconciliation Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Generated</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate your first reconciliation report to see detailed analysis
                    </p>
                    <Button onClick={handleGenerateReport} disabled={!bankAccountId}>
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{report.period}</h3>
                          <p className="text-sm text-muted-foreground">
                            Generated on {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getReportStatusBadge(report.status)}
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Bank Balance</div>
                          <div className="font-medium">{formatCurrency(report.bankBalance)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">System Balance</div>
                          <div className="font-medium">{formatCurrency(report.systemBalance)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Difference</div>
                          <div className={`font-medium ${
                            report.difference >= 0 ? 'text-success' : 'text-destructive'
                          }`}>
                            {formatCurrency(report.difference)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Matched</div>
                          <div className="font-medium">{report.matchedTransactions}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Reconciliation analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Discrepancy Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Discrepancy analysis coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
