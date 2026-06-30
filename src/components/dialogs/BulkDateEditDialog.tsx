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
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface BulkDateEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  transactions: any[];
  onUpdate: (updates: { ids: string[]; date: string; mode: 'set' | 'adjust' }) => void;
}

export function BulkDateEditDialog({
  open,
  onOpenChange,
  selectedIds,
  transactions,
  onUpdate
}: BulkDateEditDialogProps) {
  const [dateMode, setDateMode] = useState<'set' | 'adjust'>('set');
  const [newDate, setNewDate] = useState('');
  const [adjustDays, setAdjustDays] = useState('0');
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));
  const dateRange = {
    earliest: new Date(Math.min(...selectedTransactions.map(t => new Date(t.date).getTime()))),
    latest: new Date(Math.max(...selectedTransactions.map(t => new Date(t.date).getTime())))
  };

  const handleUpdate = async () => {
    let finalDate = '';

    if (dateMode === 'set') {
      if (!newDate) {
        toast.error('Please select a date');
        return;
      }
      finalDate = newDate;
    } else {
      const days = parseInt(adjustDays) || 0;
      if (days === 0) {
        toast.error('Please specify days to adjust');
        return;
      }
      
      // For adjust mode, we'll use the earliest date as base
      const baseDate = dateRange.earliest;
      baseDate.setDate(baseDate.getDate() + days);
      finalDate = baseDate.toISOString().split('T')[0];
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        ids: selectedIds,
        date: finalDate,
        mode: dateMode
      });
      
      const action = dateMode === 'set' ? 'set to' : `adjusted by ${adjustDays} days`;
      toast.success(`Updated dates for ${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''} (${action})`);
      onOpenChange(false);
      setNewDate('');
      setAdjustDays('0');
    } catch (error) {
      console.error('Failed to update dates:', error);
      toast.error('Failed to update dates');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="bulk-date-dialog-description">
        <DialogHeader>
          <DialogTitle>Bulk Date Editing</DialogTitle>
          <DialogDescription id="bulk-date-dialog-description">
            Modify dates for {selectedIds.length} selected transaction{selectedIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Current Date Range */}
          <div>
            <Label className="text-sm font-medium">Current Date Range</Label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {dateRange.earliest.toLocaleDateString()} - {dateRange.latest.toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Date Mode Selection */}
          <div>
            <Label className="text-sm font-medium">Update Mode</Label>
            <RadioGroup value={dateMode} onValueChange={(value: 'set' | 'adjust') => setDateMode(value)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set">Set specific date</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adjust" id="adjust" />
                <Label htmlFor="adjust">Adjust by days</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Input Based on Mode */}
          {dateMode === 'set' ? (
            <div>
              <Label htmlFor="newDate">New Date</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1"
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="adjustDays">Adjust Days</Label>
              <Input
                id="adjustDays"
                type="number"
                value={adjustDays}
                onChange={(e) => setAdjustDays(e.target.value)}
                placeholder="Enter number of days (positive or negative)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use positive numbers to move forward, negative to move back
              </p>
            </div>
          )}

          {/* Transaction Preview */}
          <div>
            <Label className="text-sm font-medium">Selected Transactions</Label>
            <div className="mt-1 max-h-32 overflow-y-auto space-y-1">
              {selectedTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="text-xs text-muted-foreground flex justify-between">
                  <span className="truncate max-w-[200px]">{transaction.description}</span>
                  <div className="flex items-center gap-2">
                    <span>${transaction.amount.toFixed(2)}</span>
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                  </div>
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
            disabled={isUpdating || (dateMode === 'set' ? !newDate : !adjustDays || adjustDays === '0')}
          >
            {isUpdating ? 'Updating...' : `Update ${selectedIds.length} Transaction${selectedIds.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
