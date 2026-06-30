'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFormatting } from '@/contexts/FormattingContext';
import { Calendar, DollarSign, Hash } from 'lucide-react';

export function FormattingPreview() {
  const { formatCurrency, currency, getCurrencySymbol } = useCurrency();
  const { dateFormat, numberFormat, formatDate, formatNumber } = useFormatting();

  const sampleDate = new Date();
  const sampleAmount = 1234.56;
  const sampleNumber = 98765.43;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Formatting Preview
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          See how your formatting settings will appear throughout the application
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Formatting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Currency Formatting</h4>
            <Badge variant="outline">{currency}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Income</p>
              <p className="text-lg font-bold text-green-600">
                +{formatCurrency(sampleAmount)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Expense</p>
              <p className="text-lg font-bold text-red-600">
                -{formatCurrency(sampleAmount)}
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-lg font-bold">
                {formatCurrency(sampleAmount * 2)}
              </p>
            </div>
          </div>
        </div>

        {/* Date Formatting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Date Formatting</h4>
            <Badge variant="outline">{dateFormat}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-lg font-bold">{formatDate(sampleDate)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Sample Dates</p>
              <div className="space-y-1 text-sm">
                <p>{formatDate(new Date('2024-01-15'))}</p>
                <p>{formatDate(new Date('2024-12-31'))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Number Formatting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Number Formatting</h4>
            <Badge variant="outline">{numberFormat}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Sample Number</p>
              <p className="text-lg font-bold">{formatNumber(sampleNumber)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Large Number</p>
              <p className="text-lg font-bold">{formatNumber(1234567.89)}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Decimal</p>
              <p className="text-lg font-bold">{formatNumber(3.14159)}</p>
            </div>
          </div>
        </div>

        {/* Combined Example */}
        <div className="space-y-3">
          <h4 className="font-medium">Combined Example</h4>
          <div className="p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Salary Income</span>
                <span className="font-bold text-green-600">
                  +{formatCurrency(5000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Rent Expense</span>
                <span className="font-bold text-red-600">
                  -{formatCurrency(1200)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Groceries</span>
                <span className="font-bold text-red-600">
                  -{formatCurrency(234.56)}
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Net</span>
                  <span className="font-bold">
                    {formatCurrency(3565.44)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Last updated: {formatDate(sampleDate)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
