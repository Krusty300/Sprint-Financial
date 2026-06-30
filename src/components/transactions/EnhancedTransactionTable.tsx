'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { Transaction, TransactionAttachment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowUpDown,
  Copy,
  FileDown,
  GripVertical
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { DuplicateTransactionDialog } from '@/components/dialogs/DuplicateTransactionDialog';
import { TransactionNotes } from '@/components/transactions/TransactionNotes';
import { TransactionAttachments } from '@/components/transactions/TransactionAttachments';
import { TransactionQuickActions, useTransactionQuickActions } from '@/components/transactions/TransactionQuickActions';
import { InlineTransactionEdit } from '@/components/transactions/InlineTransactionEdit';
import { cn } from '@/lib/utils';

interface EnhancedTransactionTableProps {
  transactions: Transaction[];
  searchTerm?: string;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (ids: string[]) => void;
  onDuplicate?: (data: Omit<Transaction, 'id'>) => void;
  onExportDialog?: () => void;
  onSelectionChange?: (ids: string[]) => void;
  onBulkCategoryChange?: () => void;
  onBulkDateEdit?: () => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onReorderTransactions?: (fromIndex: number, toIndex: number) => void;
  enableDragDrop?: boolean;
}

type SortField = 'date' | 'description' | 'category' | 'amount' | 'account';
type SortDirection = 'asc' | 'desc';

