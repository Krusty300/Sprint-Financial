export interface WidgetSize {
  width: number; // Grid columns (1-12)
  height: number; // Grid rows
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

export interface WidgetPosition {
  x: number; // Grid column
  y: number; // Grid row
}

export interface WidgetConfig {
  id: string;
  title: string;
  component: React.ReactNode;
  defaultSize: WidgetSize;
  defaultPosition: WidgetPosition;
  minSize?: WidgetSize;
  maxSize?: WidgetSize;
  isResizable?: boolean;
  isDraggable?: boolean;
  category?: 'financial' | 'spending' | 'budget' | 'transactions' | 'analytics';
}

export type LayoutMode = 'masonry' | 'bento' | 'grid' | 'auto';

export interface GridLayout {
  widgets: Array<{
    id: string;
    position: WidgetPosition;
    size: WidgetSize;
  }>;
  mode: LayoutMode;
  columns: number;
  gap: number;
}
