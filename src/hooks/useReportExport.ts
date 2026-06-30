import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { ReportExporter, ExportOptions } from '@/lib/exportUtils';
import { DashboardStats } from '@/lib/types';
import { validateExportData, ValidationResult } from '@/lib/reportValidation';

export interface UseReportExportOptions {
  onSuccess?: (format: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UseReportExportReturn {
  isExporting: boolean;
  exportProgress: number;
  exportReport: (stats: DashboardStats | null, format: 'pdf' | 'excel' | 'csv' | 'json', options?: Partial<ExportOptions>) => Promise<void>;
  quickExport: (stats: DashboardStats | null, format: 'pdf' | 'excel' | 'csv' | 'json') => Promise<void>;
  resetExportState: () => void;
}

/**
 * Custom hook for handling report export operations
 * Provides export functionality with progress tracking and error handling
 */
export function useReportExport(options: UseReportExportOptions = {}): UseReportExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const { onSuccess, onError, onProgress } = options;

  const updateProgress = useCallback((progress: number) => {
    setExportProgress(progress);
    onProgress?.(progress);
  }, [onProgress]);

  const resetExportState = useCallback(() => {
    setIsExporting(false);
    setExportProgress(0);
  }, []);

  const exportReport = useCallback(async (
    stats: DashboardStats | null,
    format: 'pdf' | 'excel' | 'csv' | 'json',
    exportOptions?: Partial<ExportOptions>
  ): Promise<void> => {
    // Validate data before export
    const validation = validateExportData(stats, null);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid data for export');
      return;
    }

    // Type guard: after validation, stats is guaranteed to be non-null
    if (!stats) {
      toast.error('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      updateProgress(20);

      const options: ExportOptions = {
        format,
        includeCharts: exportOptions?.includeCharts ?? true,
        sections: exportOptions?.sections ?? ['summary', 'categories', 'trends'],
      };

      updateProgress(50);
      console.log('Exporting report with options:', options);
      await ReportExporter.exportReport(stats, options);
      updateProgress(100);

      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      onSuccess?.(format);

      setTimeout(() => {
        resetExportState();
      }, 500);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to export report as ${format.toUpperCase()}: ${errorMessage}`);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      resetExportState();
    }
  }, [onSuccess, onError, updateProgress, resetExportState]);

  const quickExport = useCallback(async (
    stats: DashboardStats | null,
    format: 'pdf' | 'excel' | 'csv' | 'json'
  ): Promise<void> => {
    await exportReport(stats, format, {
      includeCharts: true,
      sections: ['summary', 'categories', 'trends']
    });
  }, [exportReport]);

  return {
    isExporting,
    exportProgress,
    exportReport,
    quickExport,
    resetExportState
  };
}
