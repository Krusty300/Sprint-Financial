'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Download,
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Monitor,
  Sun,
  Moon,
  Globe,
  Settings as SettingsIcon,
  RefreshCw,
  Trash2,
  Loader2
} from 'lucide-react';
import { verifyDataPersistence, verifyLocalStorage } from '@/lib/dataVerification';
import { seedSampleData } from '@/lib/seedData';
import { db } from '@/lib/db';
import { useTheme } from '@/contexts/ThemeContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useCurrency, type Currency } from '@/contexts/CurrencyContext';
import { useFormatting, type DateFormat, type NumberFormat } from '@/contexts/FormattingContext';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { FinancialCalculator } from '@/components/settings/FinancialCalculator';
import { ThemeSettings } from '@/components/settings/ThemeSettings';
import { ErrorAnalysisDashboard } from '@/components/settings/ErrorAnalysisDashboard';
import { DataRefreshManager } from '@/components/settings/DataRefreshManager';
import { toast } from 'sonner';
import { settingsErrorValidator, ValidationError } from '@/utils/settingsErrorValidation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FavoriteButton } from '@/components/layout/FavoriteButton';
import { Info } from 'lucide-react';
import { useRealtimeSync, syncCurrency, syncData, syncImportExport } from '@/utils/realtimeSync';

// Status type enum
type AppStatus = 'checking' | 'available' | 'connected' | 'loaded' | 'active' | 'limited' | 'unavailable' | 'error';

