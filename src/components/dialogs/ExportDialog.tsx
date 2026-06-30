'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Transaction, Category, Account } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  selectedIds?: string[];
  onExportComplete?: () => void;
  categories?: Category[];
  accounts?: Account[];
}

interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  includeHeaders: boolean;
  includeMetadata: boolean;
  dateRange: 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  customFileName?: string;
}

export function ExportDialog({ open, onOpenChange, transactions, selectedIds = [], onExportComplete, categories = [], accounts = [] }: ExportDialogProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeHeaders: true,
    includeMetadata: true,
    dateRange: 'all',
  });

  const transactionsToExport = selectedIds.length > 0 
    ? transactions.filter(t => selectedIds.includes(t.id))
    : transactions;

  // Helper functions to resolve IDs to names
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    return accounts.find(acc => acc.id === accountId);
  };

  const getCategoryName = (categoryId: string) => {
    const category = getCategoryInfo(categoryId);
    return category?.name || categoryId; // Fallback to ID if not found
  };

  const getAccountName = (accountId?: string) => {
    if (!accountId) return '';
    const account = getAccountInfo(accountId);
    return account?.name || accountId; // Fallback to ID if not found
  };

  const handleExport = () => {
    try {
      // Validate data before export
      if (!transactionsToExport || transactionsToExport.length === 0) {
        throw new Error('No transactions to export');
      }

      // Validate file name
      const sanitizeFileName = (name: string) => {
        return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').trim();
      };

      let data: string;
      let mimeType: string;
      let fileName: string;

      const baseFileName = options.customFileName 
        ? sanitizeFileName(options.customFileName)
        : selectedIds.length > 0 
          ? `selected-transactions-${formatDate(new Date())}`
          : `transactions-${formatDate(new Date())}`;

      switch (options.format) {
        case 'json':
          data = exportToJSON();
          mimeType = 'application/json';
          fileName = `${baseFileName}.json`;
          break;
        case 'csv':
          data = exportToCSV();
          mimeType = 'text/csv';
          fileName = `${baseFileName}.csv`;
          break;
        case 'xlsx':
          // Excel format - using CSV format that Excel can open
          data = exportToExcel();
          mimeType = 'text/csv';
          fileName = `${baseFileName}.csv`;
          break;
        case 'pdf':
          // Create HTML format that can be printed to PDF
          data = exportToPDF();
          mimeType = 'text/html';
          fileName = `${baseFileName}.html`;
          break;
        default:
          data = exportToJSON();
          mimeType = 'application/json';
          fileName = `${baseFileName}.json`;
      }

      // Validate generated data
      if (!data || data.length === 0) {
        throw new Error('Failed to generate export data');
      }

      // Create download link
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success message
      console.log(`Successfully exported ${transactionsToExport.length} transactions to ${fileName}`);

      // Call export complete callback
      if (onExportComplete) {
        onExportComplete();
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during export';
      alert(`Export failed: ${errorMessage}`);
      
      // Keep dialog open on error so user can try again
      // Don't call onOpenChange(false) here
    }
  };

  const exportToJSON = (): string => {
    const enrichedTransactions = transactionsToExport.map(t => ({
      ...t,
      categoryName: getCategoryName(t.category),
      accountName: getAccountName(t.account),
    }));

    // Calculate additional statistics
    const totalIncome = transactionsToExport
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactionsToExport
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Category breakdown
    const categoryBreakdown = transactionsToExport.reduce((acc, t) => {
      const categoryName = getCategoryName(t.category);
      if (!acc[categoryName]) {
        acc[categoryName] = { count: 0, total: 0, type: t.type };
      }
      acc[categoryName].count++;
      acc[categoryName].total += t.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number; type: string }>);

    // Account breakdown
    const accountBreakdown = transactionsToExport.reduce((acc, t) => {
      const accountName = getAccountName(t.account);
      if (!acc[accountName]) {
        acc[accountName] = { count: 0, total: 0 };
      }
      acc[accountName].count++;
      acc[accountName].total += t.amount;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const exportData = {
      metadata: options.includeMetadata ? {
        exportedAt: new Date().toISOString(),
        count: transactionsToExport.length,
        dateRange: options.dateRange === 'custom' 
          ? { start: options.startDate, end: options.endDate }
          : 'all',
        totalAmount: transactionsToExport.reduce((sum, t) => sum + t.amount, 0),
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        categoryBreakdown,
        accountBreakdown,
        categories: categories.map(cat => ({ id: cat.id, name: cat.name, type: cat.type, color: cat.color })),
        accounts: accounts.map(acc => ({ id: acc.id, name: acc.name })),
      } : undefined,
      transactions: enrichedTransactions
    };

    return JSON.stringify(exportData, null, 2);
  };

  const exportToCSV = (): string => {
    const headers = options.includeHeaders ? 
      'Date,Description,Category,Type,Amount,Account,Tags,Notes\n' : '';
    
    const rows = transactionsToExport.map(t => {
      const date = formatDate(t.date);
      const description = `"${(t.description || '').replace(/"/g, '""')}"`;
      const categoryName = `"${getCategoryName(t.category || '').replace(/"/g, '""')}"`;
      const type = t.type;
      const amount = t.amount.toString();
      const accountName = `"${getAccountName(t.account).replace(/"/g, '""')}"`;
      const tags = `"${(t.tags || []).join(';').replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      
      return `${date},${description},${categoryName},${type},${amount},${accountName},${tags},${notes}`;
    }).join('\n');

    // Add BOM for better Excel compatibility with UTF-8
    const BOM = '\uFEFF';
    return BOM + headers + rows;
  };

  const exportToExcel = (): string => {
    // For now, create a CSV format that Excel can properly parse
    // In a production app, you'd use a library like xlsx or exceljs
    const headers = options.includeHeaders ? 
      'Date,Description,Category,Type,Amount,Account,Tags,Notes\n' : '';
    
    const rows = transactionsToExport.map(t => {
      const date = formatDate(t.date);
      const description = `"${(t.description || '').replace(/"/g, '""')}"`;
      const categoryName = `"${getCategoryName(t.category || '').replace(/"/g, '""')}"`;
      const type = t.type;
      const amount = t.amount.toFixed(2);
      const accountName = `"${getAccountName(t.account).replace(/"/g, '""')}"`;
      const tags = `"${(t.tags || []).join(';').replace(/"/g, '""')}"`;
      const notes = `"${(t.notes || '').replace(/"/g, '""')}"`;
      
      return `${date},${description},${categoryName},${type},${amount},${accountName},${tags},${notes}`;
    }).join('\n');

    // Add BOM for better Excel compatibility with UTF-8
    const BOM = '\uFEFF';
    return BOM + headers + rows;
  };

  const exportToPDF = (): string => {
    const title = selectedIds.length > 0 ? 'Selected Transactions' : 'All Transactions';
    const date = formatDate(new Date());
    const totalAmount = transactionsToExport.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = transactionsToExport.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactionsToExport.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
        }
        .header h1 { color: #2563eb; margin-bottom: 10px; }
        .summary { 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 30px;
        }
        .summary-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px;
        }
        .summary-item { 
            text-align: center; 
            padding: 15px; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px;
        }
        .summary-item .value { font-size: 24px; font-weight: bold; }
        .positive { color: #16a34a; }
        .negative { color: #dc2626; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left;
        }
        th { background: #f8fafc; font-weight: bold; }
        .amount-positive { color: #16a34a; font-weight: bold; }
        .amount-negative { color: #dc2626; font-weight: bold; }
        .notes { font-style: italic; color: #666; }
        @media print {
            body { margin: 20px; }
            .summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Exported on ${date}</p>
        <p>Total: ${transactionsToExport.length} transactions</p>
    </div>

    ${options.includeMetadata ? `
    <div class="summary">
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="summary-item">
                <div class="value ${totalAmount >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(totalAmount)}
                </div>
                <div>Total Amount</div>
            </div>
            <div class="summary-item">
                <div class="value positive">${formatCurrency(totalIncome)}</div>
                <div>Total Income</div>
            </div>
            <div class="summary-item">
                <div class="value negative">${formatCurrency(totalExpenses)}</div>
                <div>Total Expenses</div>
            </div>
            <div class="summary-item">
                <div class="value">${transactionsToExport.length}</div>
                <div>Transactions</div>
            </div>
            <div class="summary-item">
                <div class="value">${Object.keys(transactionsToExport.reduce((acc, t) => {
                    const categoryName = getCategoryName(t.category);
                    acc[categoryName] = true;
                    return acc;
                }, {} as Record<string, boolean>)).length}</div>
                <div>Categories</div>
            </div>
            <div class="summary-item">
                <div class="value">${Object.keys(transactionsToExport.reduce((acc, t) => {
                    if (t.account) {
                        const accountName = getAccountName(t.account);
                        acc[accountName] = true;
                    }
                    return acc;
                }, {} as Record<string, boolean>)).length}</div>
                <div>Accounts</div>
            </div>
        </div>
        
        ${categories.length > 0 ? `
        <h3>Top Categories</h3>
        <table style="margin-bottom: 20px;">
            <tr><th>Category</th><th>Count</th><th>Total</th></tr>
            ${Object.entries(
                transactionsToExport.reduce((acc, t) => {
                    const categoryName = getCategoryName(t.category);
                    if (!acc[categoryName]) {
                        acc[categoryName] = { count: 0, total: 0 };
                    }
                    acc[categoryName].count++;
                    acc[categoryName].total += t.amount;
                    return acc;
                }, {} as Record<string, { count: number; total: number }>)
            )
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([name, data]) => `
                    <tr>
                        <td>${name}</td>
                        <td>${data.count}</td>
                        <td class="${data.total >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.total)}</td>
                    </tr>
                `).join('')}
        </table>
        ` : ''}
    </div>
    ` : ''}

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Tags</th>
                ${options.includeMetadata ? '<th>Notes</th>' : ''}
            </tr>
        </thead>
        <tbody>
            ${transactionsToExport.map(t => `
                <tr>
                    <td>${formatDate(t.date)}</td>
                    <td>${t.description || ''}</td>
                    <td>${getCategoryName(t.category || '')}</td>
                    <td>${t.type}</td>
                    <td class="${t.type === 'income' ? 'amount-positive' : 'amount-negative'}">
                        ${formatCurrency(t.amount)}
                    </td>
                    <td>${getAccountName(t.account)}</td>
                    <td>${(t.tags || []).join(', ') || ''}</td>
                    ${options.includeMetadata ? `<td class="notes">${t.notes || ''}</td>` : ''}
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
        <p>Generated by Finance Tracker</p>
    </div>
</body>
</html>`;

    return htmlContent;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileDown className="h-4 w-4" />;
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />;
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="export-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Download className="h-5 w-5 text-green-600" />
            </div>
            <DialogTitle>Export Transactions</DialogTitle>
          </div>
          <DialogDescription id="export-dialog-description">
            Export {selectedIds.length > 0 ? selectedIds.length : transactionsToExport.length} transactions in your preferred format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Note: Excel export creates a CSV file optimized for Excel compatibility
            </div>
            <RadioGroup 
              value={options.format} 
              onValueChange={(value: any) => setOptions(prev => ({ ...prev, format: value }))}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center cursor-pointer">
                  <FileDown className="h-4 w-4 mr-2" />
                  JSON
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel (CSV)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center cursor-pointer">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF (HTML)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="headers" 
                  checked={options.includeHeaders}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeHeaders: !!checked }))}
                />
                <Label htmlFor="headers" className="text-sm">Include column headers (CSV/Excel)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="metadata" 
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => setOptions(prev => ({ ...prev, includeMetadata: !!checked }))}
                />
                <Label htmlFor="metadata" className="text-sm">Include metadata and summary</Label>
              </div>
            </div>
          </div>

          {/* File Name */}
          <div className="space-y-2">
            <Label htmlFor="filename" className="text-sm font-medium">Custom File Name (optional)</Label>
            <Input
              id="filename"
              placeholder="transactions-export"
              value={options.customFileName || ''}
              onChange={(e) => setOptions(prev => ({ ...prev, customFileName: e.target.value }))}
            />
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Transactions to export:</span>
                <span className={`font-medium ${transactionsToExport.length === 0 ? 'text-destructive' : ''}`}>
                  {transactionsToExport.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Format:</span>
                <span className="font-medium flex items-center">
                  {getFormatIcon(options.format)}
                  <span className="ml-1">{options.format.toUpperCase()}</span>
                </span>
              </div>
              {transactionsToExport.length > 0 && (
                <div className="flex justify-between">
                  <span>File type:</span>
                  <span className="font-medium">
                    {options.format === 'xlsx' ? 'CSV (Excel compatible)' :
                     options.format === 'pdf' ? 'HTML (printable)' :
                     options.format}
                  </span>
                </div>
              )}
            </div>
            {transactionsToExport.length === 0 && (
              <div className="mt-2 text-xs text-destructive">
                No transactions available for export
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            className="flex items-center"
            disabled={transactionsToExport.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export {transactionsToExport.length} Transactions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
