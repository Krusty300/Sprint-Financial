'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  key: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  {
    key: 'Ctrl + K',
    description: 'Quick Search - Find anything instantly'
  },
  {
    key: 'Ctrl + Q',
    description: 'Quick Add - Add transactions fast'
  },
  {
    key: 'Ctrl + N',
    description: 'New Transaction - Create detailed entry'
  },
  {
    key: 'Ctrl + F',
    description: 'Focus Search - Jump to search bar'
  },
  {
    key: 'Delete',
    description: 'Bulk Delete - Remove selected items'
  },
  {
    key: '↑ ↓',
    description: 'Navigate - Move through search results'
  },
  {
    key: 'Enter',
    description: 'Select - Choose highlighted item'
  },
  {
    key: 'Escape',
    description: 'Close Dialog - Get back to work'
  }
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  const { resolvedTheme } = useTheme();

  const renderKeyCombo = (keys: string) => {
    return keys.split(' + ').map((key, index) => (
      <span key={index} className="inline-flex items-center">
        {index > 0 && <span className="mx-1 text-muted-foreground">+</span>}
        <kbd className={cn(
          "px-2 py-1 text-xs font-mono rounded border font-semibold",
          resolvedTheme === 'dark'
            ? "bg-background/80 border-border/50 text-foreground"
            : "bg-background border-border/40 text-muted-foreground"
        )}>
          {key}
        </kbd>
      </span>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  "transition-colors duration-200",
                  resolvedTheme === 'dark'
                    ? "bg-background/50 border-border/50 hover:bg-background/80"
                    : "bg-muted/30 border-border/30 hover:bg-muted/50"
                )}
              >
                <div className="text-sm font-medium">
                  {shortcut.description}
                </div>
                
                <div className="flex items-center">
                  {renderKeyCombo(shortcut.key)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border">
            <p className="text-xs text-muted-foreground">
              Pro tip: Use <kbd className="px-1 py-0.5 text-xs rounded border">Ctrl</kbd> on Windows/Linux or <kbd className="px-1 py-0.5 text-xs rounded border">Cmd</kbd> on Mac
            </p>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
