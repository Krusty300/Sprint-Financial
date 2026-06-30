'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  X, 
  Edit2, 
  Calendar,
  DollarSign,
  Tag,
  Folder
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/lib/types';

interface InlineTransactionEditProps {
  transaction: Transaction;
  categories: Array<{ id: string; name: string; type: 'income' | 'expense' }>;
  accounts: Array<{ id: string; name: string }>;
  onSave: (updatedTransaction: Partial<Transaction>) => void;
  onCancel: () => void;
}

export function InlineTransactionEdit({
  transaction,
  categories,
  accounts,
  onSave,
  onCancel
}: InlineTransactionEditProps) {
  const [editedTransaction, setEditedTransaction] = useState<Partial<Transaction>>({
    description: transaction.description,
    amount: transaction.amount,
    category: transaction.category,
    account: transaction.account,
    date: transaction.date,
    type: transaction.type,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on description input when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = useCallback(() => {
    onSave(editedTransaction);
  }, [editedTransaction, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [handleSave, onCancel]);

  const filteredCategories = categories.filter(
    cat => cat.type === editedTransaction.type
  );

  return (
    <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
      <div className="grid grid-cols-2 gap-2">
        {/* Description */}
        <div className="col-span-2">
          <label className="text-xs font-medium mb-1 block">Description</label>
          <Input
            ref={inputRef}
            value={editedTransaction.description}
            onChange={(e) => setEditedTransaction(prev => ({ ...prev, description: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Description"
            className="h-8 text-sm"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-medium mb-1 block">Amount</label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              type="number"
              step="0.01"
              value={editedTransaction.amount}
              onChange={(e) => setEditedTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              className="h-8 text-sm pl-7"
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="text-xs font-medium mb-1 block">Type</label>
          <Select
            value={editedTransaction.type}
            onValueChange={(value) => setEditedTransaction(prev => ({ ...prev, type: value as 'income' | 'expense' }))}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium mb-1 block">Category</label>
          <Select
            value={editedTransaction.category}
            onValueChange={(value) => setEditedTransaction(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account */}
        <div>
          <label className="text-xs font-medium mb-1 block">Account</label>
          <Select
            value={editedTransaction.account}
            onValueChange={(value) => setEditedTransaction(prev => ({ ...prev, account: value }))}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-medium mb-1 block">Date</label>
          <Input
            type="date"
            value={editedTransaction.date}
            onChange={(e) => setEditedTransaction(prev => ({ ...prev, date: e.target.value }))}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave} className="flex-1">
          <Save className="h-3 w-3 mr-1" />
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} className="flex-1">
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>

      {/* Keyboard Hints */}
      <div className="text-xs text-muted-foreground text-center">
        Press <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> to save, <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> to cancel
      </div>
    </div>
  );
}
