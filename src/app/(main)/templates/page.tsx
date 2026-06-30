'use client';

import { useState } from 'react';
import { TemplateManager } from '@/components/templates/TemplateManager';
import { TransactionTemplate } from '@/lib/types';
import { useTransactionTemplates } from '@/hooks/useTransactionTemplates';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TemplatesErrorBoundary } from '@/components/error/TemplatesErrorBoundary';
import { validateTemplateUsage } from '@/utils/templateValidation';
import { FavoriteButton } from '@/components/layout/FavoriteButton';

export default function TemplatesPage() {
  const { useTemplate } = useTransactionTemplates();
  const router = useRouter();
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  const handleUseTemplate = async (template: TransactionTemplate) => {
    // Prevent duplicate clicks
    if (loadingTemplateId === template.id) {
      return;
    }

    try {
      setLoadingTemplateId(template.id);
      
      // Validate template before usage
      const errors = validateTemplateUsage(template);
      if (errors.length > 0) {
        toast.error('Template cannot be used: ' + errors.map(e => e.message).join(', '));
        return;
      }

      const transaction = await useTemplate(template);
      
      // Navigate to transactions page with pre-filled data
      const params = new URLSearchParams({
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        ...(transaction.account && { account: transaction.account }),
        ...(transaction.tags && transaction.tags.length > 0 && { tags: transaction.tags.join(',') }),
      });
      
      router.push(`/transactions?${params.toString()}`);
      toast.success('Template applied! Complete the transaction details.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error('Failed to use template: ' + errorMessage);
    } finally {
      setLoadingTemplateId(null);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction Templates</h1>
          <p className="text-muted-foreground">
            Create and manage transaction templates for quick entry
          </p>
        </div>
        <FavoriteButton size="sm" variant="outline" showLabel={false} />
      </div>
      <TemplatesErrorBoundary>
        <TemplateManager onUseTemplate={handleUseTemplate} />
      </TemplatesErrorBoundary>
    </div>
  );
}
