'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { BankAccount, BankSync } from '@/lib/types';
import { useBankIntegration } from '@/hooks/useBankIntegration';

interface CSVImportProps {
  onImportComplete?: (sync: BankSync) => void;
}

export function CSVImport({ onImportComplete }: CSVImportProps) {
  const { bankAccounts, importFromCSV, loading } = useBankIntegration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      parseCSVPreview(file);
    } else {
      setSelectedFile(null);
      setPreview([]);
    }
  };

  const parseCSVPreview = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setPreview([]);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];

      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        
        data.push(row);
      }

      setPreview(data);
    } catch (error) {
      console.error('Error parsing CSV preview:', error);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedAccount) return;

    setImporting(true);
    setImportProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const sync = await importFromCSV(selectedFile, selectedAccount);
      
      clearInterval(progressInterval);
      setImportProgress(100);

      if (onImportComplete) {
        onImportComplete(sync);
      }

      // Reset after successful import
      setTimeout(() => {
        setSelectedFile(null);
        setSelectedAccount('');
        setPreview([]);
        setShowPreview(false);
        setImportProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (error) {
      console.error('Error importing CSV:', error);
    } finally {
      setImporting(false);
    }
  };

  const getCSVTemplate = () => {
    const csvContent = `date,description,amount,category,merchant_name
2024-01-15,Coffee Shop,4.50,Food & Dining,Starbucks
2024-01-16,Gas Station,45.00,Transportation,Shell
2024-01-17,Salary Deposit,2000.00,Income,Company XYZ
2024-01-18,Grocery Store,125.30,Food & Dining,Walmart
2024-01-19,Electric Bill,85.00,Utilities,Power Company`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaction_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateCSV = () => {
    if (!preview.length) return false;
    
    const requiredFields = ['date', 'description', 'amount'];
    const headers = Object.keys(preview[0]);
    
    return requiredFields.every(field => headers.includes(field));
  };

  const isValid = selectedFile && selectedAccount && validateCSV();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CSV Import</h2>
          <p className="text-muted-foreground">Import transactions from CSV files exported from your bank</p>
        </div>
        <Button variant="outline" onClick={getCSVTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Import Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="csvFile">CSV File</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={importing}
                />
                {selectedFile && (
                  <Badge variant="outline" className="text-xs">
                    {selectedFile.name}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="bankAccount">Bank Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount} disabled={importing}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - {account.institutionName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedFile && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {validateCSV() ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>CSV Format</span>
                </div>
                
                {validateCSV() ? (
                  <p className="text-sm text-green-600">CSV format is valid</p>
                ) : (
                  <p className="text-sm text-red-600">
                    CSV must contain: date, description, amount columns
                  </p>
                )}
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Importing...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="h-2" />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleImport} 
                disabled={!isValid || importing}
                className="flex-1"
              >
                {importing ? 'Importing...' : 'Import Transactions'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPreview(!showPreview)}
                disabled={!preview.length}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CSV Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preview.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a CSV file to see a preview of the data
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Showing first {preview.length} rows of {selectedFile?.name}
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          {Object.keys(preview[0]).map((header) => (
                            <th key={header} className="p-2 text-left font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} className="p-2">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Make sure your CSV has columns: date, description, amount, category (optional)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Required Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>date:</strong> Transaction date (YYYY-MM-DD format)</li>
                <li>• <strong>description:</strong> Transaction description</li>
                <li>• <strong>amount:</strong> Transaction amount (positive for income, negative for expenses)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Optional Columns</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>category:</strong> Transaction category</li>
                <li>• <strong>merchant_name:</strong> Merchant or payee name</li>
                <li>• <strong>tags:</strong> Comma-separated tags</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use the provided template for best results</li>
              <li>• Ensure dates are in YYYY-MM-DD format</li>
              <li>• Use negative amounts for expenses, positive for income</li>
              <li>• Remove any special characters from descriptions</li>
              <li>• Review the preview before importing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
