'use client';

import { useState, useMemo, useCallback } from 'react';
import { TransactionTemplate } from '@/lib/types';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Star, 
  Layout,
  TrendingUp,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { validateTemplateData, sanitizeTags, parseAmount, validateTemplateUsage, TemplateValidationError } from '@/utils/templateValidation';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

interface TemplateManagerProps {
  onUseTemplate?: (template: TransactionTemplate) => void;
}

export function TemplateManager({ onUseTemplate }: TemplateManagerProps) {
  const { 
    templates, 
    loading, 
    updatingIds,
    addTemplate, 
    updateTemplate, 
    deleteTemplate,
    getQuickAddTemplates,
    getMostUsedTemplates 
  } = useTransactionTemplates();
  
  const { formatCurrency } = useCurrency();
  const { resolvedTheme } = useTheme();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    account: '',
    tags: '',
    isQuickAdd: false,
    icon: '📌',
    color: '#64748b'
  });

  const [validationErrors, setValidationErrors] = useState<TemplateValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operationErrors, setOperationErrors] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      account: '',
      tags: '',
      isQuickAdd: false,
      icon: '📌',
      color: '#64748b'
    });
    setValidationErrors([]);
    setOperationErrors([]);
  };

  const handleCreateTemplate = async () => {
    setIsSubmitting(true);
    setOperationErrors([]);

    try {
      // Validate form data
      const parsedAmount = parseAmount(formData.amount);
      const sanitizedTags = sanitizeTags(formData.tags);
      
      const templateData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        amount: parsedAmount!,
        type: formData.type,
        category: formData.category.trim(),
        account: formData.account?.trim() || undefined,
        tags: sanitizedTags,
        isQuickAdd: formData.isQuickAdd,
        icon: formData.icon,
        color: formData.color,
      };

      // Validate template data
      const errors = validateTemplateData(templateData);
      if (errors.length > 0) {
        setValidationErrors(errors);
        const errorMessages = errors.map(e => `${e.field}: ${e.message}`);
        setOperationErrors(errorMessages);
        toast.error('Please fix the validation errors');
        return;
      }

      await addTemplate(templateData);
      toast.success('Template created successfully');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setOperationErrors([errorMessage]);
      toast.error('Failed to create template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate) return;

    setIsSubmitting(true);
    setOperationErrors([]);

    try {
      // Validate form data
      const parsedAmount = parseAmount(formData.amount);
      const sanitizedTags = sanitizeTags(formData.tags);
      
      const updates = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        amount: parsedAmount!,
        type: formData.type,
        category: formData.category.trim(),
        account: formData.account?.trim() || undefined,
        tags: sanitizedTags,
        isQuickAdd: formData.isQuickAdd,
        icon: formData.icon,
        color: formData.color,
      };

      // Validate template data
      const errors = validateTemplateData(updates);
      if (errors.length > 0) {
        setValidationErrors(errors);
        const errorMessages = errors.map(e => `${e.field}: ${e.message}`);
        setOperationErrors(errorMessages);
        toast.error('Please fix the validation errors');
        return;
      }

      await updateTemplate(selectedTemplate.id, updates);
      toast.success('Template updated successfully');
      setShowEditDialog(false);
      setSelectedTemplate(null);
      resetForm();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setOperationErrors([errorMessage]);
      toast.error('Failed to update template');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (template: TransactionTemplate) => {
    try {
      await deleteTemplate(template.id);
      toast.success(`Template "${template.name}" deleted successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to delete template: ${errorMessage}`);
    }
  };

  const handleUseTemplateClick = useCallback((template: TransactionTemplate) => {
    try {
      // Validate template before usage
      const errors = validateTemplateUsage(template);
      if (errors.length > 0) {
        toast.error('Template cannot be used: ' + errors.map(e => e.message).join(', '));
        return;
      }

      if (onUseTemplate) {
        onUseTemplate(template);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to use template: ' + errorMessage);
    }
  }, [onUseTemplate]);

  const handleEditTemplateClick = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      amount: template.amount.toString(),
      type: template.type,
      category: template.category,
      account: template.account || '',
      tags: template.tags?.join(', ') || '',
      isQuickAdd: template.isQuickAdd || false,
      icon: template.icon || '📌',
      color: template.color || '#64748b'
    });
    setShowEditDialog(true);
  };

  const isTemplateUpdating = (templateId: string) => {
    return updatingIds.has(templateId);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const iconOptions = ['📌', '💰', '💼', '📈', '🍔', '🚗', '🛍️', '🎮', '📄', '🏥', '📚', '🏠', '⚡', '🛒', '🎬', '✈️'];
  const colorOptions = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#84cc16', '#64748b'];

  const filteredCategories = useMemo(() => 
    categories.filter(cat => cat.type === formData.type),
    [categories, formData.type]
  );

  const quickAddTemplates = useMemo(() => 
    templates.filter(t => t.isQuickAdd),
    [templates]
  );

  const mostUsedTemplates = useMemo(() => 
    templates
      .filter(t => !t.isQuickAdd)
      .slice(0, 5),
    [templates]
  );

  const otherTemplates = useMemo(() => 
    templates.filter(t => 
      !t.isQuickAdd && 
      mostUsedTemplates.findIndex(ut => ut.id === t.id) === -1
    ),
    [templates, mostUsedTemplates]
  );

  if (loading) {
    const skeletonCount = Math.max(1, Math.min(6, Math.ceil(templates.length / 2) || 3));
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        
        {/* Quick Add Skeleton */}
        <div>
          <div className="h-6 bg-muted rounded w-24 mb-3 animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(skeletonCount)].map((_, i) => (
              <Card key={`quick-skeleton-${i}`}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-8 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Most Used Skeleton */}
        <div>
          <div className="h-6 bg-muted rounded w-24 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            {[...Array(Math.min(3, skeletonCount))].map((_, i) => (
              <Card key={`most-skeleton-${i}`}>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-6 bg-muted rounded w-6"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-32 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-48"></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-muted rounded w-16"></div>
                        <div className="h-8 bg-muted rounded w-8"></div>
                        <div className="h-8 bg-muted rounded w-8"></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transaction Templates</h2>
          <p className="text-muted-foreground">Quick-add templates for frequent transactions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Error Display */}
      {operationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {operationErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Add Templates */}
      {quickAddTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Quick Add
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickAddTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Quick add template: ${template.name}, amount ${formatCurrency(template.amount)}, category ${template.category}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUseTemplateClick(template);
                  }
                }}
                onClick={() => handleUseTemplateClick(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplateClick(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency(template.amount)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Most Used Templates */}
      {mostUsedTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Most Used
          </h3>
          <div className="space-y-2">
            {mostUsedTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Most used template: ${template.name}, amount ${formatCurrency(template.amount)}, category ${template.category}, used ${template.usageCount} times`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUseTemplateClick(template);
                  }
                }}
                onClick={() => handleUseTemplateClick(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{template.icon}</span>
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(template.amount)} • {template.category} • Used {template.usageCount} times
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {onUseTemplate && (
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplateClick(template)}
                          disabled={isTemplateUpdating(template.id)}
                          aria-label={`Use template ${template.name}`}
                        >
                          {isTemplateUpdating(template.id) ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Use
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplateClick(template)}
                        disabled={isTemplateUpdating(template.id)}
                        aria-label={`Edit template ${template.name}`}
                      >
                        {isTemplateUpdating(template.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Edit className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template)}
                        disabled={isTemplateUpdating(template.id)}
                        aria-label={`Delete template ${template.name}`}
                      >
                        {isTemplateUpdating(template.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Other Templates */}
      {otherTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Layout className="h-5 w-5 mr-2" />
            All Templates
          </h3>
          <div className="space-y-2">
            {otherTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Template: ${template.name}, amount ${formatCurrency(template.amount)}, category ${template.category}${template.lastUsed ? `, last used ${new Date(template.lastUsed).toLocaleDateString()}` : ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUseTemplateClick(template);
                  }
                }}
                onClick={() => handleUseTemplateClick(template)}
              >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{template.icon}</span>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(template.amount)} • {template.category}
                            {template.lastUsed && (
                              <span className="ml-2 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(template.lastUsed).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {onUseTemplate && (
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplateClick(template)}
                            disabled={isTemplateUpdating(template.id)}
                            aria-label={`Use template ${template.name}`}
                          >
                            {isTemplateUpdating(template.id) ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Copy className="h-3 w-3 mr-1" />
                            )}
                            Use
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditTemplateClick(template)}
                          disabled={isTemplateUpdating(template.id)}
                          aria-label={`Edit template ${template.name}`}
                        >
                          {isTemplateUpdating(template.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Edit className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template)}
                          disabled={isTemplateUpdating(template.id)}
                          aria-label={`Delete template ${template.name}`}
                        >
                          {isTemplateUpdating(template.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Layout className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">
              Create templates for frequently used transactions to save time
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedTemplate(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog 
                ? 'Modify the template details for quick transaction creation.'
                : 'Create a new template for frequently used transactions.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Please fix the following errors:</div>
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm">
                      • {error.field}: {error.message}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.type === 'income' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                className={`flex-1 ${formData.type === 'income' ? 'bg-success hover:bg-success/90' : ''}`}
              >
                Income
              </Button>
              <Button
                type="button"
                variant={formData.type === 'expense' ? 'default' : 'outline'}
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                className={`flex-1 ${formData.type === 'expense' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
              >
                Expense
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Grocery Shopping"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="account">Default Account</Label>
                <Select value={formData.account} onValueChange={(value) => setFormData({ ...formData, account: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tags">Default Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="urgent, business, travel"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => (
                    <Button
                      key={icon}
                      type="button"
                      variant={formData.icon === icon ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon })}
                      className="text-lg"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2">
                  {colorOptions.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant={formData.color === color ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, color })}
                      className="p-2"
                      style={{ backgroundColor: color, borderColor: color }}
                    >
                      <span className="text-white text-xs">●</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isQuickAdd"
                checked={formData.isQuickAdd}
                onCheckedChange={(checked) => setFormData({ ...formData, isQuickAdd: !!checked })}
              />
              <Label htmlFor="isQuickAdd">Show in Quick Add (appears as shortcut)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedTemplate(null);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={showEditDialog ? handleEditTemplate : handleCreateTemplate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {showEditDialog ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {showEditDialog ? 'Update Template' : 'Create Template'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
