'use client';

import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Calendar, 
  PiggyBank, 
  Calculator, 
  Wallet, 
  FileDown,
  ArrowRightLeft,
  Users,
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';

interface QuickAction {
  id: string;
  name: string;
  href: string;
  icon: any;
  shortcut?: string;
  template?: boolean;
  custom?: boolean;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-transaction',
    name: 'Add Transaction',
    href: '/transactions',
    icon: Plus,
    shortcut: 'Cmd+T',
  },
  {
    id: 'recent-transactions',
    name: 'Recent Transactions',
    href: '/transactions?filter=recent',
    icon: Calendar,
    shortcut: 'Cmd+R',
  },
  {
    id: 'create-budget',
    name: 'Create Budget',
    href: '/budgets',
    icon: PiggyBank,
    shortcut: 'Cmd+B',
  },
  {
    id: 'transfer',
    name: 'Transfer',
    href: '/transactions?mode=transfer',
    icon: ArrowRightLeft,
    shortcut: 'Cmd+Shift+T',
  },
  {
    id: 'split-bill',
    name: 'Split Bill',
    href: '/transactions?mode=split',
    icon: Users,
    shortcut: 'Cmd+Shift+S',
  },
  {
    id: 'generate-report',
    name: 'Generate Report',
    href: '/reports',
    icon: Calculator,
  },
  {
    id: 'manage-accounts',
    name: 'Manage Accounts',
    href: '/accounts',
    icon: Wallet,
  },
  {
    id: 'export-data',
    name: 'Export Data',
    href: '/transactions?export=true',
    icon: FileDown,
  },
];

interface QuickActionsProps {
  pathname: string;
  showIcons?: boolean;
}