// Transaction type for import
type ImportTransaction = {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  account?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export default function SettingsPage() {
  const { resetOnboarding, progress } = useOnboarding();
  const { currency, setCurrency, formatCurrency, availableCurrencies, getCurrencySymbol } = useCurrency();
  const { 
    dateFormat, 
    setDateFormat, 
    numberFormat, 
    setNumberFormat, 
    formatDate: formatDateString,
    formatNumber,
    availableDateFormats,
    availableNumberFormats
  } = useFormatting();
  
  // Import/Export Settings
  const [exportFormat, setExportFormat] = useState('json');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  

  // Application Status
  const [appStatus, setAppStatus] = useState<Record<string, AppStatus>>({
    localStorage: 'checking',
    database: 'checking',
    storage: 'checking',
    fonts: 'checking',
    components: 'checking',
    recycleBin: 'checking',
    themeSystem: 'checking'
  });

  // Error validation states
  const [currencyErrors, setCurrencyErrors] = useState<ValidationError[]>([]);
  const [currencyWarnings, setCurrencyWarnings] = useState<ValidationError[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<ValidationError[]>([]);
  const [isValidatingCurrency, setIsValidatingCurrency] = useState(false);
  const [isValidatingDateFormat, setIsValidatingDateFormat] = useState(false);
  const [isValidatingNumberFormat, setIsValidatingNumberFormat] = useState(false);

  // Import/Export validation states
  const [importErrors, setImportErrors] = useState<ValidationError[]>([]);
  const [importWarnings, setImportWarnings] = useState<ValidationError[]>([]);
  const [exportErrors, setExportErrors] = useState<ValidationError[]>([]);
  const [exportWarnings, setExportWarnings] = useState<ValidationError[]>([]);
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [isValidatingExport, setIsValidatingExport] = useState(false);

  // Confirmation dialog states
  const [showSeedDataDialog, setShowSeedDataDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showResetOnboardingDialog, setShowResetOnboardingDialog] = useState(false);
  const [showResetDefaultsDialog, setShowResetDefaultsDialog] = useState(false);

  // Progress tracking for long-running operations
  const [importProgress, setImportProgress] = useState(0);
  const [exportProgress, setExportProgress] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isVerifyingData, setIsVerifyingData] = useState(false);

  // Listen for real-time updates from other tabs
  useRealtimeSync('currency-changed', (event) => {
    const { currency: newCurrency, dateFormat: newDateFormat, numberFormat: newNumberFormat } = event.data;
    if (newCurrency && newCurrency !== currency) {
      setCurrency(newCurrency as Currency);
      toast.info('Currency updated from another tab');
    }
    if (newDateFormat && newDateFormat !== dateFormat) {
      setDateFormat(newDateFormat as DateFormat);
      toast.info('Date format updated from another tab');
    }
    if (newNumberFormat && newNumberFormat !== numberFormat) {
      setNumberFormat(newNumberFormat as NumberFormat);
      toast.info('Number format updated from another tab');
    }
  });

  useRealtimeSync('data-changed', (event) => {
    const { dataType, data } = event.data;
    toast.info(`Data updated from another tab: ${dataType}`);
    
    // Trigger targeted data refresh instead of full reload
    if (dataType === 'transactions' || dataType === 'accounts' || dataType === 'categories') {
      // Re-validate data integrity
      verifyLocalStorage();
      const result = verifyDataPersistence();
      toast.info(`Data refreshed: Categories: ${result.categories}, Accounts: ${result.accounts}, Transactions: ${result.transactions}`);
    }
  });

  useRealtimeSync('import-export-changed', (event) => {
    const { operation, status, details } = event.data;
    toast.info(`${operation.charAt(0).toUpperCase() + operation.slice(1)} ${status} from another tab`);
  });

  // Check application status
  useEffect(() => {
    const checkStatus = () => {
      const status: Record<string, AppStatus> = {
        localStorage: localStorage ? 'available' : 'unavailable',
        database: (() => {
          try {
            db.getTransactions();
            return 'connected';
          } catch {
            return 'error';
          }
        })(),
        storage: (() => {
          const storageUsed = JSON.stringify(localStorage).length;
          const storageAvailable = 5 * 1024 * 1024; // 5MB estimate
          return storageUsed < storageAvailable * 0.8 ? 'available' : 'limited';
        })(),
        fonts: 'loaded', // Could check for specific fonts
        components: 'active',
        recycleBin: (() => {
          try {
            // Check if recycle bin functionality is available
            const hasRecycleBin = localStorage.getItem('recycleBin_enabled') !== null;
            return hasRecycleBin ? 'active' : 'available';
          } catch {
            return 'unavailable';
          }
        })(),
        themeSystem: (() => {
          try {
            // Check if theme system is working
            const hasTheme = localStorage.getItem('theme') !== null;
            return hasTheme ? 'active' : 'available';
          } catch {
            return 'unavailable';
          }
        })()
      };
      setAppStatus(status);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Initial loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleVerifyData = useCallback(() => {
    setIsVerifyingData(true);
    setTimeout(() => {
      verifyLocalStorage();
      const result = verifyDataPersistence();
      toast.success(`Data verification complete! Categories: ${result.categories}, Accounts: ${result.accounts}, Transactions: ${result.transactions}, Budgets: ${result.budgets}`);
      setIsVerifyingData(false);
    }, 500); // Small delay to show loading state
  }, []);

  const handleSeedData = useCallback(() => {
    setShowSeedDataDialog(true);
  }, []);

  const confirmSeedData = useCallback(() => {
    seedSampleData();
    syncData('sample-data', { timestamp: Date.now(), count: 'sample' });
    toast.success('Sample data seeded successfully!');
    setShowSeedDataDialog(false);
  }, []);

  const handleExportData = async () => {
    setIsValidatingExport(true);
    setExportProgress(0);
    setExportErrors([]);
    setExportWarnings([]);
    
    try {
      // Simulate progress for better UX
      setExportProgress(10);
      
      // Validate export settings
      const validation = settingsErrorValidator.validateExportSettings(
        exportFormat, 
        dateRange, 
        includeDeleted
      );
      
      setExportProgress(20);
      
      setExportErrors(validation.errors);
      setExportWarnings(validation.warnings);

      if (!validation.isValid) {
        // Log errors
        validation.errors.forEach(error => {
          settingsErrorValidator.logError('export', error, { 
            exportFormat,
            dateRange,
            includeDeleted
          });
        });
        
        // Show error toast
        toast.error('Export validation failed', {
          description: validation.errors[0]?.message || 'Invalid export settings'
        });
        setExportProgress(0);
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning.message);
          settingsErrorValidator.logError('export', warning, { 
            exportFormat,
            dateRange,
            includeDeleted
          });
        });
      }

      setExportProgress(40);

      // Proceed with export
      const data = db.exportData();
      
      setExportProgress(60);
      
      // Filter transactions by date range
      let filteredTransactions = includeDeleted ? data.transactions : data.transactions.filter(t => !t.deletedAt);
      
      if (dateRange === 'current') {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startOfMonth);
      } else if (dateRange === 'year') {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= startOfYear);
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        filteredTransactions = filteredTransactions.filter(t => {
          const date = new Date(t.date);
          return date >= start && date <= end;
        });
      }
      
      setExportProgress(80);
      
      const exportData = {
        ...data,
        transactions: filteredTransactions,
        categories: data.categories,
        budgets: data.budgets,
        accounts: data.accounts,
        templates: data.templates
      };

      let filename = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}`;
      
      if (exportFormat === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'csv') {
        // Simple CSV export for transactions
        const csvHeaders = 'Date,Description,Category,Amount,Type,Account,Tags';
        const csvRows = exportData.transactions.map(t => 
          `"${t.date}","${t.description}","${t.category}","${t.amount}","${t.type}","${t.account || ''}","${t.tags?.join(';') || ''}"`
        ).join('\n');
        const csvContent = csvHeaders + '\n' + csvRows;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      setExportProgress(100);
      
      toast.success('Data exported successfully!');
      
      // Broadcast export completion
      syncImportExport('export', 'completed', { format: exportFormat, timestamp: Date.now() });
      
      // Reset progress after a short delay
      setTimeout(() => setExportProgress(0), 1000);
      
    } catch (error) {
      const errorObj: ValidationError = {
        field: 'export',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'EXPORT_FAILED'
      };
      
      settingsErrorValidator.logError('export', errorObj, { 
        exportFormat,
        dateRange,
        includeDeleted
      });
      
      toast.error('Export failed. Please try again.');
      setExportProgress(0);
      
    } finally {
      setIsValidatingExport(false);
    }
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv';
    
    input.onchange = async (e) => {
      setIsValidatingImport(true);
      setImportProgress(0);
      setImportErrors([]);
      setImportWarnings([]);
      
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        setIsValidatingImport(false);
        return;
      }

      try {
        setImportProgress(10);
        const text = await file.text();
        
        setImportProgress(20);
        
        // Validate import data using our validator
        const validation = settingsErrorValidator.validateImportData(file, text);
        
        setImportProgress(30);
        
        setImportErrors(validation.errors);
        setImportWarnings(validation.warnings);

        if (!validation.isValid) {
          // Log errors
          validation.errors.forEach(error => {
            settingsErrorValidator.logError('import', error, { 
              fileName: file.name,
              fileSize: file.size
            });
          });
          
          // Show error toast
          toast.error('Import validation failed', {
            description: validation.errors[0]?.message || 'Invalid file format'
          });
          setIsValidatingImport(false);
          setImportProgress(0);
          return;
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => {
            toast.warning(warning.message);
            settingsErrorValidator.logError('import', warning, { 
              fileName: file.name,
              fileSize: file.size
            });
          });
        }

        setImportProgress(40);

        let data;

        if (file.name.endsWith('.csv')) {
          // Validate CSV structure
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            toast.error('CSV file must have at least a header and one data row.');
            setImportProgress(0);
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const requiredHeaders = ['date', 'description', 'amount'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          
          if (missingHeaders.length > 0) {
            toast.error(`CSV missing required headers: ${missingHeaders.join(', ')}`);
            setImportProgress(0);
            return;
          }
          
          setImportProgress(50);
          
          data = {
            transactions: lines.slice(1).map((line, index) => {
              const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
              
              // Validate required fields
              if (!values[0] || !values[1] || !values[3]) {
                throw new Error(`Row ${index + 2}: Missing required fields`);
              }
              
              const amount = parseFloat(values[3]);
              if (isNaN(amount)) {
                throw new Error(`Row ${index + 2}: Invalid amount format`);
              }
              
              const type = values[4]?.toLowerCase();
              if (type && !['income', 'expense'].includes(type)) {
                throw new Error(`Row ${index + 2}: Type must be 'income' or 'expense'`);
              }
              
              return {
                date: values[0],
                description: values[1],
                category: values[2] || 'Uncategorized',
                amount: amount,
                type: (type as 'income' | 'expense') || 'expense' as 'income' | 'expense',
                account: values[5] || undefined,
                tags: values[6] ? values[6].split(';').filter(Boolean) : [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              } as ImportTransaction;
            })
          };
        } else {
          // Validate JSON structure
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            toast.error('Invalid JSON format.');
            setImportProgress(0);
            return;
          }
          
          // Validate data structure
          if (!data || typeof data !== 'object') {
            toast.error('Invalid data structure.');
            setImportProgress(0);
            return;
          }
        }

        setImportProgress(60);

        let importCount = 0;
        let errorCount = 0;
        const totalTransactions = data.transactions?.length || 0;

        // Import data with validation
        if (data.transactions && Array.isArray(data.transactions)) {
          data.transactions.forEach((transaction: ImportTransaction, index: number) => {
            try {
              // Validate transaction structure
              if (!transaction.date || !transaction.description || typeof transaction.amount !== 'number') {
                throw new Error(`Transaction ${index + 1}: Missing required fields`);
              }
              
              db.addTransaction(transaction);
              importCount++;
              
              // Update progress based on completion
              if (index % Math.max(1, Math.floor(totalTransactions / 10)) === 0) {
                setImportProgress(60 + Math.floor((importCount / totalTransactions) * 30));
              }
            } catch (error) {
              errorCount++;
            }
          });
        }

        setImportProgress(90);

        if (errorCount > 0) {
          toast.warning(`Import completed with ${errorCount} errors. ${importCount} transactions imported successfully.`);
          syncImportExport('import', 'completed-with-errors', { 
            importCount, 
            errorCount, 
            fileName: file.name,
            timestamp: Date.now() 
          });
        } else {
          toast.success(`Successfully imported ${importCount} transactions!`);
          syncImportExport('import', 'completed', { 
            importCount, 
            fileName: file.name,
            timestamp: Date.now() 
          });
        }
        
        setImportProgress(100);
        
        // Reset progress after a short delay
        setTimeout(() => setImportProgress(0), 1000);
        
      } catch (error) {
        const errorObj: ValidationError = {
          field: 'import',
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          code: 'IMPORT_FAILED'
        };
        
        settingsErrorValidator.logError('import', errorObj, { 
          fileName: file.name,
          fileSize: file.size
        });
        
        toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setImportProgress(0);
      } finally {
        setIsValidatingImport(false);
      }
    };
    input.click();
  };

  
  const handleClearCache = useCallback(() => {
    setShowClearCacheDialog(true);
  }, []);

  const confirmClearCache = useCallback(() => {
    try {
      // Clear application cache but preserve data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('cache') || key.includes('temp')) {
          localStorage.removeItem(key);
        }
      });
      syncData('cache-cleared', { timestamp: Date.now(), clearedKeys: keys.length });
      toast.success('Cache cleared successfully!');
      setShowClearCacheDialog(false);
    } catch (error) {
      toast.error('Failed to clear cache');
    }
  }, []);

  const handleResetOnboarding = useCallback(() => {
    setShowResetOnboardingDialog(true);
  }, []);

  const confirmResetOnboarding = useCallback(() => {
    resetOnboarding();
    toast.success('Onboarding has been reset. You can start the tour again from the dashboard!');
    setShowResetOnboardingDialog(false);
  }, []);

  const handleResetDefaults = useCallback(() => {
    setShowResetDefaultsDialog(true);
  }, []);

  const confirmResetDefaults = useCallback(() => {
    setCurrency('USD' as Currency);
    setDateFormat('MM/DD/YYYY' as DateFormat);
    setNumberFormat('1,234.56' as NumberFormat);
    toast.success('Settings reset to defaults');
    setShowResetDefaultsDialog(false);
  }, []);

  const handleExportAllSettings = useCallback(() => {
    const settings = {
      currency,
      dateFormat,
      numberFormat,
      exportFormat,
      includeDeleted,
      dateRange,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  }, [currency, dateFormat, numberFormat, exportFormat, includeDeleted, dateRange]);

  const handleImportSettings = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.currency) setCurrency(settings.currency as Currency);
        if (settings.dateFormat) setDateFormat(settings.dateFormat as DateFormat);
        if (settings.numberFormat) setNumberFormat(settings.numberFormat as NumberFormat);
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Failed to import settings: Invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    setIsValidatingCurrency(true);
    
    try {
      // Validate currency settings
      const validation = settingsErrorValidator.validateCurrencySettings(
        newCurrency, 
        dateFormat, 
        numberFormat
      );
      
      setCurrencyErrors(validation.errors);
      setCurrencyWarnings(validation.warnings);
      setCurrencyInfo(validation.info);

      if (!validation.isValid) {
        // Log errors
        validation.errors.forEach(error => {
          settingsErrorValidator.logError('currency', error, { 
            attemptedCurrency: newCurrency,
            dateFormat,
            numberFormat
          });
        });
        
        // Show error toast
        toast.error('Currency validation failed', {
          description: validation.errors[0]?.message || 'Invalid currency selection'
        });
        return;
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => {
          toast.warning(warning.message);
          settingsErrorValidator.logError('currency', warning, { 
            attemptedCurrency: newCurrency,
            dateFormat,
            numberFormat
          });
        });
      }

      // Show info if any
      if (validation.info.length > 0) {
        validation.info.forEach(info => {
          toast.info(info.message);
        });
      }

      // Proceed with currency change if valid
      setCurrency(newCurrency as Currency);
      
      // Broadcast currency change to other tabs
      syncCurrency(newCurrency, dateFormat, numberFormat);
      
      toast.success('Currency updated successfully');
      
    } catch (error) {
      const errorObj: ValidationError = {
        field: 'currency',
        message: `Unexpected error changing currency: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'CURRENCY_CHANGE_ERROR'
      };
      
      settingsErrorValidator.logError('currency', errorObj, { attemptedCurrency: newCurrency });
      toast.error('Failed to change currency');
      
    } finally {
      setIsValidatingCurrency(false);
    }
  };

  const handleDateFormatChange = async (newDateFormat: string) => {
    setIsValidatingDateFormat(true);
    
    try {
      const validation = settingsErrorValidator.validateCurrencySettings(
        currency, 
        newDateFormat, 
        numberFormat
      );
      
      setCurrencyErrors(validation.errors);
      setCurrencyWarnings(validation.warnings);
      setCurrencyInfo(validation.info);

      if (!validation.isValid) {
        validation.errors.forEach(error => {
          settingsErrorValidator.logError('currency', error, { 
            currency,
            attemptedDateFormat: newDateFormat,
            numberFormat
          });
        });
        
        toast.error('Date format validation failed', {
          description: validation.errors[0]?.message || 'Invalid date format'
        });
        return;
      }

      setDateFormat(newDateFormat as DateFormat);
      
      // Broadcast date format change to other tabs
      syncCurrency(currency, newDateFormat, numberFormat);
      
      toast.success('Date format updated successfully');
      
    } catch (error) {
      const errorObj: ValidationError = {
        field: 'dateFormat',
        message: `Unexpected error changing date format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'DATE_FORMAT_CHANGE_ERROR'
      };
      
      settingsErrorValidator.logError('currency', errorObj, { attemptedDateFormat: newDateFormat });
      toast.error('Failed to change date format');
      
    } finally {
      setIsValidatingDateFormat(false);
    }
  };

  const handleNumberFormatChange = async (newNumberFormat: string) => {
    setIsValidatingNumberFormat(true);
    
    try {
      const validation = settingsErrorValidator.validateCurrencySettings(
        currency, 
        dateFormat, 
        newNumberFormat
      );
      
      setCurrencyErrors(validation.errors);
      setCurrencyWarnings(validation.warnings);
      setCurrencyInfo(validation.info);

      if (!validation.isValid) {
        validation.errors.forEach(error => {
          settingsErrorValidator.logError('currency', error, { 
            currency,
            dateFormat,
            attemptedNumberFormat: newNumberFormat
          });
        });
        
        toast.error('Number format validation failed', {
          description: validation.errors[0]?.message || 'Invalid number format'
        });
        return;
      }

      setNumberFormat(newNumberFormat as NumberFormat);
      
      // Broadcast number format change to other tabs
      syncCurrency(currency, dateFormat, newNumberFormat);
      
      toast.success('Number format updated successfully');
      
    } catch (error) {
      const errorObj: ValidationError = {
        field: 'numberFormat',
        message: `Unexpected error changing number format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'NUMBER_FORMAT_CHANGE_ERROR'
      };
      
      settingsErrorValidator.logError('currency', errorObj, { attemptedNumberFormat: newNumberFormat });
      toast.error('Failed to change number format');
      
    } finally {
      setIsValidatingNumberFormat(false);
    }
  };

  const getCurrencyDisplayName = useMemo(() => (curr: string): string => {
    return curr === 'USD' ? 'US Dollar' :
           curr === 'EUR' ? 'Euro' :
           curr === 'GBP' ? 'British Pound' :
           curr === 'JPY' ? 'Japanese Yen' :
           curr === 'CAD' ? 'Canadian Dollar' :
           curr === 'AUD' ? 'Australian Dollar' :
           // East Africa
           curr === 'KES' ? 'Kenyan Shilling' :
           curr === 'UGX' ? 'Ugandan Shilling' :
           curr === 'TZS' ? 'Tanzanian Shilling' :
           curr === 'ETB' ? 'Ethiopian Birr' :
           // South Africa
           curr === 'ZAR' ? 'South African Rand' :
           curr === 'NAD' ? 'Namibian Dollar' :
           curr === 'BWP' ? 'Botswana Pula' :
           // West Africa
           curr === 'NGN' ? 'Nigerian Naira' :
           curr === 'GHS' ? 'Ghanaian Cedi' :
           curr === 'XOF' ? 'West African CFA Franc' :
           curr === 'XAF' ? 'Central African CFA Franc' : curr;
  }, []);

  const getStatusColor = useMemo(() => (status: AppStatus): string => {
    switch (status) {
      case 'available':
      case 'connected':
      case 'loaded':
      case 'active':
        return 'bg-success';
      case 'limited':
        return 'bg-warning';
      case 'unavailable':
      case 'error':
        return 'bg-destructive';
      case 'checking':
        return 'bg-primary';
      default:
        return 'bg-muted';
    }
  }, []);

  const getStatusText = useMemo(() => (status: AppStatus): string => {
    switch (status) {
      case 'available': return 'Available';
      case 'connected': return 'Connected';
      case 'loaded': return 'Loaded';
      case 'active': return 'Active';
      case 'limited': return 'Limited Space';
      case 'unavailable': return 'Unavailable';
      case 'error': return 'Error';
      case 'checking': return 'Checking...';
      default: return 'Unknown';
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application settings and preferences
          </p>
        </div>
        <FavoriteButton size="sm" variant="outline" showLabel={false} />
      </div>

      {isInitialLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
      <div className="space-y-6">
        {/* Onboarding Progress */}
        <OnboardingProgress />
        
        {/* Financial Calculator */}
        <FinancialCalculator />
        
        {/* Error Analysis Dashboard */}
        <ErrorAnalysisDashboard />
        
        {/* Data Refresh Manager */}
        <DataRefreshManager />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Theme Settings */}
        <ThemeSettings />

        {/* Currency & Formatting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Currency & Formatting
            </CardTitle>
            <CardDescription>
              Configure how currency, dates, and numbers are displayed throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Currency Validation Alerts */}
            {currencyErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {currencyErrors.map((error, index) => (
                    <div key={index}>{error.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {currencyWarnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {currencyWarnings.map((warning, index) => (
                    <div key={index}>{warning.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {currencyInfo.length > 0 && (
              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {currencyInfo.map((info, index) => (
                    <div key={index}>{info.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  {isValidatingCurrency && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Select value={currency} onValueChange={handleCurrencyChange} disabled={isValidatingCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCurrencies.map((curr) => (
                      <SelectItem key={curr} value={curr}>
                        {curr} - {getCurrencyDisplayName(curr)} ({getCurrencySymbol(curr)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  {isValidatingDateFormat && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Select value={dateFormat} onValueChange={handleDateFormatChange} disabled={isValidatingDateFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDateFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="numberFormat">Number Format</Label>
                  {isValidatingNumberFormat && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Select value={numberFormat} onValueChange={handleNumberFormatChange} disabled={isValidatingNumberFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNumberFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={handleResetDefaults} variant="outline" className="w-full">
                Reset to Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Import/Export
            </CardTitle>
            <CardDescription>
              Backup your data or import transactions from external files
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Import Validation Alerts */}
            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importErrors.map((error, index) => (
                    <div key={index}>{error.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {importWarnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {importWarnings.map((warning, index) => (
                    <div key={index}>{warning.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Export Validation Alerts */}
            {exportErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {exportErrors.map((error, index) => (
                    <div key={index}>{error.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {exportWarnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {exportWarnings.map((warning, index) => (
                    <div key={index}>{warning.message}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (Full Data)</SelectItem>
                    <SelectItem value="csv">CSV (Transactions Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="current">Current Month</SelectItem>
                    <SelectItem value="year">Current Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDeleted"
                checked={includeDeleted}
                onCheckedChange={(checked: boolean | 'indeterminate') => setIncludeDeleted(checked === true)}
              />
              <Label htmlFor="includeDeleted">Include deleted items</Label>
            </div>

            {/* Export Progress Bar */}
            {exportProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Export Progress</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}

            {/* Import Progress Bar */}
            {importProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Import Progress</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleExportData} className="w-full" disabled={isValidatingExport}>
                {isValidatingExport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
              <Button onClick={handleImportData} variant="outline" className="w-full" disabled={isValidatingImport}>
                {isValidatingImport ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Data Management
            </CardTitle>
            <CardDescription>
              Verify data integrity, seed sample data, or clear application cache
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleVerifyData} className="w-full" disabled={isVerifyingData}>
              {isVerifyingData ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Data Integrity'
              )}
            </Button>
            <Button onClick={handleSeedData} variant="outline" className="w-full">
              Seed Sample Data
            </Button>
            <Button onClick={handleClearCache} variant="outline" className="w-full">
              Clear Cache
            </Button>
            <Button onClick={handleResetOnboarding} variant="outline" className="w-full">
              Reset Onboarding
            </Button>
            <div className="pt-4 border-t space-y-2">
              <Label>Settings Management</Label>
              <Button onClick={handleExportAllSettings} variant="outline" className="w-full">
                Export All Settings
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                  id="import-settings"
                />
                <Label htmlFor="import-settings" className="cursor-pointer">
                  <Button variant="outline" className="w-full" asChild>
                    <span>Import Settings</span>
                  </Button>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              Application Status
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>
            Monitor the health and availability of application services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.localStorage)}`}></div>
              <div>
                <div className="font-medium">Local Storage</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.localStorage)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.database)}`}></div>
              <div>
                <div className="font-medium">Database</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.database)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.storage)}`}></div>
              <div>
                <div className="font-medium">Storage Space</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.storage)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.fonts)}`}></div>
              <div>
                <div className="font-medium">Font System</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.fonts)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.components)}`}></div>
              <div>
                <div className="font-medium">UI Components</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.components)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.recycleBin)}`}></div>
              <div>
                <div className="font-medium">Recycle Bin</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.recycleBin)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(appStatus.themeSystem)}`}></div>
              <div>
                <div className="font-medium">Theme System</div>
                <div className="text-sm text-muted-foreground">{getStatusText(appStatus.themeSystem)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog open={showSeedDataDialog} onOpenChange={setShowSeedDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Sample Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add sample transactions, categories, and accounts to your application. 
              If you already have data, this may create duplicates. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSeedData}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearCacheDialog} onOpenChange={setShowClearCacheDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Application Cache?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove temporary files and cached data from localStorage. 
              Your financial records will be preserved. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearCache}>Clear Cache</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetOnboardingDialog} onOpenChange={setShowResetOnboardingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Onboarding?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the onboarding progress, allowing you to see the tour again. 
              Your settings and data will not be affected. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetOnboarding}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showResetDefaultsDialog} onOpenChange={setShowResetDefaultsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Defaults?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your currency, date format, and number format to their default values:
              <br /><br />
              Currency: USD<br />
              Date Format: MM/DD/YYYY<br />
              Number Format: 1,234.56
              <br /><br />
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResetDefaults}>Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      )}
    </div>
  );
}
