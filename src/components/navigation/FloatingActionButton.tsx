'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuickAddModal } from '@/components/forms/QuickAddModal';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const { isOpen: isModalOpen, openQuickAdd, closeQuickAdd } = useQuickAdd();
  const { resolvedTheme } = useTheme();

  // Haptic feedback for mobile devices
  const handleHapticFeedback = () => {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      // Light vibration pattern for button press
      navigator.vibrate(10);
    }
  };

  const handleClick = () => {
    handleHapticFeedback();
    openQuickAdd();
  };

  // Theme-aware styles
  const themeStyles = resolvedTheme === 'dark' ? {
    glow: 'bg-primary/30 blur-xl',
    buttonBg: 'bg-gradient-to-br from-primary to-primary/70',
    buttonHover: 'hover:from-primary hover:to-primary/80',
    shadow: 'shadow-primary/30',
    shadowHover: 'shadow-primary/50',
    tooltip: 'bg-gray-800 text-white',
    overlay: 'before:from-white/10 before:to-transparent'
  } : {
    glow: 'bg-primary/20 blur-xl',
    buttonBg: 'bg-gradient-to-br from-primary to-primary/80',
    buttonHover: 'hover:from-primary hover:to-primary/90',
    shadow: 'shadow-primary/25',
    shadowHover: 'shadow-primary/40',
    tooltip: 'bg-gray-900 text-white',
    overlay: 'before:from-white/20 before:to-transparent'
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="group relative">
        {/* Enhanced Glow Effect */}
        <div className={cn(
          "absolute inset-0 rounded-full animate-pulse opacity-75",
          "group-hover:opacity-100 transition-all duration-300",
          themeStyles.glow
        )} />
        
        <Button
          onClick={handleClick}
          size="lg"
          className={cn(
            // Base positioning and size
            "fixed bottom-6 right-6 z-[60]",
            "h-14 w-14 rounded-full",
            "md:bottom-8 md:right-8 md:h-12 md:w-12",
            
            // Glassmorphism effect
            "backdrop-blur-md border border-white/10",
            
            // Theme-aware gradient background
            themeStyles.buttonBg,
            themeStyles.buttonHover,
            
            // Theme-aware enhanced shadows
            `shadow-lg ${themeStyles.shadow}`,
            `hover:shadow-2xl ${themeStyles.shadowHover}`,
            "active:shadow-lg",
            
            // Smooth transitions
            "transition-all duration-300 ease-out",
            
            // Scale effects
            "hover:scale-110 active:scale-95",
            
            // Interactive glass overlay
            "before:absolute before:inset-0 before:rounded-full",
            themeStyles.overlay,
            "before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
            
            "pointer-events-auto",
            className
          )}
          aria-label="Add transaction"
        >
          <Plus className={cn(
            "h-6 w-6 md:h-5 md:w-5",
            "text-primary-foreground",
            "transition-all duration-300 ease-out",
            "group-hover:rotate-90 group-hover:scale-110",
            // Theme-aware icon styling
            resolvedTheme === 'dark' && "drop-shadow-sm"
          )} />
        </Button>
        
        {/* Enhanced Tooltip */}
        <div className={cn(
          "absolute bottom-full right-0 mb-2",
          "px-3 py-2 text-sm rounded-lg",
          "opacity-0 group-hover:opacity-100",
          "transition-all duration-300 ease-out",
          "whitespace-nowrap pointer-events-none",
          "transform translate-y-1 group-hover:translate-y-0 scale-95 group-hover:scale-100",
          "backdrop-blur-sm border border-white/10",
          themeStyles.tooltip
        )}>
          <div className="flex items-center gap-2">
            <Plus className="h-3 w-3" />
            <span className="font-medium">Quick Add Transaction</span>
            <kbd className={cn(
              "px-1.5 py-0.5 text-xs rounded",
              resolvedTheme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
            )}>
              Ctrl+K
            </kbd>
          </div>
          {/* Tooltip arrow */}
          <div className={cn(
            "absolute top-full right-4 w-0 h-0",
            "border-l-4 border-r-4 border-t-4 border-transparent",
            resolvedTheme === 'dark' ? "border-t-gray-800" : "border-t-gray-900"
          )} />
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal 
        open={isModalOpen} 
        onOpenChange={(open) => open ? openQuickAdd() : closeQuickAdd()} 
      />
    </>
  );
}
