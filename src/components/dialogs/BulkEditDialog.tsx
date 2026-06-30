'use client';

import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Edit2, DollarSign, Calendar, Tag, FileText, Building } from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  transactions: any[];
  categories: any[];
  accounts: any[];
  onUpdate: (updates: { ids: string[]; changes: any }) => void;
}

interface EditableField {
  field: string;
  label: string;
  icon: React.ReactNode;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'tags';
  options?: any[];
}

export function BulkEditDialog({
  open,
  onOpenChange,
  selectedIds,
  transactions,
  categories,
  accounts,
  onUpdate
}: BulkEditDialogProps) {
  const { formatCurrency } = useCurrency();
  const [selectedField, setSelectedField] = useState<EditableField | null>(null);
  const [activeFields, setActiveFields] = useState<Record<string, boolean>>({});
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedTransactions = transactions.filter(t => selectedIds.includes(t.id));

  const editableFields: EditableField[] = [
    {
      field: 'description',
      label: 'Description',
      icon: <FileText className="h-4 w-4" />,
      type: 'text'
    },
    {
      field: 'amount',
      label: 'Amount',
      icon: <DollarSign className="h-4 w-4" />,
      type: 'number'
    },
    {
      field: 'type',
      label: 'Type',
      icon: <Tag className="h-4 w-4" />,
      type: 'select',
      options: [
        { value: 'income', label: 'Income' },
        { value: 'expense', label: 'Expense' }
      ]
    },
    {
      field: 'category',
      label: 'Category',
      icon: <Building className="h-4 w-4" />,
      type: 'select',
      options: categories.map(cat => ({ value: cat.id, label: cat.name }))
    },
    {
      field: 'account',
      label: 'Account',
      icon: <Building className="h-4 w-4" />,
      type: 'select',
      options: accounts.map(acc => ({ value: acc.id, label: acc.name }))
    },
    {
      field: 'date',
      label: 'Date',
      icon: <Calendar className="h-4 w-4" />,
      type: 'date'
    },
    {
      field: 'tags',
      label: 'Tags',
      icon: <Tag className="h-4 w-4" />,
      type: 'tags'
    }
  ];

  // Get current values for preview
  const getCurrentValue = (field: string) => {
    const values = selectedTransactions.map(t => t[field]);
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 1) {
      return uniqueValues[0];
    }
    return null; // Multiple different values
  };

  // Get field statistics
  const getFieldStats = (field: string) => {
    const values = selectedTransactions.map(t => t[field] || '');
    const uniqueValues = [...new Set(values)];
    
    return {
      total: selectedTransactions.length,
      unique: uniqueValues.length,
      mostCommon: uniqueValues.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      , uniqueValues[0])
    };
  };

  const handleFieldToggle = (field: string, enabled: boolean) => {
    setActiveFields(prev => ({ ...prev, [field]: enabled }));
    
    if (enabled) {
      // Pre-fill with current value if all transactions have the same value
      const currentValue = getCurrentValue(field);
      if (currentValue !== null) {
        setEditValues(prev => ({ ...prev, [field]: currentValue }));
      }
    } else {
      // Clear the value when disabled
      setEditValues(prev => {
        const newValues = { ...prev };
        delete newValues[field];
        return newValues;
      });
    }
  };

  const handleValueChange = (field: string, value: any) => {
    setEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (field: string, value: string) => {
    // Convert comma-separated string to array
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setEditValues(prev => ({ ...prev, [field]: tags }));
  };

  const handleUpdate = async () => {
    const enabledFields = Object.keys(activeFields).filter(field => activeFields[field]);
    
    if (enabledFields.length === 0) {
      toast.error('Please select at least one field to edit');
      return;
    }

    // Validate required fields
    for (const field of enabledFields) {
      const value = editValues[field];
      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        const fieldInfo = editableFields.find(f => f.field === field);
        toast.error(`Please provide a value for ${fieldInfo?.label}`);
        return;
      }
    }

    setIsUpdating(true);
    try {
      const changes: any = {};
      enabledFields.forEach(field => {
        changes[field] = editValues[field];
      });

      await onUpdate({
        ids: selectedIds,
        changes
      });

      toast.success(`Updated ${enabledFields.length} field${enabledFields.length > 1 ? 's' : ''} for ${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''}`);
      onOpenChange(false);
      
      // Reset state
      setActiveFields({});
      setEditValues({});
    } catch (error) {
      console.error('Failed to update transactions:', error);
      toast.error('Failed to update transactions');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderFieldInput = (field: EditableField) => {
    const currentValue = getCurrentValue(field.field);
    const stats = getFieldStats(field.field);
    const value = editValues[field.field] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleValueChange(field.field, e.target.value)}
            placeholder={currentValue ? `Current: ${currentValue}` : 'Enter new value'}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleValueChange(field.field, parseFloat(e.target.value) || 0)}
            placeholder={currentValue ? `Current: ${currentValue}` : 'Enter amount'}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleValueChange(field.field, val)}>
            <SelectTrigger>
              <SelectValue placeholder={currentValue ? `Current: ${currentValue}` : 'Select value'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleValueChange(field.field, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Input
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(field.field, e.target.value)}
            placeholder={currentValue ? `Current: ${currentValue}` : 'Enter description'}
          />
        );

      case 'tags':
        return (
          <div className="space-y-2">
            <Input
              value={Array.isArray(value) ? value.join(', ') : value}
              onChange={(e) => handleTagsChange(field.field, e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            {Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {value.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto" aria-describedby="bulk-edit-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Bulk Edit Transactions
          </DialogTitle>
          <DialogDescription id="bulk-edit-dialog-description">
            Edit {selectedIds.length} selected transaction{selectedIds.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Selected Transactions Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Selected Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''} selected
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px]">{transaction.description}</span>
                      <Badge variant="outline" className="text-xs">
                        {transaction.type}
                      </Badge>
                    </div>
                    <span className="font-medium">${transaction.amount.toFixed(2)}</span>
                  </div>
                ))}
                {selectedTransactions.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center">
                    ... and {selectedTransactions.length - 5} more
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Fields to Edit</h3>
            {editableFields.map((field) => {
              const stats = getFieldStats(field.field);
              const isEnabled = activeFields[field.field];
              
              return (
                <Card key={field.field} className={`border-2 ${isEnabled ? 'border-primary' : 'border-muted'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {field.icon}
                        <Label className="text-sm font-medium">{field.label}</Label>
                      </div>
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldToggle(field.field, e.target.checked)}
                        className="h-4 w-4"
                      />
                    </div>
                    
                    {isEnabled ? (
                      <div className="space-y-2">
                        {renderFieldInput(field)}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {stats.unique === 1 ? (
                          <span>Current: {stats.mostCommon}</span>
                        ) : (
                          <span>{stats.unique} different values</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating || Object.keys(activeFields).filter(f => activeFields[f]).length === 0}
          >
            {isUpdating ? 'Updating...' : `Update ${selectedIds.length} Transaction${selectedIds.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
