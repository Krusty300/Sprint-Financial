'use client';

import { useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableTransactionRowProps {
  children: React.ReactNode;
  transactionId: string;
  index: number;
  onDragStart?: (transactionId: string, index: number) => void;
  onDragOver?: (transactionId: string, index: number) => void;
  onDrop?: (transactionId: string, index: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

export function DraggableTransactionRow({
  children,
  transactionId,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isDragOver = false
}: DraggableTransactionRowProps) {
  const [isDraggable, setIsDraggable] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('transactionId', transactionId);
    e.dataTransfer.setData('index', index.toString());
    onDragStart?.(transactionId, index);
  }, [transactionId, index, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(transactionId, index);
  }, [transactionId, index, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const draggedTransactionId = e.dataTransfer.getData('transactionId');
    const draggedIndex = parseInt(e.dataTransfer.getData('index'));
    onDrop?.(draggedTransactionId, index);
  }, [onDrop]);

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={cn(
        "relative group transition-all",
        isDragging && "opacity-50 scale-95",
        isDragOver && "border-l-4 border-primary bg-primary/5"
      )}
    >
      {/* Drag Handle */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 flex items-center">
        <button
          onMouseEnter={() => setIsDraggable(true)}
          onMouseLeave={() => setIsDraggable(false)}
          className={cn(
            "p-1 rounded cursor-grab active:cursor-grabbing transition-all",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            isDraggable && "text-foreground bg-muted"
          )}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
}

// Hook for managing drag and drop state
export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<{ id: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((id: string, index: number) => {
    setDraggedItem({ id, index });
  }, []);

  const handleDragOver = useCallback((id: string, index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((draggedId: string, dropIndex: number) => {
    if (draggedItem) {
      // Return the drag operation details
      const result = {
        draggedId: draggedItem.id,
        fromIndex: draggedItem.index,
        toIndex: dropIndex
      };
      
      setDraggedItem(null);
      setDragOverIndex(null);
      
      return result;
    }
    return null;
  }, [draggedItem]);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  return {
    draggedItem,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
}
