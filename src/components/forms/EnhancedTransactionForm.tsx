'use client';

import { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionSplit, TransactionAttachment, RecurringTransactionRule } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Upload, 
  FileText, 
  Image, 
  StickyNote, 
  Repeat, 
  Calculator,
  Layout,
  Camera,
  Loader2
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

// Utility function to get today's date string in local timezone
const getTodayDateString = (): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to midnight local time
  return today.toISOString().split('T')[0];
};

interface EnhancedTransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onSubmitRecurring?: (transaction: Omit<Transaction, 'id'>, recurringRule: RecurringTransactionRule) => void;
  onSubmitSplit?: (transaction: Omit<Transaction, 'id'>, splits: TransactionSplit[]) => void;
  initialData?: Partial<Transaction>;
  onCancel?: () => void;
  submitText?: string;
  className?: string;
}

export function EnhancedTransactionForm({
  onSubmit,
  onSubmitRecurring,
  onSubmitSplit,
  initialData,
  onCancel,
  submitText = 'Add Transaction',
  className
}: EnhancedTransactionFormProps) {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { templates, getQuickAddTemplates, getMostUsedTemplates, useTemplate } = useTransactionTemplates();

  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    account: '',
    tags: '',
    notes: ''
  });

  const [splits, setSplits] = useState<TransactionSplit[]>([]);
  const [attachments, setAttachments] = useState<TransactionAttachment[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [recurringRule, setRecurringRule] = useState<RecurringTransactionRule>({
    id: crypto.randomUUID(),
    frequency: 'monthly',
    interval: 1,
    nextDate: new Date().toISOString().split('T')[0],
  });

  const [newSplit, setNewSplit] = useState({
    category: '',
    amount: '',
    description: ''
  });

  // Sanitize input to prevent XSS attacks
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount?.toString() || '',
        type: initialData.type || 'expense',
        category: initialData.category || '',
        date: initialData.date || getTodayDateString(),
        description: initialData.description || '',
        account: initialData.account || '',
        tags: initialData.tags?.join(', ') || '',
        notes: initialData.notes || ''
      });
      
      if (initialData.splits) {
        setSplits(initialData.splits);
        setIsSplit(true);
      }
      
      if (initialData.isRecurring && initialData.recurringRule) {
        setRecurringRule(initialData.recurringRule);
        setIsRecurring(true);
      }
      
      if (initialData.attachments) {
        setAttachments(initialData.attachments);
      }
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || !formData.category || !formData.description || isNaN(amount)) {
      return;
    }

    if (!validateDate(formData.date)) {
      console.error('Invalid date provided');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build transaction object with consistent optional field handling
      const transactionData: Omit<Transaction, 'id'> = {
        amount: amount,
        type: formData.type,
        category: formData.category,
        date: formData.date,
        description: formData.description,
      };

      // Only add optional fields when they have meaningful values
      if (formData.account) {
        transactionData.account = formData.account;
      }

      if (formData.tags) {
        const tagArray = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tagArray.length > 0) {
          transactionData.tags = tagArray;
        }
      }

      if (formData.notes) {
        transactionData.notes = formData.notes;
      }

      if (isSplit && splits.length > 0) {
        transactionData.splits = splits;
      }

      if (attachments.length > 0) {
        transactionData.attachments = attachments;
      }

      if (isRecurring) {
        transactionData.isRecurring = true;
        transactionData.recurringRule = recurringRule;
      }

      if (isRecurring && onSubmitRecurring) {
        await onSubmitRecurring(transactionData, recurringRule);
      } else if (isSplit && onSubmitSplit && splits.length > 0) {
        await onSubmitSplit(transactionData, splits);
      } else {
        await onSubmit(transactionData);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSplit = () => {
    if (!newSplit.category || !newSplit.amount) return;
    
    const amount = parseFloat(newSplit.amount);
    if (isNaN(amount) || amount <= 0) return;
    
    const split: TransactionSplit = {
      category: newSplit.category,
      amount: amount,
      description: newSplit.description || undefined,
    };
    
    setSplits([...splits, split]);
    setNewSplit({ category: '', amount: '', description: '' });
  };

  const handleRemoveSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const readers: FileReader[] = [];
    const allowedTypes = {
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/webp': 'image',
      'application/pdf': 'document',
      'text/plain': 'document',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'application/vnd.ms-excel': 'document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document'
    };

    Array.from(files).forEach(file => {
      // Validate file size (max 5MB for security)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.error(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      // Validate file type
      const fileType = allowedTypes[file.type as keyof typeof allowedTypes];
      if (!fileType) {
        console.error(`File ${file.name} has unsupported type: ${file.type}`);
        return;
      }

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const reader = new FileReader();
      readers.push(reader);
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result || typeof result !== 'string') {
          console.error(`Failed to read file ${file.name}: Invalid result`);
          return;
        }
        
        const attachment: TransactionAttachment = {
          id: crypto.randomUUID(),
          name: sanitizedName,
          type: fileType as 'image' | 'document',
          data: result,
          size: file.size,
          createdAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, attachment]);
      };
      
      reader.onerror = () => {
        console.error(`Failed to read file ${file.name}`);
      };
      
      reader.readAsDataURL(file);
    });

    // Cleanup function to abort readers if component unmounts
    return () => {
      readers.forEach(reader => {
        if (reader.readyState === FileReader.LOADING) {
          reader.abort();
        }
      });
    };
  };

  const handleAddNote = () => {
    const note: TransactionAttachment = {
      id: crypto.randomUUID(),
      name: `Note ${attachments.length + 1}`,
      type: 'note',
      content: '',
      createdAt: new Date().toISOString(),
    };
    setAttachments([...attachments, note]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleUseTemplate = async (template: any) => {
    const transaction = await useTemplate(template);
    setFormData({
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description,
      account: transaction.account || '',
      tags: transaction.tags?.join(', ') || '',
      notes: ''
    });
    
    if (transaction.splits) {
      setSplits(transaction.splits);
      setIsSplit(true);
    }
    
    setShowTemplateDialog(false);
  };

  // Validate date to prevent invalid transaction dates
  const validateDate = (dateString: string): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) return false;
    
    // Set both dates to midnight for fair comparison
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const dateMidnight = new Date(date);
    dateMidnight.setHours(0, 0, 0, 0);
    
    // Check if date is not too far in the future (max 1 year)
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    oneYearFromNow.setHours(0, 0, 0, 0);
    if (dateMidnight > oneYearFromNow) return false;
    
    // Check if date is not too far in the past (min 10 years)
    const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate());
    tenYearsAgo.setHours(0, 0, 0, 0);
    if (dateMidnight < tenYearsAgo) return false;
    
    return true;
  };

  const totalSplitAmount = useMemo(() => 
    splits.reduce((sum, split) => sum + split.amount, 0), 
    [splits]
  );
  const mainAmount = parseFloat(formData.amount);
  const hasValidMainAmount = formData.amount && !isNaN(mainAmount) && mainAmount > 0;
  const isValidSplit = !isSplit || !hasValidMainAmount || totalSplitAmount === mainAmount;
  const isValidDate = validateDate(formData.date);

  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Transaction Type Toggle */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.type === 'income' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
            className="flex-1"
          >
            Income
          </Button>
          <Button
            type="button"
            variant={formData.type === 'expense' ? 'default' : 'outline'}
            onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
            className="flex-1"
          >
            Expense
          </Button>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({getCurrencySymbol(currency)}) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder={`0.00 ${getCurrencySymbol(currency)}`}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            {formData.amount && (
              <p className="text-xs text-muted-foreground">
                Preview: {formatCurrency(parseFloat(formData.amount) || 0)}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              max={getTodayDateString()}
            />
            {!isValidDate && formData.date && (
              <p className="text-xs text-destructive">
                Please enter a valid date (within the past 10 years and not more than 1 year in the future)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Input
            id="description"
            placeholder="What was this transaction for?"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: sanitizeInput(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <span>{category.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {accounts.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.name}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma-separated)</Label>
          <Input
            id="tags"
            placeholder="urgent, business, travel"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
        </div>

        {/* Advanced Features Tabs */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, notes: sanitizeInput(e.target.value) })}
              />
            </div>
          </TabsContent>

          <TabsContent value="split" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isSplit"
                checked={isSplit}
                onCheckedChange={(checked) => setIsSplit(checked as boolean)}
              />
              <Label htmlFor="isSplit">Split this transaction across multiple categories</Label>
            </div>

            {isSplit && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Transaction Splits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current splits */}
                  {splits.map((split, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="flex-1 text-sm">{split.category}</span>
                      <span className="text-sm font-medium">{formatCurrency(split.amount)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSplit(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Add new split */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Select value={newSplit.category} onValueChange={(value) => setNewSplit({ ...newSplit, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`0.00 ${getCurrencySymbol(currency)}`}
                      type="number"
                      step="0.01"
                      value={newSplit.amount}
                      onChange={(e) => setNewSplit({ ...newSplit, amount: e.target.value })}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newSplit.description}
                      onChange={(e) => setNewSplit({ ...newSplit, description: sanitizeInput(e.target.value) })}
                    />
                    <Button type="button" onClick={handleAddSplit} disabled={!newSplit.category || !newSplit.amount}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {!isValidSplit && isSplit && hasValidMainAmount && (
                    <p className="text-sm text-destructive">
                      Split amounts must equal total: {formatCurrency(totalSplitAmount)} / {formatCurrency(mainAmount)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
              />
              <Label htmlFor="isRecurring">This is a recurring transaction</Label>
            </div>

            {isRecurring && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recurring Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={recurringRule.frequency} onValueChange={(value: any) => setRecurringRule({ ...recurringRule, frequency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Every</Label>
                      <Input
                        type="number"
                        min="1"
                        value={recurringRule.interval}
                        onChange={(e) => setRecurringRule({ ...recurringRule, interval: parseInt(e.target.value) || 1 })}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Next Date</Label>
                    <Input
                      type="date"
                      value={recurringRule.nextDate}
                      onChange={(e) => setRecurringRule({ ...recurringRule, nextDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={recurringRule.endDate || ''}
                      onChange={(e) => setRecurringRule({ ...recurringRule, endDate: e.target.value || undefined })}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <div className="space-y-4">
              {/* Upload buttons */}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
                <Button type="button" variant="outline" onClick={handleAddNote}>
                  <StickyNote className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
              
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Current attachments */}
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  {attachment.type === 'image' && <Image className="h-4 w-4" />}
                  {attachment.type === 'document' && <FileText className="h-4 w-4" />}
                  {attachment.type === 'note' && <StickyNote className="h-4 w-4" />}
                  <span className="flex-1 text-sm truncate">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Template Selection */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setShowTemplateDialog(true)}>
            <Layout className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>

        {/* Form Actions */}
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!isValidSplit || !isValidDate || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {submitText}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select a Template</DialogTitle>
            <DialogDescription>
              Choose a template to quickly populate the transaction form
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Quick Add Templates */}
            {getQuickAddTemplates().length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Quick Add</h3>
                <div className="grid grid-cols-2 gap-2">
                  {getQuickAddTemplates().map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Most Used Templates */}
            {getMostUsedTemplates().length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Most Used</h3>
                <div className="space-y-2">
                  {getMostUsedTemplates().map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      <div className="text-left">
                        <div>{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(template.amount)} • Used {template.usageCount} times
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* All Templates */}
            {templates.filter(t => !t.isQuickAdd).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">All Templates</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {templates.filter(t => !t.isQuickAdd).map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                      className="w-full justify-start"
                    >
                      <span className="mr-2">{template.icon}</span>
                      <div className="text-left">
                        <div>{template.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(template.amount)} • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
