'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface BulkCategoryChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  transactions: any[];
  categories: any[];
  onUpdate: (updates: { ids: string[]; category: string }) => void;
}

export function BulkCategoryChangeDialog({
  open,
  onOpenChange,
  selectedIds,
  transactions,
  categories,
  onUpdate
}: BulkCategoryChangeDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));
  const currentCategories = [...new Set(selectedTransactions.map(t => t.category))];
  
  // Helper function to get category name by ID
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const handleUpdate = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        ids: selectedIds,
        category: selectedCategory
      });
      
      toast.success(`Updated category for ${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''}`);
      onOpenChange(false);
      setSelectedCategory('');
    } catch (error) {
      console.error('Failed to update categories:', error);
      toast.error('Failed to update categories');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="bulk-category-dialog-description">
        <DialogHeader>
          <DialogTitle>Bulk Category Change</DialogTitle>
          <DialogDescription id="bulk-category-dialog-description">
            Change category for {selectedIds.length} selected transaction{selectedIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Categories */}
          <div>
            <Label className="text-sm font-medium">Current Categories</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {currentCategories.map(category => (
                <Badge key={category} variant="outline" className="text-xs">
                  {getCategoryName(category)}
                </Badge>
              ))}
            </div>
          </div>

          {/* New Category Selection */}
          <div>
            <Label htmlFor="category">New Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select new category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Preview */}
          <div>
            <Label className="text-sm font-medium">Selected Transactions</Label>
            <div className="mt-1 max-h-32 overflow-y-auto space-y-1">
              {selectedTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="text-xs text-muted-foreground flex justify-between">
                  <span className="truncate max-w-[200px]">{transaction.description}</span>
                  <span>${transaction.amount.toFixed(2)}</span>
                </div>
              ))}
              {selectedTransactions.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  ... and {selectedTransactions.length - 5} more
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={!selectedCategory || isUpdating}
          >
            {isUpdating ? 'Updating...' : `Update ${selectedIds.length} Transaction${selectedIds.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
