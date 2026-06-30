'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
  itemDetails?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  itemName,
  itemDetails,
}: DeleteConfirmDialogProps) {
  console.log('DeleteConfirmDialog rendered with open:', open, 'title:', title);
  
  const handleConfirm = () => {
    console.log('DeleteConfirmDialog handleConfirm called');
    try {
      onConfirm();
      // Close dialog after successful confirmation
      onOpenChange(false);
    } catch (error) {
      console.error('Error in delete confirmation:', error);
      // Don't close dialog on error
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    console.log('DeleteConfirmDialog onOpenChange called with:', newOpen);
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="delete-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription id="delete-dialog-description">
            {description}
            {itemName && (
              <span className="block mt-2 font-medium text-foreground">
                "{itemName}"
              </span>
            )}
            {itemDetails && (
              <span className="block mt-1 text-sm text-muted-foreground">
                {itemDetails}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
