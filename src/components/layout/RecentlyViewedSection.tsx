'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/components/performance/OptimizedComponents';
import { getIcon } from '@/lib/iconMapping';

interface RecentlyViewedSectionProps {
  items: Array<{
    id: string;
    name: string;
    href: string;
    icon: string | React.ComponentType<{ className?: string }>;
    description?: string;
    color?: string;
  }>;
  pathname: string;
  showIcons?: boolean;
  onClearRecentlyViewed?: () => void;
}

export const RecentlyViewedSection = memo(function RecentlyViewedSection({
  items,
  pathname,
  showIcons = true,
  onClearRecentlyViewed,
}: RecentlyViewedSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-3 py-2">
      <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight flex items-center justify-between">
        <div className="flex items-center">
          {showIcons && <Clock className="h-4 w-4 mr-2 text-blue-500" />}
          Recently Viewed
        </div>
        {onClearRecentlyViewed && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={onClearRecentlyViewed}
            title="Clear recently viewed"
            aria-label="Clear recently viewed"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </h2>
      <nav className="space-y-1" aria-label="Recently viewed">
        {items.map((item) => (
          <NavigationItem
            key={item.id}
            name={item.name}
            href={item.href}
            icon={typeof item.icon === 'string' ? getIcon(item.icon) : item.icon}
            description={item.description}
            color={item.color}
            isActive={pathname === item.href}
            isCollapsed={false}
            showIcons={showIcons}
          />
        ))}
      </nav>
    </div>
  );
});
