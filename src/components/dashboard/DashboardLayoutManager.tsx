'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { InteractiveDashboardWidget } from './InteractiveDashboardWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  LayoutList, 
  Plus, 
  RotateCcw, 
  Save,
  Download,
  Upload,
  Settings
} from 'lucide-react';

interface WidgetConfig {
  id: string;
  title: string;
  component?: ReactNode;
  defaultPosition: { x: number; y: number };
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  isResizable?: boolean;
  isDraggable?: boolean;
  isCollapsible?: boolean;
}

interface DashboardLayout {
  widgets: WidgetConfig[];
  layout: 'grid' | 'freeform';
  gridSize: number;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'stats-cards',
    title: 'Financial Overview',
    component: null, // Will be populated by actual components
    defaultPosition: { x: 0, y: 0 },
    defaultSize: { width: 800, height: 200 },
    minSize: { width: 400, height: 150 }
  },
  {
    id: 'spending-chart',
    title: 'Spending Analysis',
    component: null,
    defaultPosition: { x: 0, y: 220 },
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 }
  },
  {
    id: 'trend-chart',
    title: 'Monthly Trends',
    component: null,
    defaultPosition: { x: 420, y: 220 },
    defaultSize: { width: 380, height: 300 },
    minSize: { width: 300, height: 200 }
  },
  {
    id: 'recent-transactions',
    title: 'Recent Transactions',
    component: null,
    defaultPosition: { x: 820, y: 220 },
    defaultSize: { width: 400, height: 300 },
    minSize: { width: 300, height: 200 }
  }
];

