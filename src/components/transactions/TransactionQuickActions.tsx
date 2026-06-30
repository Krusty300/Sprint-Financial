'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  MoreVertical,
  Link,
  Receipt,
  MessageSquare,
  Download,
  Share
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
}

interface TransactionQuickActionsProps {
  actions: QuickAction[];
  position?: { x: number; y: number };
  onClose: () => void;
}

export function TransactionQuickActions({ 
  actions, 
  position, 
  onClose 
}: TransactionQuickActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const menuStyle = position 
    ? { 
        position: 'absolute' as const,
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateY(-100%)'
      }
    : {};

  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-background border rounded-lg shadow-lg py-1 min-w-[200px] z-50"
    >
      {actions.map((action, index) => (
        <div key={action.id}>
          {action.divider && (
            <div className="my-1 border-t" />
          )}
          <button
            onClick={() => {
              action.onClick();
              onClose();
            }}
            disabled={action.disabled}
            className={cn(
              "w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted transition-colors",
              action.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <action.icon className="h-4 w-4" />
            <span>{action.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook for managing quick actions menu
export function useTransactionQuickActions() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const openMenu = useCallback((transactionId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setSelectedTransactionId(transactionId);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setMenuOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuPosition(null);
    setSelectedTransactionId(null);
  }, []);

  return {
    menuOpen,
    menuPosition,
    selectedTransactionId,
    openMenu,
    closeMenu
  };
}
