'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/components/performance/OptimizedComponents';
import { getIcon } from '@/lib/iconMapping';

interface FavoritesSectionProps {
  items: Array<{
    id: string;
    name: string;
    href: string;
    icon: string | React.ComponentType<{ className?: string }>;
    description?: string;
    color?: string;
  }>;
  pathname: string;
  onToggleFavorite: (id: string) => void;
  showIcons?: boolean;
}

export const FavoritesSection = memo(function FavoritesSection({
  items,
  pathname,
  onToggleFavorite,
  showIcons = true,
}: FavoritesSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center justify-between">
        <div className="flex items-center">
          {showIcons && <Star className="h-4 w-4 mr-2 text-yellow-500" />}
          Favorites
        </div>
      </h2>
      <nav className="space-y-1" aria-label="Favorites">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            <NavigationItem
              name={item.name}
              href={item.href}
              icon={typeof item.icon === 'string' ? getIcon(item.icon) : item.icon}
              description={item.description}
              color={item.color}
              isActive={pathname === item.href}
              isCollapsed={false}
              showIcons={showIcons}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(item.id);
              }}
              title="Remove from favorites"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </nav>
    </div>
  );
});
