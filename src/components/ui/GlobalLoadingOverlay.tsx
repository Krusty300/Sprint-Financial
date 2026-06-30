'use client';

import { useEffect } from 'react';
import { useGlobalLoading } from '@/contexts/GlobalLoadingContext';
import { PageLoader } from '@/components/loading/PageLoader';

export function GlobalLoadingOverlay() {
  const { globalLoading } = useGlobalLoading();

  // Auto-hide loading after 10 seconds as a safety measure
  useEffect(() => {
    if (globalLoading.isLoading) {
      const timeout = setTimeout(() => {
        // This would be handled by the context provider
        console.warn('Global loading state was active for more than 10 seconds');
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [globalLoading.isLoading]);

  if (!globalLoading.isLoading) {
    return null;
  }

  return (
    <PageLoader
      isLoading={globalLoading.isLoading}
      title={globalLoading.operation || 'Loading'}
      message={globalLoading.message || 'Please wait...'}
      progress={globalLoading.progress || 0}
      stage={globalLoading.message || 'Processing...'}
    />
  );
}