interface TransactionRowProps {
  transaction: Transaction;
  index: number;
  category: any;
  account: any;
  isIncome: boolean;
  isSelected: boolean;
  isEditing: boolean;
  enableDragDrop: boolean;
  draggedItemId: string | null;
  categories: any[];
  accounts: any[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onDoubleClick: (id: string) => void;
  onContextMenu: (id: string, e: React.MouseEvent) => void;
  onNotesUpdate: (transactionId: string, notes: string) => void;
  onAttachmentAdd: (transactionId: string, attachment: Omit<TransactionAttachment, 'id' | 'createdAt'>) => void;
  onAttachmentRemove: (transactionId: string, attachmentId: string) => void;
  onInlineEditSave: (transactionId: string, updates: Partial<Transaction>) => void;
  onInlineEditCancel: () => void;
  onDragStart: (id: string, index: number) => void;
  onDragOver: (id: string, index: number) => void;
  onDragDropReorder: (draggedId: string, toIndex: number) => void;
  onDragEnd: () => void;
  onDuplicate: (transaction: Transaction) => void;
}

const TransactionRow = memo(function TransactionRow({
  transaction,
  index,
  category,
  account,
  isIncome,
  isSelected,
  isEditing,
  enableDragDrop,
  draggedItemId,
  categories,
  accounts,
  onEdit,
  onDelete,
  onSelectOne,
  onDoubleClick,
  onContextMenu,
  onNotesUpdate,
  onAttachmentAdd,
  onAttachmentRemove,
  onInlineEditSave,
  onInlineEditCancel,
  onDragStart,
  onDragOver,
  onDragDropReorder,
  onDragEnd,
  onDuplicate
}: TransactionRowProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();

  if (isEditing) {
    return (
      <TableRow key={transaction.id} className={isSelected ? 'bg-muted/50' : ''}>
        <TableCell colSpan={7}>
          <InlineTransactionEdit
            transaction={transaction}
            categories={categories}
            accounts={accounts}
            onSave={(updates) => onInlineEditSave(transaction.id, updates)}
            onCancel={onInlineEditCancel}
          />
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow 
      key={transaction.id}
      className={isSelected ? 'bg-muted/50' : ''}
      onContextMenu={(e) => onContextMenu(transaction.id, e)}
      onDoubleClick={() => onDoubleClick(transaction.id)}
      draggable={enableDragDrop}
      onDragStart={(e) => {
        if (!enableDragDrop) return;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('transactionId', transaction.id);
        e.dataTransfer.setData('index', index.toString());
        onDragStart(transaction.id, index);
      }}
      onDragOver={(e) => {
        if (!enableDragDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver(transaction.id, index);
      }}
      onDrop={(e) => {
        if (!enableDragDrop) return;
        e.preventDefault();
        const draggedTransactionId = e.dataTransfer.getData('transactionId');
        onDragDropReorder(draggedTransactionId, index);
        onDragEnd();
      }}
      onDragEnd={() => {
        if (!enableDragDrop) return;
        onDragEnd();
      }}
      style={enableDragDrop && draggedItemId === transaction.id ? { opacity: 0.5, transform: 'scale(0.95)' } : {}}
    >
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectOne(transaction.id, !!checked)}
        />
      </TableCell>
      <TableCell className="font-medium">
        {formatDate(transaction.date)}
      </TableCell>
      <TableCell className="max-w-[300px]">
        <div className="flex items-center gap-2">
          <span className="truncate flex-1">{transaction.description}</span>
          <div className="flex gap-1 flex-shrink-0">
            <TransactionNotes
              notes={transaction.notes}
              onSave={(notes) => onNotesUpdate(transaction.id, notes)}
            />
            <TransactionAttachments
              attachments={transaction.attachments}
              onAdd={(attachment) => onAttachmentAdd(transaction.id, attachment)}
              onRemove={(attachmentId) => onAttachmentRemove(transaction.id, attachmentId)}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        {category && (
          <Badge variant="secondary" style={{ backgroundColor: category.color + '20', color: category.color }}>
            {category.name}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {account?.name || '-'}
      </TableCell>
      <TableCell className={`text-right font-medium ${isIncome ? 'text-success' : 'text-destructive'}`}>
        <div className="flex items-center justify-end">
          {isIncome ? (
            <ArrowUpRight className="mr-1 h-4 w-4 text-success" />
          ) : (
            <ArrowDownRight className="mr-1 h-4 w-4 text-destructive" />
          )}
          {formatCurrency(transaction.amount)}
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem key="edit" onClick={() => onEdit(transaction)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuItem key="duplicate" onClick={() => onDuplicate(transaction)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem 
                key="delete"
                onClick={() => {
                  if (!transaction) {
                    console.error('Attempted to delete invalid transaction');
                    return;
                  }
                  onDelete(transaction.id);
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

export function EnhancedTransactionTable({ 
  transactions,
  searchTerm = '',
  onEdit, 
  onDelete, 
  onBulkDelete, 
  onBulkExport, 
  onDuplicate, 
  onExportDialog, 
  onSelectionChange,
  onBulkCategoryChange,
  onBulkDateEdit,
  onUpdateTransaction,
  onReorderTransactions,
  enableDragDrop: propEnableDragDrop = false
}: EnhancedTransactionTableProps) {
  const { formatCurrency } = useCurrency();
  const { formatDate } = useFormatting();
  const { resolvedTheme } = useTheme();
  const { categories } = useCategories();
  const { accounts } = useAccounts();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [transactionToDuplicate, setTransactionToDuplicate] = useState<Transaction | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [enableDragDrop, setEnableDragDrop] = useState(propEnableDragDrop);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Update enableDragDrop when prop changes
  useEffect(() => {
    setEnableDragDrop(propEnableDragDrop);
  }, [propEnableDragDrop]);

  // Quick actions menu
  const {
    menuOpen,
    menuPosition,
    selectedTransactionId: quickActionTransactionId,
    openMenu,
    closeMenu
  } = useTransactionQuickActions();

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    return accounts.find(acc => acc.id === accountId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'on';
    if (isChecked) {
      setSelectedIds(filteredTransactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'on';
    if (isChecked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
    onSelectionChange?.(selectedIds);
  };

  // Handle notes update
  const handleNotesUpdate = useCallback((transactionId: string, notes: string) => {
    onUpdateTransaction?.(transactionId, { notes });
  }, [onUpdateTransaction]);

  // Handle attachments update
  const handleAttachmentAdd = useCallback((transactionId: string, attachment: Omit<TransactionAttachment, 'id' | 'createdAt'>) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const newAttachment: TransactionAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedAttachments = [...(transaction.attachments || []), newAttachment];
    onUpdateTransaction?.(transactionId, { attachments: updatedAttachments });
  }, [transactions, onUpdateTransaction]);

  const handleAttachmentRemove = useCallback((transactionId: string, attachmentId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const updatedAttachments = (transaction.attachments || []).filter(a => a.id !== attachmentId);
    onUpdateTransaction?.(transactionId, { attachments: updatedAttachments });
  }, [transactions, onUpdateTransaction]);

  // Handle inline edit save
  const handleInlineEditSave = useCallback((transactionId: string, updates: Partial<Transaction>) => {
    onUpdateTransaction?.(transactionId, updates);
    setEditingTransactionId(null);
  }, [onUpdateTransaction]);

  // Handle drag and drop reorder
  const handleDragDropReorder = useCallback((draggedId: string, toIndex: number) => {
    // Find the from index from the current transactions
    const fromIndex = transactions.findIndex(t => t.id === draggedId);
    if (fromIndex === -1) return;
    
    onReorderTransactions?.(fromIndex, toIndex);
  }, [transactions, onReorderTransactions]);

  const handleDragStart = useCallback((id: string, index: number) => {
    setDraggedItemId(id);
  }, []);

  const handleDragOver = useCallback((id: string, index: number) => {
    // Handle drag over if needed
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
  }, []);

  // Quick actions for right-click menu
  const getQuickActions = useCallback((transaction: Transaction) => {
    const actions = [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        onClick: () => onEdit?.(transaction)
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        icon: Copy,
        onClick: () => {
          setTransactionToDuplicate(transaction);
          setDuplicateDialogOpen(true);
        }
      },
      {
        id: 'divider-1',
        label: '',
        icon: () => null,
        onClick: () => {},
        divider: true
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        onClick: () => onDelete?.(transaction.id)
      }
    ];

    return actions;
  }, [onEdit, onDelete]);

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkExport = () => {
    if (onBulkExport) {
      onBulkExport(selectedIds);
    }
  };

  const handleDuplicateTransaction = (transaction: Transaction) => {
    setTransactionToDuplicate(transaction);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateSubmit = (data: Omit<Transaction, 'id'>) => {
    if (onDuplicate) {
      onDuplicate(data);
    }
  };

  // Sync selection state with parent component
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [selectedIds, onSelectionChange]);

  // Enhanced filtering and sorting
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryInfo(transaction.category)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getAccountInfo(transaction.account)?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'category':
          aValue = getCategoryInfo(a.category)?.name || '';
          bValue = getCategoryInfo(b.category)?.name || '';
          break;
        case 'account':
          aValue = getAccountInfo(a.account)?.name || '';
          bValue = getAccountInfo(b.account)?.name || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortField, sortDirection, categories, accounts]);

  if (transactions.length === 0) {
    return (
      <Card className="rounded-lg">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start by adding your transactions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUpDown className="ml-2 h-4 w-4 rotate-180" /> : 
      <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEnableDragDrop(!enableDragDrop)}
                className={cn(enableDragDrop && "bg-primary text-primary-foreground")}
              >
                <GripVertical className="h-4 w-4 mr-2" />
                {enableDragDrop ? 'Reorder On' : 'Reorder'}
              </Button>
              {selectedIds.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedIds.length} selected
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleBulkExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBulkCategoryChange}>
                    Change Category
                  </Button>
                  <Button variant="outline" size="sm" onClick={onBulkDateEdit}>
                    Edit Dates
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">
            Double-click a row to edit inline • Right-click for quick actions • Toggle Reorder to drag and drop
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <SortIcon field="date" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('description')}
                    >
                      Description
                      <SortIcon field="description" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('category')}
                    >
                      Category
                      <SortIcon field="category" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('account')}
                    >
                      Account
                      <SortIcon field="account" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 font-semibold"
                      onClick={() => handleSort('amount')}
                    >
                      Amount
                      <SortIcon field="amount" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction, index) => {
                  const category = getCategoryInfo(transaction.category);
                  const account = getAccountInfo(transaction.account);
                  const isIncome = transaction.type === 'income';
                  const isSelected = selectedIds.includes(transaction.id);
                  const isEditing = editingTransactionId === transaction.id;

                  return (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                      category={category}
                      account={account}
                      isIncome={isIncome}
                      isSelected={isSelected}
                      isEditing={isEditing}
                      enableDragDrop={enableDragDrop}
                      draggedItemId={draggedItemId}
                      categories={categories}
                      accounts={accounts}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onSelectOne={handleSelectOne}
                      onDoubleClick={setEditingTransactionId}
                      onContextMenu={openMenu}
                      onNotesUpdate={handleNotesUpdate}
                      onAttachmentAdd={handleAttachmentAdd}
                      onAttachmentRemove={handleAttachmentRemove}
                      onInlineEditSave={handleInlineEditSave}
                      onInlineEditCancel={() => setEditingTransactionId(null)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragDropReorder={handleDragDropReorder}
                      onDragEnd={handleDragEnd}
                      onDuplicate={(transaction) => {
                        setTransactionToDuplicate(transaction);
                        setDuplicateDialogOpen(true);
                      }}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredTransactions.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found matching "{searchTerm}"</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <DuplicateTransactionDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        transaction={transactionToDuplicate}
        onSubmit={handleDuplicateSubmit}
      />

      {/* Quick Actions Menu */}
      {menuOpen && menuPosition && quickActionTransactionId && (
        <TransactionQuickActions
          actions={getQuickActions(transactions.find(t => t.id === quickActionTransactionId)!)}
          position={menuPosition}
          onClose={closeMenu}
        />
      )}
    </>
  );
}
