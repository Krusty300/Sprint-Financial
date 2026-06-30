'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetConfig, WidgetPosition, WidgetSize, LayoutMode, GridLayout } from './WidgetConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Maximize2, Minimize2, LayoutGrid, Grid3x3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedGridLayoutProps {
  widgets: WidgetConfig[];
  onLayoutChange?: (layout: GridLayout) => void;
  defaultMode?: LayoutMode;
  columns?: number;
  gap?: number;
}

export function AdvancedGridLayout({
  widgets,
  onLayoutChange,
  defaultMode = 'bento',
  columns = 12,
  gap = 4,
}: AdvancedGridLayoutProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(defaultMode);
  const [widgetLayouts, setWidgetLayouts] = useState<Map<string, { position: WidgetPosition; size: WidgetSize }>>(
    new Map(
      widgets.map(widget => [
        widget.id,
        {
          position: widget.defaultPosition,
          size: widget.defaultSize,
        },
      ])
    )
  );
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [resizingWidget, setResizingWidget] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const widgetStartPosition = useRef<WidgetPosition | null>(null);
  const widgetStartSize = useRef<WidgetSize | null>(null);

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-advanced-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setLayoutMode(parsed.mode || defaultMode);
        
        const newLayouts = new Map<string, { position: WidgetPosition; size: WidgetSize }>();
        parsed.widgets?.forEach((savedWidget: any) => {
          const widget = widgets.find(w => w.id === savedWidget.id);
          if (widget) {
            newLayouts.set(savedWidget.id, {
              position: savedWidget.position,
              size: savedWidget.size,
            });
          }
        });
        
        if (newLayouts.size > 0) {
          setWidgetLayouts(newLayouts);
        }
      } catch (error) {
        console.warn('Failed to load saved layout:', error);
      }
    }
  }, [widgets, defaultMode]);

  // Save layout to localStorage
  useEffect(() => {
    const layout: GridLayout = {
      widgets: Array.from(widgetLayouts.entries()).map(([id, layout]) => ({
        id,
        position: layout.position,
        size: layout.size,
      })),
      mode: layoutMode,
      columns,
      gap,
    };
    localStorage.setItem('dashboard-advanced-layout', JSON.stringify(layout));
    onLayoutChange?.(layout);
  }, [widgetLayouts, layoutMode, columns, gap, onLayoutChange]);

  // Auto-arrange widgets
  const autoArrange = useCallback(() => {
    const newLayouts = new Map<string, { position: WidgetPosition; size: WidgetSize }>();
    let currentX = 0;
    let currentY = 0;
    let maxYInRow = 0;

    widgets.forEach((widget, index) => {
      const widgetLayout = widgetLayouts.get(widget.id) || {
        position: widget.defaultPosition,
        size: widget.defaultSize,
      };

      // Check if widget fits in current row
      if (currentX + widgetLayout.size.width > columns) {
        currentX = 0;
        currentY += maxYInRow;
        maxYInRow = 0;
      }

      newLayouts.set(widget.id, {
        position: { x: currentX, y: currentY },
        size: widgetLayout.size,
      });

      currentX += widgetLayout.size.width;
      maxYInRow = Math.max(maxYInRow, widgetLayout.size.height);
    });

    setWidgetLayouts(newLayouts);
  }, [widgets, widgetLayouts, columns]);

  // Handle drag start
  const handleDragStart = useCallback((widgetId: string, e: React.MouseEvent) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !widget.isDraggable) return;

    setDraggedWidget(widgetId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    widgetStartPosition.current = widgetLayouts.get(widgetId)?.position || widget.defaultPosition;
  }, [widgets, widgetLayouts]);

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!draggedWidget || !dragStartPos.current || !widgetStartPosition.current) return;

    const deltaX = Math.round((e.clientX - dragStartPos.current.x) / 50);
    const deltaY = Math.round((e.clientY - dragStartPos.current.y) / 50);

    const currentLayout = widgetLayouts.get(draggedWidget);
    if (!currentLayout) return;

    const widget = widgets.find(w => w.id === draggedWidget);
    if (!widget) return;

    const newPosition: WidgetPosition = {
      x: Math.max(0, widgetStartPosition.current.x + deltaX),
      y: Math.max(0, widgetStartPosition.current.y + deltaY),
    };

    // Check bounds
    const maxX = columns - currentLayout.size.width;
    newPosition.x = Math.min(newPosition.x, maxX);

    setWidgetLayouts(prev => {
      const newLayouts = new Map(prev);
      newLayouts.set(draggedWidget, {
        ...currentLayout,
        position: newPosition,
      });
      return newLayouts;
    });
  }, [draggedWidget, widgetLayouts, widgets, columns]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedWidget(null);
    dragStartPos.current = null;
    widgetStartPosition.current = null;
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((widgetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget || !widget.isResizable) return;

    setResizingWidget(widgetId);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    const currentLayout = widgetLayouts.get(widgetId);
    widgetStartSize.current = currentLayout?.size || widget.defaultSize as WidgetSize;
  }, [widgets, widgetLayouts]);

  // Handle resize move
  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizingWidget || !dragStartPos.current || !widgetStartSize.current) return;

    const deltaX = Math.round((e.clientX - dragStartPos.current.x) / 50);
    const deltaY = Math.round((e.clientY - dragStartPos.current.y) / 50);

    const currentLayout = widgetLayouts.get(resizingWidget);
    if (!currentLayout) return;

    const widget = widgets.find(w => w.id === resizingWidget);
    if (!widget) return;

    const currentSize = widgetStartSize.current;
    const newSize: WidgetSize = {
      width: Math.max(
        widget.minSize?.width || 2,
        Math.min(widget.maxSize?.width || 6, currentSize.width + deltaX)
      ),
      height: Math.max(
        widget.minSize?.height || 2,
        Math.min(widget.maxSize?.height || 4, currentSize.height + deltaY)
      ),
      minWidth: widget.minSize?.width,
      maxWidth: widget.maxSize?.width,
      minHeight: widget.minSize?.height,
      maxHeight: widget.maxSize?.height,
    };

    // Check bounds
    const currentPos = currentLayout.position;
    if (currentPos.x + newSize.width > columns) {
      newSize.width = columns - currentPos.x;
    }

    setWidgetLayouts(prev => {
      const newLayouts = new Map(prev);
      newLayouts.set(resizingWidget, {
        ...currentLayout,
        size: newSize,
      });
      return newLayouts;
    });
  }, [resizingWidget, widgetLayouts, widgets, columns]);

  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setResizingWidget(null);
    dragStartPos.current = null;
    widgetStartSize.current = null;
  }, []);

  // Global mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedWidget) {
        handleDragMove(e as any);
      } else if (resizingWidget) {
        handleResizeMove(e as any);
      }
    };

    const handleMouseUp = () => {
      if (draggedWidget) {
        handleDragEnd();
      } else if (resizingWidget) {
        handleResizeEnd();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedWidget, resizingWidget, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  // Calculate grid styles
  const getGridStyle = () => {
    switch (layoutMode) {
      case 'masonry':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: 'minmax(120px, auto)',
          gap: `${gap * 0.5}rem`,
        };
      case 'bento':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: 'minmax(140px, auto)',
          gap: `${gap * 0.5}rem`,
        };
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: 'minmax(120px, auto)',
          gap: `${gap * 0.5}rem`,
        };
      case 'auto':
        return {
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: `${gap * 0.5}rem`,
        };
      default:
        return {};
    }
  };

  const getWidgetStyle = (widgetId: string) => {
    const layout = widgetLayouts.get(widgetId);
    if (!layout || layoutMode === 'auto') return {};

    return {
      gridColumn: `span ${layout.size.width}`,
      gridRow: `span ${layout.size.height}`,
    };
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Layout Mode:</span>
          <div className="flex gap-1">
            <Button
              variant={layoutMode === 'bento' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayoutMode('bento')}
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              Bento
            </Button>
            <Button
              variant={layoutMode === 'masonry' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayoutMode('masonry')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Masonry
            </Button>
            <Button
              variant={layoutMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayoutMode('grid')}
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={layoutMode === 'auto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLayoutMode('auto')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Auto
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={autoArrange}>
          <LayoutGrid className="h-4 w-4 mr-1" />
          Auto-Arrange
        </Button>
      </div>

      {/* Grid */}
      <div style={getGridStyle()} className="w-full">
        {widgets.map(widget => {
          const layout = widgetLayouts.get(widget.id);
          const widgetStyle = getWidgetStyle(widget.id);
          const isDragging = draggedWidget === widget.id;
          const isResizing = resizingWidget === widget.id;

          return (
            <div
              key={widget.id}
              style={widgetStyle}
              className={cn(
                'relative transition-all duration-200',
                isDragging && 'opacity-50 scale-95 z-50',
                isResizing && 'z-50'
              )}
            >
              <Card
                className={cn(
                  'h-full transition-shadow hover:shadow-lg rounded-lg',
                  widget.isDraggable && 'cursor-move'
                )}
                onMouseDown={(e) => handleDragStart(widget.id, e)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2">
                    {widget.isDraggable && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                    <CardTitle className="text-sm">{widget.title}</CardTitle>
                  </div>
                  {widget.isResizable && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const currentLayout = widgetLayouts.get(widget.id);
                          if (!currentLayout) return;
                          const newSize = {
                            width: Math.max(
                              widget.minSize?.width || 2,
                              currentLayout.size.width - 1
                            ),
                            height: Math.max(
                              widget.minSize?.height || 2,
                              currentLayout.size.height - 1
                            ),
                          };
                          setWidgetLayouts(prev => {
                            const newLayouts = new Map(prev);
                            newLayouts.set(widget.id, {
                              ...currentLayout,
                              size: newSize,
                            });
                            return newLayouts;
                          });
                        }}
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const currentLayout = widgetLayouts.get(widget.id);
                          if (!currentLayout) return;
                          const newSize = {
                            width: Math.min(
                              widget.maxSize?.width || 6,
                              currentLayout.size.width + 1
                            ),
                            height: Math.min(
                              widget.maxSize?.height || 4,
                              currentLayout.size.height + 1
                            ),
                          };
                          setWidgetLayouts(prev => {
                            const newLayouts = new Map(prev);
                            newLayouts.set(widget.id, {
                              ...currentLayout,
                              size: newSize,
                            });
                            return newLayouts;
                          });
                        }}
                      >
                        <Maximize2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pt-2 px-4 pb-4">
                  {widget.component}
                </CardContent>
              </Card>

              {/* Resize Handle */}
              {widget.isResizable && (
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-primary/20 hover:bg-primary/40 rounded-tl"
                  onMouseDown={(e) => handleResizeStart(widget.id, e)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
