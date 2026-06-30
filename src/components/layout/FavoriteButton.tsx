'use client';

import { memo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useNavigationCache } from '@/hooks/useNavigationCache';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'default';
  showLabel?: boolean;
}

export const FavoriteButton = memo(function FavoriteButton({
  className,
  size = 'sm',
  variant = 'ghost',
  showLabel = false,
}: FavoriteButtonProps) {
  const pathname = usePathname();
  const { sortedItems, favoriteItems, toggleFavorite } = useNavigationCache();
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if current page is a favorite
  useEffect(() => {
    const currentItem = sortedItems.find(item => item.href === pathname);
    // @ts-expect-error - TypeScript inference issue with favoriteItems type
    setIsFavorite(currentItem ? favoriteItems.includes(currentItem.id) : false);
  }, [pathname, sortedItems, favoriteItems]);

  const handleToggle = () => {
    const currentItem = sortedItems.find(item => item.href === pathname);
    if (currentItem) {
      toggleFavorite(currentItem.id);
    }
  };

  // Don't show button if current page is not in navigation
  const currentItem = sortedItems.find(item => item.href === pathname);
  if (!currentItem) return null;

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <Button
      variant={variant}
      size={size === 'sm' ? 'sm' : size === 'md' ? 'default' : 'lg'}
      onClick={handleToggle}
      className={cn(
        'transition-all duration-200',
        isFavorite && 'text-yellow-500 hover:text-yellow-600',
        !isFavorite && 'hover:text-yellow-500',
        className
      )}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star
        className={cn(
          iconSizes[size],
          isFavorite ? 'fill-current' : ''
        )}
      />
      {showLabel && (
        <span className="ml-2">
          {isFavorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </Button>
  );
});
