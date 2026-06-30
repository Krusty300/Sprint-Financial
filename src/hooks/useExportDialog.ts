import { useState, useCallback } from 'react';

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export interface UseExportDialogReturn {
  showExportDialog: boolean;
  showMobileExportMenu: boolean;
  exportFormat: ExportFormat;
  includeCharts: boolean;
  selectedSections: string[];
  openExportDialog: () => void;
  closeExportDialog: () => void;
  toggleMobileExportMenu: () => void;
  setExportFormat: (format: ExportFormat) => void;
  setIncludeCharts: (include: boolean) => void;
  setSelectedSections: (sections: string[]) => void;
  toggleSection: (section: string) => void;
  resetExportOptions: () => void;
}

/**
 * Custom hook for managing export dialog state
 * Handles dialog visibility, export options, and mobile menu state
 */
export function useExportDialog(): UseExportDialogReturn {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showMobileExportMenu, setShowMobileExportMenu] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [selectedSections, setSelectedSections] = useState<string[]>(['summary', 'categories', 'trends']);

  const openExportDialog = useCallback(() => {
    setShowExportDialog(true);
    setShowMobileExportMenu(false);
  }, []);

  const closeExportDialog = useCallback(() => {
    setShowExportDialog(false);
  }, []);

  const toggleMobileExportMenu = useCallback(() => {
    setShowMobileExportMenu(prev => !prev);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setSelectedSections(prev => {
      if (prev.includes(section)) {
        return prev.filter(s => s !== section);
      } else {
        return [...prev, section];
      }
    });
  }, []);

  const resetExportOptions = useCallback(() => {
    setExportFormat('pdf');
    setIncludeCharts(true);
    setSelectedSections(['summary', 'categories', 'trends']);
  }, []);

  return {
    showExportDialog,
    showMobileExportMenu,
    exportFormat,
    includeCharts,
    selectedSections,
    openExportDialog,
    closeExportDialog,
    toggleMobileExportMenu,
    setExportFormat,
    setIncludeCharts,
    setSelectedSections,
    toggleSection,
    resetExportOptions
  };
}
