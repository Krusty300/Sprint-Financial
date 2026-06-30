export interface WidgetLayout {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: WidgetLayout[];
  layoutMode: 'default' | 'interactive' | 'advanced';
  lastModified: string;
}

class WidgetPersistenceService {
  private static instance: WidgetPersistenceService;
  private readonly STORAGE_KEY = 'dashboard-widget-layout';

  private constructor() {}

  static getInstance(): WidgetPersistenceService {
    if (!WidgetPersistenceService.instance) {
      WidgetPersistenceService.instance = new WidgetPersistenceService();
    }
    return WidgetPersistenceService.instance;
  }

  saveLayout(layout: DashboardLayout): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save widget layout:', error);
    }
  }

  loadLayout(): DashboardLayout | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load widget layout:', error);
    }
    return null;
  }

  updateWidget(widgetId: string, updates: Partial<WidgetLayout>): void {
    const layout = this.loadLayout();
    if (!layout) return;

    const widgetIndex = layout.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return;

    layout.widgets[widgetIndex] = {
      ...layout.widgets[widgetIndex],
      ...updates
    };
    layout.lastModified = new Date().toISOString();
    this.saveLayout(layout);
  }

  saveWidgetVisibility(widgetId: string, visible: boolean): void {
    this.updateWidget(widgetId, { visible });
  }

  saveWidgetPosition(widgetId: string, position: { x: number; y: number }): void {
    this.updateWidget(widgetId, { position });
  }

  saveWidgetSize(widgetId: string, size: { width: number; height: number }): void {
    this.updateWidget(widgetId, { size });
  }

  saveWidgetOrder(widgetId: string, order: number): void {
    this.updateWidget(widgetId, { order });
  }

  saveLayoutMode(mode: 'default' | 'interactive' | 'advanced'): void {
    const layout = this.loadLayout();
    if (!layout) {
      this.saveLayout({
        widgets: [],
        layoutMode: mode,
        lastModified: new Date().toISOString()
      });
      return;
    }

    layout.layoutMode = mode;
    layout.lastModified = new Date().toISOString();
    this.saveLayout(layout);
  }

  resetLayout(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset widget layout:', error);
    }
  }

  exportLayout(): string {
    const layout = this.loadLayout();
    return JSON.stringify(layout, null, 2);
  }

  importLayout(layoutJson: string): boolean {
    try {
      const layout = JSON.parse(layoutJson) as DashboardLayout;
      this.saveLayout(layout);
      return true;
    } catch (error) {
      console.error('Failed to import widget layout:', error);
      return false;
    }
  }
}

export const widgetPersistenceService = WidgetPersistenceService.getInstance();
