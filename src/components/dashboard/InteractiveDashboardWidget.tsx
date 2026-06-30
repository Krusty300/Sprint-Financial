'use client';

import { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  X, 
  RotateCcw,
  Settings 
} from 'lucide-react';

interface WidgetPosition {
  x: number;
  y: number;
}

interface WidgetSize {
  width: number;
  height: number;
}

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: ReactNode;
  defaultPosition?: WidgetPosition;
  defaultSize?: WidgetSize;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  isResizable?: boolean;
  isDraggable?: boolean;
  isCollapsible?: boolean;
  className?: string;
  onResize?: (size: WidgetSize) => void;
  onMove?: (position: WidgetPosition) => void;
  onClose?: () => void;
  onReset?: () => void;
  showControls?: boolean;
}

export function InteractiveDashboardWidget({
  id,
  title,
  children,
  defaultPosition = { x: 0, y: 0 },
  defaultSize = { width: 400, height: 300 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 800, height: 600 },
  isResizable = true,
  isDraggable = true,
  isCollapsible = true,
  className,
  onResize,
  onMove,
  onClose,
  onReset,
  showControls = true
}: DashboardWidgetProps) {
  const [position, setPosition] = useState<WidgetPosition>(defaultPosition);
  const [size, setSize] = useState<WidgetSize>(defaultSize);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<WidgetPosition>({ x: 0, y: 0 });
  const startPos = useRef<WidgetPosition>({ x: 0, y: 0 });
  const startSize = useRef<WidgetSize>({ width: 0, height: 0 });

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(`widget-${id}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPosition(parsed.position || defaultPosition);
        setSize(parsed.size || defaultSize);
        setIsCollapsed(parsed.isCollapsed || false);
        setIsMaximized(parsed.isMaximized || false);
      } catch (error) {
        console.warn('Failed to load widget state:', error);
      }
    }
  }, [id, defaultPosition, defaultSize]);

  // Save state to localStorage
  const saveState = useCallback(() => {
    const state = {
      position,
      size,
      isCollapsed,
      isMaximized
    };
    localStorage.setItem(`widget-${id}`, JSON.stringify(state));
  }, [id, position, size, isCollapsed, isMaximized]);

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [saveState]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && isDraggable) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      const newPosition = {
        x: startPos.current.x + deltaX,
        y: startPos.current.y + deltaY
      };
      
      setPosition(newPosition);
      onMove?.(newPosition);
    }

    if (isResizing && isResizable) {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      let newSize = { ...startSize.current };
      
      if (resizeHandle?.includes('right')) {
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, startSize.current.width + deltaX));
      }
      if (resizeHandle?.includes('bottom')) {
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, startSize.current.height + deltaY));
      }
      if (resizeHandle?.includes('left')) {
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, startSize.current.width - deltaX));
        if (newSize.width !== startSize.current.width) {
          setPosition(prev => ({ ...prev, x: prev.x + deltaX }));
        }
      }
      if (resizeHandle?.includes('top')) {
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, startSize.current.height - deltaY));
        if (newSize.height !== startSize.current.height) {
          setPosition(prev => ({ ...prev, y: prev.y + deltaY }));
        }
      }
      
      setSize(newSize);
      onResize?.(newSize);
    }
  }, [isDragging, isResizing, isDraggable, isResizable, resizeHandle, minSize, maxSize, onMove, onResize]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Global mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (!isDraggable || isMaximized) return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startPos.current = position;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }, [isDraggable, isMaximized, position]);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    if (!isResizable || isMaximized) return;
    
    setIsResizing(true);
    setResizeHandle(handle);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = size;
    startPos.current = position;
    
    const cursorMap: Record<string, string> = {
      'top-left': 'nw-resize',
      'top-right': 'ne-resize',
      'bottom-left': 'sw-resize',
      'bottom-right': 'se-resize',
      'top': 'n-resize',
      'bottom': 's-resize',
      'left': 'w-resize',
      'right': 'e-resize'
    };
    
    document.body.style.cursor = cursorMap[handle] || 'default';
    e.preventDefault();
  }, [isResizable, isMaximized, size, position]);

  // Toggle collapse
  const toggleCollapse = useCallback(() => {
    if (!isCollapsible) return;
    setIsCollapsed(prev => !prev);
  }, [isCollapsible]);

  // Toggle maximize
  const toggleMaximize = useCallback(() => {
    if (isMaximized) {
      setSize(defaultSize);
      setPosition(defaultPosition);
    } else {
      setSize({ width: window.innerWidth - 100, height: window.innerHeight - 200 });
      setPosition({ x: 50, y: 100 });
    }
    setIsMaximized(prev => !prev);
  }, [isMaximized, defaultSize, defaultPosition]);

  // Reset widget
  const handleReset = useCallback(() => {
    setSize(defaultSize);
    setPosition(defaultPosition);
    setIsCollapsed(false);
    setIsMaximized(false);
    onReset?.();
  }, [defaultSize, defaultPosition, onReset]);

  const widgetStyle = {
    position: 'absolute' as const,
    left: isMaximized ? 50 : position.x,
    top: isMaximized ? 100 : position.y,
    width: isCollapsed ? 300 : (isMaximized ? window.innerWidth - 100 : size.width),
    height: isCollapsed ? 60 : (isMaximized ? window.innerHeight - 200 : size.height),
    zIndex: isDragging || isResizing ? 1000 : 1,
    transition: (isDragging || isResizing) ? 'none' : 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    transform: isCollapsed ? 'scale(0.95)' : 'scale(1)',
    opacity: isCollapsed ? 0.8 : 1
  };

  return (
    <div
      ref={widgetRef}
      className={cn(
        'dashboard-widget',
        'bg-background border rounded-lg shadow-lg',
        'transition-all duration-200 ease-out',
        (isDragging || isResizing) && 'shadow-2xl',
        isMaximized && 'fixed inset-4 !z-50',
        className
      )}
      style={widgetStyle}
    >
      {/* Header */}
      <CardHeader 
        className={cn(
          'flex items-center justify-between p-3 border-b cursor-move',
          'bg-muted/50 hover:bg-muted/80 transition-colors'
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm truncate">{title}</h3>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-1">
            {isCollapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapse}
                className="h-6 w-6 p-0"
              >
                {isCollapsed ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMaximize}
              className="h-6 w-6 p-0"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-6 w-6 p-0"
              title="Reset widget"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent 
        className={cn(
          'p-4 overflow-hidden',
          isCollapsed && 'p-0 h-0'
        )}
      >
        {!isCollapsed && children}
      </CardContent>

      {/* Resize Handles */}
      {isResizable && !isCollapsed && !isMaximized && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-2 h-2 cursor-nw-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            className="absolute top-0 right-0 w-2 h-2 cursor-ne-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute bottom-0 left-0 w-2 h-2 cursor-sw-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 w-2 h-2 cursor-se-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />
          
          {/* Edge handles */}
          <div
            className="absolute top-0 left-2 right-2 h-1 cursor-n-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute bottom-0 left-2 right-2 h-1 cursor-s-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute top-2 left-0 w-1 h-full cursor-w-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute top-2 right-0 w-1 h-full cursor-e-resize hover:bg-primary/20"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
}
