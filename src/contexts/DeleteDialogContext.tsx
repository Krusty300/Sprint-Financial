'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DeleteDialogState {
  isOpen: boolean;
  mode: 'individual' | 'bulk';
  title: string;
  description: string;
  itemName?: string;
  itemDetails?: string;
  onConfirm: () => void;
}

interface DeleteDialogContextType {
  dialog: DeleteDialogState | null;
  openIndividualDelete: (config: Omit<DeleteDialogState, 'mode' | 'isOpen'>) => void;
  openBulkDelete: (config: Omit<DeleteDialogState, 'mode' | 'isOpen'>) => void;
  closeDeleteDialog: () => void;
}

const DeleteDialogContext = createContext<DeleteDialogContextType | undefined>(undefined);

export function useDeleteDialog() {
  const context = useContext(DeleteDialogContext);
  if (context === undefined) {
    throw new Error('useDeleteDialog must be used within a DeleteDialogProvider');
  }
  return context;
}

interface DeleteDialogProviderProps {
  children: ReactNode;
}

export function DeleteDialogProvider({ children }: DeleteDialogProviderProps) {
  const [dialog, setDialog] = useState<DeleteDialogState | null>(null);

  const openIndividualDelete = (config: Omit<DeleteDialogState, 'mode' | 'isOpen'>) => {
    setDialog({
      ...config,
      mode: 'individual',
      isOpen: true,
    });
  };

  const openBulkDelete = (config: Omit<DeleteDialogState, 'mode' | 'isOpen'>) => {
    setDialog({
      ...config,
      mode: 'bulk',
      isOpen: true,
    });
  };

  const closeDeleteDialog = () => {
    setDialog(null);
  };

  return (
    <DeleteDialogContext.Provider value={{
      dialog,
      openIndividualDelete,
      openBulkDelete,
      closeDeleteDialog
    }}>
      {children}
    </DeleteDialogContext.Provider>
  );
}
