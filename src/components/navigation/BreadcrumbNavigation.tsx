'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbNavigationProps {
  className?: string;
  currentPage?: string;
  additionalItems?: BreadcrumbItem[];
}

const routeLabels: Record<string, { label: string; icon?: React.ComponentType<{ className?: string }> }> = {
  '/dashboard': { label: 'Dashboard', icon: Home },
  '/transactions': { label: 'Transactions' },
  '/budgets': { label: 'Budgets' },
  '/accounts': { label: 'Accounts' },
  '/reports': { label: 'Reports' },
  '/settings': { label: 'Settings' },
};

export function BreadcrumbNavigation({ 
  className, 
  currentPage,
  additionalItems = [] 
}: BreadcrumbNavigationProps) {
  const pathname = usePathname();
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard', icon: Home }
    ];

    // Add current page
    if (pathname && pathname !== '/dashboard') {
      const routeInfo = routeLabels[pathname];
      if (routeInfo) {
        breadcrumbs.push({
          label: currentPage || routeInfo.label,
          href: pathname,
          icon: routeInfo.icon
        });
      }
    }

    // Add additional items (for dynamic pages like transaction details)
    breadcrumbs.push(...additionalItems);

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const Icon = item.icon;

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
            )}
            
            {isLast ? (
              <span className="font-medium text-foreground flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="flex items-center hover:text-foreground transition-colors"
              >
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Hook for generating dynamic breadcrumbs
export function useDynamicBreadcrumbs() {
  const pathname = usePathname();
  
  const getTransactionBreadcrumbs = (transactionId?: string, description?: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    
    if (transactionId) {
      items.push({
        label: 'Transaction Details',
        href: pathname,
      });
      
      if (description) {
        items.push({
          label: description,
          href: pathname,
        });
      }
    }
    
    return items;
  };

  const getAccountBreadcrumbs = (accountId?: string, accountName?: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    
    if (accountId && accountName) {
      items.push({
        label: accountName,
        href: pathname,
      });
    }
    
    return items;
  };

  const getReportBreadcrumbs = (reportType?: string, reportName?: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    
    if (reportType) {
      items.push({
        label: reportType.charAt(0).toUpperCase() + reportType.slice(1),
        href: pathname,
      });
    }
    
    if (reportName) {
      items.push({
        label: reportName,
        href: pathname,
      });
    }
    
    return items;
  };

  return {
    getTransactionBreadcrumbs,
    getAccountBreadcrumbs,
    getReportBreadcrumbs,
  };
}
