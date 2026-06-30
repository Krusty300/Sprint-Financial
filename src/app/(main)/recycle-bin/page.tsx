'use client';

import { useState } from 'react';
import { RecycleBinItem } from '@/lib/types';
import { useRecycleBin } from '@/hooks/useRecycleBin';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Trash2,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { FavoriteButton } from '@/components/layout/FavoriteButton';

export default function RecycleBinPage() {
  const { resolvedTheme } = useTheme();
  const {
    items,
    loading,
    restoreItem,
    permanentDeleteItem,
    emptyRecycleBin,
    getItemDescription,
    getItemTypeLabel,
    getItemCountByType,
    getOldItems,
    refreshItems,
  } = useRecycleBin();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);

  const itemCounts = getItemCountByType();
  const oldItems = getOldItems(30); // Items older than 30 days

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      getItemDescription(item).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleRestore = async (id: string) => {
    try {
      await restoreItem(id);
      toast.success('Item restored successfully!');
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      toast.error('Failed to restore item. Please try again.');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await permanentDeleteItem(id);
      toast.success('Item permanently deleted!');
      setItemToDelete(null);
      setPermanentDeleteDialogOpen(false);
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    } catch (error) {
      toast.error('Failed to delete item. Please try again.');
    }
  };

  const handleBulkRestore = async () => {
    try {
      for (const id of selectedItems) {
        await restoreItem(id);
      }
      toast.success(`${selectedItems.length} items restored successfully!`);
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to restore some items. Please try again.');
    }
  };

  const handleBulkPermanentDelete = async () => {
    try {
      for (const id of selectedItems) {
        await permanentDeleteItem(id);
      }
      toast.success(`${selectedItems.length} items permanently deleted!`);
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to delete some items. Please try again.');
    }
  };

  const handleEmptyRecycleBin = async () => {
    try {
      await emptyRecycleBin();
      toast.success('Recycle bin emptied successfully!');
      setEmptyDialogOpen(false);
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to empty recycle bin. Please try again.');
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recycle bin...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recycle Bin</h1>
          <p className="text-muted-foreground">
            Restore or permanently delete your deleted items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton size="sm" variant="outline" showLabel={false} />
          {items.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setEmptyDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Empty Recycle Bin
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
            <p className="text-xs text-muted-foreground">
              Items in recycle bin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Old Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{oldItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Older than 30 days
            </p>
          </CardContent>
        </Card>

        {Object.entries(itemCounts).map(([type, count]) => (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {getItemTypeLabel(type)}s
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              <option value="transaction">Transactions</option>
              <option value="category">Categories</option>
              <option value="budget">Budgets</option>
              <option value="account">Accounts</option>
              <option value="template">Templates</option>
            </select>
          </div>

          {filteredItems.length > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.length === filteredItems.length}
                onChange={toggleSelectAll}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">
                Select all ({filteredItems.length} items)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                onClick={handleBulkRestore}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Selected
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkPermanentDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {items.length === 0 ? 'Recycle bin is empty' : 'No items found'}
              </h3>
              <p className="text-muted-foreground">
                {items.length === 0 
                  ? 'Items you delete will appear here for 30 days.'
                  : 'Try adjusting your filters or search terms.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="capitalize">
                          {getItemTypeLabel(item.type)}
                        </Badge>
                        <span className="font-medium">
                          {getItemDescription(item)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Deleted {formatDate(new Date(item.deletedAt))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.deletedAt).toLocaleTimeString()}
                        </div>
                        {item.deletedBy && (
                          <Badge variant="outline" className="text-xs">
                            {item.deletedBy === 'user' ? 'User' : 'System'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setItemToDelete(item.id);
                        setPermanentDeleteDialogOpen(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={permanentDeleteDialogOpen} onOpenChange={setPermanentDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently Delete Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action <strong>cannot be undone</strong>. The item will be permanently removed from your recycle bin and cannot be recovered.
              <br /><br />
              Are you absolutely sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && handlePermanentDelete(itemToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Recycle Bin Dialog */}
      <AlertDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty Recycle Bin
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action <strong>cannot be undone</strong>. All {items.length} items in the recycle bin will be permanently deleted.
              <br /><br />
              Are you absolutely sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyRecycleBin}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Empty Recycle Bin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
