'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ArrowUp,
  ArrowDown,
  Copy
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Account } from '@/lib/types';

interface DragDropAccountsProps {
  accounts: Account[];
  onReorder?: (accounts: Account[]) => void;
  onAccountEdit?: (account: Account) => void;
  onAccountDelete?: (account: Account) => void;
  onAccountView?: (account: Account) => void;
  selectedAccounts?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DragDropAccounts({
  accounts,
  onReorder,
  onAccountEdit,
  onAccountDelete,
  onAccountView,
  selectedAccounts = [],
  onSelectionChange
}: DragDropAccountsProps) {
  const { formatCurrency } = useCurrency();
  const [draggedAccount, setDraggedAccount] = useState<Account | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const dragCounter = useRef(0);

  const handleDragStart = (e: React.DragEvent, account: Account) => {
    setDraggedAccount(account);
    e.dataTransfer.effectAllowed = 'move';
    dragCounter.current = 0;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIndex(null);

    if (!draggedAccount) return;

    const draggedIndex = accounts.findIndex(account => account.id === draggedAccount.id);
    if (draggedIndex === dropIndex) return;

    const newAccounts = [...accounts];
    newAccounts.splice(draggedIndex, 1);
    newAccounts.splice(dropIndex, 0, draggedAccount);

    onReorder?.(newAccounts);
    setDraggedAccount(null);
  };

  const handleDragEnd = () => {
    setDraggedAccount(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleSelectionToggle = (accountId: string) => {
    const newSelection = selectedAccounts.includes(accountId)
      ? selectedAccounts.filter(id => id !== accountId)
      : [...selectedAccounts, accountId];
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(accounts.map(account => account.id));
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cash': return '💵';
      case 'bank': return '🏦';
      case 'credit': return '💳';
      case 'mobile': return '📱';
      default: return '💼';
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

  const AccountCard = ({ account, index }: { account: Account; index: number }) => (
    <Card
      draggable
      onDragStart={(e) => handleDragStart(e, account)}
      onDragEnter={(e) => handleDragEnter(e, index)}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      className={`cursor-move transition-all duration-200 ${
        draggedAccount?.id === account.id ? 'opacity-50' : ''
      } ${
        dragOverIndex === index ? 'border-2 border-blue-400 bg-blue-50' : ''
      } ${
        selectedAccounts.includes(account.id) ? 'ring-2 ring-blue-400' : ''
      } hover:shadow-md`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-semibold">{account.name}</h3>
                <p className="text-sm text-muted-foreground">{account.type}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedAccounts.includes(account.id)}
              onChange={() => handleSelectionToggle(account.id)}
              className="rounded"
            />
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className={`font-semibold ${
              account.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(account.balance)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={getAccountTypeColor(account.type)}>
              {account.type}
            </Badge>
            {account.currency && (
              <Badge variant="outline" className="text-xs">
                {account.currency}
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAccountView?.(account)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAccountEdit?.(account)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAccountDelete?.(account)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Accounts</h3>
          <Badge variant="outline">{accounts.length} accounts</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedAccounts.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span>{selectedAccounts.length} selected</span>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          )}
          
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedAccounts.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 rounded-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Bulk Actions:</span>
                <Badge variant="outline">{selectedAccounts.length} accounts selected</Badge>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  Move Up
                </Button>
                <Button variant="outline" size="sm">
                  <ArrowDown className="h-4 w-4 mr-1" />
                  Move Down
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="border-muted rounded-none">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="h-4 w-4" />
            <span>Drag and drop accounts to reorder them. Select multiple accounts for bulk operations.</span>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Display */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => (
            <AccountCard key={account.id} account={account} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account, index) => (
            <Card
              key={account.id}
              draggable
              onDragStart={(e) => handleDragStart(e, account)}
              onDragEnter={(e) => handleDragEnter(e, index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`cursor-move transition-all duration-200 ${
                draggedAccount?.id === account.id ? 'opacity-50' : ''
              } ${
                dragOverIndex === index ? 'border-2 border-blue-400 bg-blue-50' : ''
              } ${
                selectedAccounts.includes(account.id) ? 'ring-2 ring-blue-400' : ''
              } hover:shadow-md`}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => handleSelectionToggle(account.id)}
                      className="rounded"
                    />
                    <div className="flex items-center gap-2">
                      <div>
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-muted-foreground">{account.type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`font-semibold ${
                        account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(account.balance)}
                      </div>
                      <Badge className={getAccountTypeColor(account.type)}>
                        {account.type}
                      </Badge>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {accounts.length === 0 && (
        <Card className="rounded-none">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground">
              Add your first account to start tracking your finances
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
