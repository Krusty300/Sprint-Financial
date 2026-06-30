'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface QuickAddContextType {
  isOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  toggleQuickAdd: () => void;
}

const QuickAddContext = createContext<QuickAddContextType | undefined>(undefined);

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (context === undefined) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}

interface QuickAddProviderProps {
  children: ReactNode;
}

export function QuickAddProvider({ children }: QuickAddProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openQuickAdd = () => setIsOpen(true);
  const closeQuickAdd = () => setIsOpen(false);
  const toggleQuickAdd = () => setIsOpen(prev => !prev);

  return (
    <QuickAddContext.Provider value={{
      isOpen,
      openQuickAdd,
      closeQuickAdd,
      toggleQuickAdd
    }}>
      {children}
    </QuickAddContext.Provider>
  );
}
