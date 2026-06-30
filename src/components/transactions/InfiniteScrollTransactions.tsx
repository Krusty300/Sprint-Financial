'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Transaction } from '@/lib/types';
import { TransactionTable } from './TransactionTable';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface InfiniteScrollTransactionsProps {
  transactions: Transaction[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (data: Omit<Transaction, 'id'>) => void;
}

export function InfiniteScrollTransactions({
  transactions,
  onLoadMore,
  hasMore = true,
  loading = false,
  onEdit,
  onDelete,
  onDuplicate
}: InfiniteScrollTransactionsProps) {
  const { formatCurrency } = useCurrency();
  const [displayedCount, setDisplayedCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const displayedTransactions = transactions.slice(0, displayedCount);

  // Reset displayed count when transactions change significantly
  useEffect(() => {
    setDisplayedCount(Math.min(20, transactions.length));
  }, [transactions]);

  const handleScroll = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading && !loading) {
      setIsLoading(true);
      
      // Load more transactions
      setTimeout(() => {
        setDisplayedCount(prev => {
          const newCount = Math.min(prev + 20, transactions.length);
          return newCount;
        });
        setIsLoading(false);
        
        // Call onLoadMore if provided
        if (onLoadMore) {
          onLoadMore();
        }
      }, 300);
    }
  }, [hasMore, isLoading, loading, onLoadMore, transactions.length]);

  useEffect(() => {
    const currentObserver = observer.current;
    if (currentObserver) {
      currentObserver.disconnect();
    }

    const newObserver = new IntersectionObserver(handleScroll, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    } as IntersectionObserverInit);

    if (loadMoreRef.current) {
      newObserver.observe(loadMoreRef.current);
    }

    observer.current = newObserver;

    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
      if (newObserver) {
        newObserver.disconnect();
      }
    };
  }, [handleScroll]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore && displayedCount < transactions.length) {
      setIsLoading(true);
      
      setTimeout(() => {
        setDisplayedCount(prev => {
          const newCount = Math.min(prev + 20, transactions.length);
          return newCount;
        });
        setIsLoading(false);
        
        if (onLoadMore) {
          onLoadMore();
        }
      }, 200);
    }
  };

  return (
    <div className="space-y-4">
      {/* Transaction List */}
      <TransactionTable
        transactions={displayedTransactions}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      />

      {/* Load More Trigger */}
      {displayedCount < transactions.length && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more transactions...</span>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loading}
              size="sm"
            >
              Load More ({transactions.length - displayedCount} remaining)
            </Button>
          )}
        </div>
      )}

      {/* End Message */}
      {displayedCount >= transactions.length && transactions.length > 0 && (
        <div className="text-center py-4 text-muted-foreground border-t">
          <p className="text-sm">
            Showing all {transactions.length} transactions
          </p>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No transactions found</p>
        </div>
      )}
    </div>
  );
}