export function DashboardLayoutManager({ 
  widgets = DEFAULT_WIDGETS,
  onLayoutChange 
}: { 
  widgets?: WidgetConfig[];
  onLayoutChange?: (layout: DashboardLayout) => void;
}) {
  const [layout, setLayout] = useState<'grid' | 'freeform'>('grid');
  const [activeWidgets, setActiveWidgets] = useState<string[]>(widgets.map(w => w.id));
  const [gridSize, setGridSize] = useState(30);
  const [isEditMode, setIsEditMode] = useState(false);

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashboard-layout');
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout);
        setLayout(parsed.layout || 'grid');
        setActiveWidgets(parsed.activeWidgets || widgets.map(w => w.id));
        setGridSize(parsed.gridSize || 20);
      } catch (error) {
        console.warn('Failed to load dashboard layout:', error);
      }
    }
  }, [widgets]);

  // Save layout to localStorage
  const saveLayout = useCallback(() => {
    try {
      // Check if widgets contain React components (which would cause circular references)
      const hasReactComponents = widgets.some(w => 
        w.component && (typeof w.component === 'function' || typeof w.component === 'object')
      );
      
      if (hasReactComponents) {
        console.warn('Cannot save layout: widgets contain React components that would cause circular references');
        return;
      }
      
      // Create safe widget data without React components
      const safeWidgets = widgets.map(w => ({
        id: w.id,
        title: w.title,
        defaultPosition: w.defaultPosition,
        defaultSize: w.defaultSize,
        minSize: w.minSize,
        maxSize: w.maxSize,
        isResizable: w.isResizable,
        isDraggable: w.isDraggable,
        isCollapsible: w.isCollapsible
      }));
      
      const layoutData = {
        layout,
        activeWidgets,
        gridSize,
        widgets: safeWidgets
      };
      
      localStorage.setItem('dashboard-layout', JSON.stringify(layoutData));
      onLayoutChange?.(layoutData);
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  }, [layout, activeWidgets, gridSize, widgets, onLayoutChange]);

  // Auto-save layout when it changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveLayout();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [layout, activeWidgets, gridSize, saveLayout]);

  const toggleWidget = useCallback((widgetId: string) => {
    setActiveWidgets(prev => 
      prev.includes(widgetId) 
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  }, []);

  const resetLayout = useCallback(() => {
    setLayout('grid');
    setActiveWidgets(widgets.map(w => w.id));
    setGridSize(30);
    localStorage.removeItem('dashboard-layout');
  }, [widgets]);

  const exportLayout = useCallback(() => {
    const layoutData = {
      layout,
      activeWidgets,
      gridSize,
      widgets: widgets.map(w => ({
        id: w.id,
        title: w.title,
        defaultPosition: w.defaultPosition,
        defaultSize: w.defaultSize
      }))
    };
    
    const blob = new Blob([JSON.stringify(layoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [layout, activeWidgets, gridSize, widgets]);

  const importLayout = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const importedData = JSON.parse(text);
        
        if (importedData.layout) setLayout(importedData.layout);
        if (importedData.activeWidgets) setActiveWidgets(importedData.activeWidgets);
        if (importedData.gridSize) setGridSize(importedData.gridSize);
        
        // Save imported layout
        localStorage.setItem('dashboard-layout', JSON.stringify(importedData));
      } catch (error) {
        console.error('Failed to import layout:', error);
      }
    };
    
    input.click();
  }, []);

  const renderWidget = useCallback((widget: WidgetConfig) => {
    if (!activeWidgets.includes(widget.id)) return null;

    if (layout === 'grid') {
      return (
        <div 
          key={widget.id}
          className={cn(
            'p-4',
            'transition-all duration-300 ease-out',
            'hover:shadow-md'
          )}
          style={{
            gridColumn: 'span 1',
            gridRow: 'span 1'
          }}
        >
          <Card className="h-full rounded-lg">
            <CardContent className="p-4 h-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{widget.title}</h3>
                {isEditMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleWidget(widget.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3 rotate-45" />
                  </Button>
                )}
              </div>
              {widget.component}
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <InteractiveDashboardWidget
        key={widget.id}
        id={widget.id}
        title={widget.title}
        defaultPosition={widget.defaultPosition}
        defaultSize={widget.defaultSize}
        minSize={widget.minSize}
        maxSize={widget.maxSize}
        isResizable={widget.isResizable}
        isDraggable={widget.isDraggable}
        isCollapsible={widget.isCollapsible}
        onClose={() => toggleWidget(widget.id)}
      >
        {widget.component}
      </InteractiveDashboardWidget>
    );
  }, [layout, activeWidgets, isEditMode, toggleWidget]);

  const gridStyle = layout === 'grid' ? {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${gridSize * 20}px, 1fr))`,
    gridAutoRows: 'minmax(min-content, max-content)',
    gap: '1rem',
    padding: '1rem'
  } : {
    position: 'relative' as const,
    width: '100%',
    height: 'calc(100vh - 200px)',
    overflow: 'hidden'
  };

  return (
    <div className="dashboard-layout-manager">
      {/* Control Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Dashboard Layout</h2>
          
          {/* Layout Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={layout === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('grid')}
              className="rounded-r-none hover:bg-primary/10"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === 'freeform' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('freeform')}
              className="rounded-l-none hover:bg-primary/10"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>

          {/* Grid Size Control */}
          {layout === 'grid' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Grid Size:</span>
              <input
                type="range"
                min="15"
                max="30"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">{gridSize}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="hover:bg-primary/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit'}
          </Button>

          {/* Layout Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            title="Reset to default layout"
            className="hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={saveLayout}
            title="Save current layout"
            className="hover:bg-primary/10"
          >
            <Save className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportLayout}
            title="Export layout"
            className="hover:bg-primary/10"
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={importLayout}
            title="Import layout"
            className="hover:bg-primary/10"
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div style={gridStyle} className="dashboard-content">
        {activeWidgets.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <Card className="p-8 text-center max-w-md rounded-lg">
              <CardContent className="space-y-4">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold">No Widgets Active</h3>
                <p className="text-sm text-muted-foreground">
                  Your dashboard is empty. Add widgets to customize your view.
                </p>
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="w-full"
                >
                  Add Widgets
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          widgets.map(renderWidget)
        )}
      </div>

      {/* Widget Selector (Edit Mode) */}
      {isEditMode && (
        <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-y-auto z-50 rounded-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Available Widgets</h3>
            <div className="space-y-2">
              {widgets.map(widget => (
                <div
                  key={widget.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-md border cursor-pointer',
                    'hover:bg-muted/50 hover:border-primary/30 transition-all duration-200',
                    activeWidgets.includes(widget.id) && 'bg-muted/30 border-primary/20'
                  )}
                  onClick={() => toggleWidget(widget.id)}
                >
                  <span className="text-sm">{widget.title}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    {activeWidgets.includes(widget.id) ? (
                      <Plus className="h-3 w-3 rotate-45" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