export const QuickActions = memo(function QuickActions({ 
  pathname, 
  showIcons = true 
}: QuickActionsProps) {
  const { resolvedTheme } = useTheme();
  const [customActions, setCustomActions] = useState<QuickAction[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [visibleActions, setVisibleActions] = useState<QuickAction[]>(DEFAULT_QUICK_ACTIONS);

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Load custom actions and visibility from localStorage
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('quick_actions_custom');
      if (savedCustom) {
        setCustomActions(JSON.parse(savedCustom));
      }
      
      const savedVisibility = localStorage.getItem('quick_actions_visibility');
      if (savedVisibility) {
        const visibleIds = JSON.parse(savedVisibility);
        const allActions = [...DEFAULT_QUICK_ACTIONS, ...customActions];
        setVisibleActions(allActions.filter(action => visibleIds.includes(action.id)));
        console.log('Quick Actions: Loaded visibility from localStorage', visibleIds);
      }
    } catch (error) {
      console.error('Error loading quick actions:', error);
    }
  }, []); // Run only on mount

  // Update visible actions when customActions change
  useEffect(() => {
    const savedVisibility = localStorage.getItem('quick_actions_visibility');
    if (savedVisibility) {
      const visibleIds = JSON.parse(savedVisibility);
      const allActions = [...DEFAULT_QUICK_ACTIONS, ...customActions];
      setVisibleActions(allActions.filter(action => visibleIds.includes(action.id)));
    }
  }, [customActions]);

  // Save visibility to localStorage
  const saveVisibility = useCallback((actions: QuickAction[]) => {
    const visibleIds = actions.map(a => a.id);
    localStorage.setItem('quick_actions_visibility', JSON.stringify(visibleIds));
    console.log('Quick Actions: Saved visibility to localStorage', visibleIds);
  }, []);

  // Toggle action visibility
  const toggleAction = useCallback((actionId: string) => {
    console.log('Quick Actions: Toggling action', actionId);
    setVisibleActions(prev => {
      const allActions = [...DEFAULT_QUICK_ACTIONS, ...customActions];
      const action = allActions.find(a => a.id === actionId);
      
      if (prev.find(a => a.id === actionId)) {
        const newVisible = prev.filter(a => a.id !== actionId);
        saveVisibility(newVisible);
        console.log('Quick Actions: Hidden action', actionId);
        return newVisible;
      } else if (action) {
        const newVisible = [...prev, action];
        saveVisibility(newVisible);
        console.log('Quick Actions: Restored action', actionId);
        return newVisible;
      }
      
      return prev;
    });
  }, [customActions, saveVisibility]);

  // Reset to default
  const resetToDefault = useCallback(() => {
    console.log('Quick Actions: Resetting to default');
    setVisibleActions(DEFAULT_QUICK_ACTIONS);
    localStorage.removeItem('quick_actions_visibility');
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      const action = visibleActions.find(a => {
        if (!a.shortcut) return false;
        
        if (a.shortcut === 'Cmd+T' && e.key === 't' && !e.shiftKey) return true;
        if (a.shortcut === 'Cmd+R' && e.key === 'r' && !e.shiftKey) return true;
        if (a.shortcut === 'Cmd+B' && e.key === 'b' && !e.shiftKey) return true;
        if (a.shortcut === 'Cmd+Shift+T' && e.key === 't' && e.shiftKey) return true;
        if (a.shortcut === 'Cmd+Shift+S' && e.key === 's' && e.shiftKey) return true;
        
        return false;
      });

      if (action) {
        e.preventDefault();
        window.location.href = action.href;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleActions]);

  const allActions = [...DEFAULT_QUICK_ACTIONS, ...customActions];
  const hiddenActions = allActions.filter(action => !visibleActions.find(v => v.id === action.id));

  return (
    <div className={cn(
      "px-3 py-2",
      isCustomizing && "bg-primary/5 rounded-lg border border-primary/20"
    )}>
      <div className="flex items-center justify-between mb-2 px-4">
        <h2 className={cn(
          "text-lg font-semibold tracking-tight",
          resolvedTheme === 'dark' ? 'text-gray-50' : 'text-gray-900'
        )}>
          {isCustomizing ? 'Customize Actions' : 'Quick Actions'}
        </h2>
        <div className="flex items-center gap-1">
          {isCustomizing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={resetToDefault}
              title="Reset to default"
              aria-label="Reset quick actions to default"
            >
              <span className="text-xs font-medium">Reset</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0",
              isCustomizing && "bg-primary/10 text-primary"
            )}
            onClick={() => {
              console.log('Quick Actions: Toggling customization mode', !isCustomizing);
              setIsCustomizing(!isCustomizing);
            }}
            title={isCustomizing ? 'Done customizing' : 'Customize quick actions'}
            aria-label={isCustomizing ? 'Done customizing' : 'Customize quick actions'}
            aria-pressed={isCustomizing}
          >
            {isCustomizing ? <X className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {isCustomizing && (
        <div className="px-4 mb-2 text-xs text-muted-foreground">
          Click actions to hide them. Click hidden actions below to restore.
        </div>
      )}

      <div className="space-y-1">
        {visibleActions.map((action) => (
          <div key={action.id} className="relative group">
            <Button 
              className={cn(
                "w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:bg-primary/10 active:scale-[0.98]",
                !prefersReducedMotion && "hover:-translate-x-1",
                isCustomizing && "pr-10",
                "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "focus-visible:outline-none"
              )}
              variant={action.id === 'add-transaction' ? 'default' : 'outline'}
              onClick={(e) => {
                if (isCustomizing) {
                  e.preventDefault();
                  toggleAction(action.id);
                }
              }}
              aria-label={action.name}
              asChild={!isCustomizing}
            >
              {!isCustomizing ? (
                <Link href={action.href}>
                  {showIcons && <action.icon className={cn(
                    "mr-2 h-4 w-4 transition-transform duration-200",
                    !prefersReducedMotion && "group-hover:scale-110 group-hover:rotate-3"
                  )} />}
                  <span className="flex-1 text-left">{action.name}</span>
                  {action.shortcut && (
                    <span className="text-xs text-muted-foreground ml-2 opacity-60">
                      {action.shortcut.replace('Cmd', '⌘')}
                    </span>
                  )}
                </Link>
              ) : (
                <>
                  {showIcons && <action.icon className="mr-2 h-4 w-4" />}
                  <span className="flex-1 text-left">{action.name}</span>
                  {action.shortcut && (
                    <span className="text-xs text-muted-foreground ml-2 opacity-60">
                      {action.shortcut.replace('Cmd', '⌘')}
                    </span>
                  )}
                </>
              )}
            </Button>
            {isCustomizing && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleAction(action.id);
                }}
                title="Hide action"
                aria-label={`Hide ${action.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {isCustomizing && hiddenActions.length > 0 && (
          <>
            <div className="h-px bg-border my-2" />
            <div className="text-xs text-muted-foreground px-4 mb-2 flex items-center justify-between">
              <span>Hidden Actions</span>
              <span className="text-xs opacity-60">Click to restore</span>
            </div>
            {hiddenActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 hover:scale-[1.02] hover:bg-primary/10",
                  !prefersReducedMotion && "hover:translate-x-1",
                  "group",
                  "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  "focus-visible:outline-none"
                )}
                onClick={() => toggleAction(action.id)}
                aria-label={`Restore ${action.name}`}
              >
                {showIcons && <action.icon className={cn(
                  "mr-2 h-4 w-4 opacity-50 transition-transform duration-200",
                  !prefersReducedMotion && "group-hover:scale-110 group-hover:rotate-3"
                )} />}
                <span className="flex-1 text-left opacity-70 group-hover:opacity-100">{action.name}</span>
                <Plus className={cn(
                  "h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transition-transform duration-200",
                  !prefersReducedMotion && "group-hover:scale-110"
                )} />
              </Button>
            ))}
          </>
        )}
      </div>
    </div>
  );
});
