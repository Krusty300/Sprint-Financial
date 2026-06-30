import { useEffect, useCallback } from 'react';

export interface KeyboardShortcuts {
  onNewTransaction?: () => void;
  onSearchFocus?: () => void;
  onQuickAdd?: () => void;
  onToggleSearch?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input field
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Check for modifier keys
    const ctrlKey = event.ctrlKey || event.metaKey;
    const shiftKey = event.shiftKey;
    const altKey = event.altKey;

    // Ctrl+N or Cmd+N - New transaction
    if (ctrlKey && event.key === 'n' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onNewTransaction?.();
    }

    // Ctrl+F or Cmd+F - Focus search
    if (ctrlKey && event.key === 'f' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onSearchFocus?.();
    }

    // Ctrl+K or Cmd+K - Toggle search
    if (ctrlKey && event.key === 'k' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onToggleSearch?.();
    }

    // Ctrl+Q or Cmd+Q - Quick Add
    if (ctrlKey && event.key === 'q' && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onQuickAdd?.();
    }

    // Delete key - Bulk delete (when items are selected)
    if (event.key === 'Delete' && !ctrlKey && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onDelete?.();
    }

    // Escape - Close dialogs/clear selection
    if (event.key === 'Escape' && !ctrlKey && !shiftKey && !altKey) {
      event.preventDefault();
      shortcuts.onClose?.();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
