'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Star,
  Clock,
  TrendingUp,
  CreditCard,
  Wallet,
  Smartphone,
  DollarSign
} from 'lucide-react';
import { Account } from '@/lib/types';

interface AccountTemplate {
  id: string;
  name: string;
  description: string;
  accountType: 'cash' | 'bank' | 'credit' | 'mobile';
  defaultBalance: number;
  currency: string;
  category: string;
  tags: string[];
  isPopular: boolean;
  isCustom: boolean;
  createdAt: string;
  usageCount: number;
}

interface AccountTemplatesProps {
  onUseTemplate?: (template: AccountTemplate) => void;
  onCreateAccount?: (account: Omit<Account, 'id'>) => void;
}

export function AccountTemplates({ onUseTemplate, onCreateAccount }: AccountTemplatesProps) {
  const [templates, setTemplates] = useState<AccountTemplate[]>([
    // Built-in templates
    {
      id: 'checking-basic',
      name: 'Basic Checking',
      description: 'Standard checking account for daily transactions',
      accountType: 'bank',
      defaultBalance: 1000,
      currency: 'USD',
      category: 'Banking',
      tags: ['daily', 'transactions', 'checking'],
      isPopular: true,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'savings-emergency',
      name: 'Emergency Savings',
      description: 'High-yield savings account for emergency fund',
      accountType: 'bank',
      defaultBalance: 5000,
      currency: 'USD',
      category: 'Savings',
      tags: ['emergency', 'savings', 'high-yield'],
      isPopular: true,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'credit-card-rewards',
      name: 'Rewards Credit Card',
      description: 'Credit card with cashback rewards program',
      accountType: 'credit',
      defaultBalance: 0,
      currency: 'USD',
      category: 'Credit',
      tags: ['rewards', 'cashback', 'credit'],
      isPopular: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'investment-brokerage',
      name: 'Investment Brokerage',
      description: 'Brokerage account for stocks and ETFs',
      accountType: 'bank',
      defaultBalance: 10000,
      currency: 'USD',
      category: 'Investment',
      tags: ['stocks', 'ETFs', 'brokerage', 'investment'],
      isPopular: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'cash-wallet',
      name: 'Cash Wallet',
      description: 'Physical cash for daily expenses',
      accountType: 'cash',
      defaultBalance: 200,
      currency: 'USD',
      category: 'Cash',
      tags: ['physical', 'cash', 'daily'],
      isPopular: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    },
    {
      id: 'mobile-paypal',
      name: 'Mobile Payment',
      description: 'Digital wallet for online and mobile payments',
      accountType: 'mobile',
      defaultBalance: 100,
      currency: 'USD',
      category: 'Digital',
      tags: ['mobile', 'digital', 'online'],
      isPopular: false,
      isCustom: false,
      createdAt: new Date().toISOString(),
      usageCount: 0
    }
  ]);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AccountTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    accountType: 'bank' as const,
    defaultBalance: 0,
    currency: 'USD',
    category: '',
    tags: [] as string[]
  });

  const handleUseTemplate = (template: AccountTemplate) => {
    // Increment usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    setTemplates(updatedTemplates);

    // Create account from template
    const account: Omit<Account, 'id'> = {
      name: template.name,
      type: template.accountType,
      balance: template.defaultBalance,
      currency: template.currency
    };

    onCreateAccount?.(account);
    onUseTemplate?.(template);
  };

  const handleCreateTemplate = () => {
    const template: AccountTemplate = {
      id: `custom_${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description,
      accountType: newTemplate.accountType,
      defaultBalance: newTemplate.defaultBalance,
      currency: newTemplate.currency,
      category: newTemplate.category,
      tags: newTemplate.tags,
      isPopular: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    setTemplates([...templates, template]);
    setShowCreateDialog(false);
    setNewTemplate({
      name: '',
      description: '',
      accountType: 'bank',
      defaultBalance: 0,
      currency: 'USD',
      category: '',
      tags: []
    });
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id ? editingTemplate : t
    );
    setTemplates(updatedTemplates);
    setShowEditDialog(false);
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return <Wallet className="h-5 w-5" />;
      case 'bank': return <DollarSign className="h-5 w-5" />;
      case 'credit': return <CreditCard className="h-5 w-5" />;
      case 'mobile': return <Smartphone className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'bank': return 'bg-blue-100 text-blue-800';
      case 'credit': return 'bg-purple-100 text-purple-800';
      case 'mobile': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const popularTemplates = templates.filter(t => t.isPopular);
  const customTemplates = templates.filter(t => t.isCustom);
  const allTemplates = templates.filter(t => !t.isPopular);

  const TemplateCard = ({ template }: { template: AccountTemplate }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-none">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
              {getAccountIcon(template.accountType)}
            </div>
            <div>
              <h3 className="font-semibold">{template.name}</h3>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {template.isPopular && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
            {template.isCustom && <Badge variant="outline">Custom</Badge>}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Default Balance</span>
            <span className="font-medium">${template.defaultBalance.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge className={getAccountTypeColor(template.accountType)}>
              {template.accountType}
            </Badge>
          </div>

          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Used {template.usageCount} times</span>
            <span>{template.currency}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button 
            onClick={() => handleUseTemplate(template)}
            className="flex-1"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Use Template
          </Button>
          
          {template.isCustom && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingTemplate(template);
                  setShowEditDialog(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeleteTemplate(template.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Account Templates</h3>
          <p className="text-sm text-muted-foreground">
            Quick setup with pre-configured account templates
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Account Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., High-Yield Savings"
                  />
                </div>

                <div>
                  <Label htmlFor="template-description">Description</Label>
                  <Input
                    id="template-description"
                    value={newTemplate.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this template is for"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-type">Account Type</Label>
                    <Select value={newTemplate.accountType} onValueChange={(value: any) => 
                      setNewTemplate(prev => ({ ...prev, accountType: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="template-currency">Currency</Label>
                    <Select value={newTemplate.currency} onValueChange={(value) => 
                      setNewTemplate(prev => ({ ...prev, currency: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="template-balance">Default Balance</Label>
                    <Input
                      id="template-balance"
                      type="number"
                      value={newTemplate.defaultBalance}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, defaultBalance: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-category">Category</Label>
                    <Input
                      id="template-category"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Banking, Savings"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Create Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Popular Templates */}
      {popularTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Popular Templates
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {popularTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Custom Templates
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      {allTemplates.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            All Templates
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {templates.length === 0 && (
        <Card className="rounded-none">
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No templates available</h3>
              <p className="text-muted-foreground">
                Create your first account template for quick setup
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>

            {/* Banking Integration Section */}
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle className="text-base">Bank Integration</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🏦</div>
                  <h3 className="text-lg font-semibold mb-2">Bank Templates</h3>
                  <p className="text-muted-foreground mb-4">
                    Quick setup for bank-linked accounts
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/banking'}
                  >
                    Go to Banking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Edit Template Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Account Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingTemplate.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditTemplate}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
