'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Account } from '@/lib/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AlertTriangle, CreditCard, Wallet, DollarSign, Smartphone, Loader2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onConfirm: () => void;
  isDeleting?: boolean;
}

const accountTypeIcons = {
  cash: Wallet,
  bank: DollarSign,
  credit: CreditCard,
  mobile: Smartphone,
};

export function DeleteAccountDialog({
  open,
  onOpenChange,
  account,
  onConfirm,
  isDeleting = false,
}: DeleteAccountDialogProps) {
  const { formatCurrency } = useCurrency();
  if (!account) return null;

  const Icon = accountTypeIcons[account.type];
  const isCredit = account.type === 'credit';
  const hasBalance = account.balance !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="delete-account-dialog-description">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Account</DialogTitle>
          </div>
          <DialogDescription id="delete-account-dialog-description">
            Are you sure you want to delete "{account.name}"? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isCredit ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
                <Icon className={`h-5 w-5 ${isCredit ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div className="flex-1">
                <div className="font-medium">{account.name}</div>
                <div className="text-sm text-muted-foreground capitalize">{account.type} account</div>
              </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className={`font-medium ${hasBalance ? (isCredit ? 'text-red-600' : 'text-green-600') : 'text-muted-foreground'}`}>
                  {isCredit && account.balance > 0 ? '-' : ''}
                  {formatCurrency(Math.abs(account.balance))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">{account.currency}</span>
              </div>
            </div>
          </div>

          {hasBalance && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-600">
                  <p className="font-medium">Warning</p>
                  <p className="text-xs mt-1">
                    This account has a remaining balance. Deleting it will remove this balance from your records.
                    {isCredit && account.balance > 0 && ' Make sure to pay off this debt before deleting.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
