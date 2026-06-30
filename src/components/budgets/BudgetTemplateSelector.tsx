'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BudgetTemplate } from '@/lib/types';
import { budgetTemplates, getRecommendedTemplates } from '@/utils/budget-templates';
import { Check, Star, ChevronDown, ChevronUp } from 'lucide-react';

interface BudgetTemplateSelectorProps {
  onSelect: (template: BudgetTemplate) => void;
  selectedTemplate?: BudgetTemplate;
}

export function BudgetTemplateSelector({ onSelect, selectedTemplate }: BudgetTemplateSelectorProps) {
  const [showAll, setShowAll] = useState(false);
  
  const templates = showAll ? budgetTemplates : getRecommendedTemplates();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Choose a Template</h3>
          <p className="text-sm text-muted-foreground">
            Start with a pre-configured budget template
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="gap-2 w-full sm:w-auto"
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Show Recommended
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show All ({budgetTemplates.length})
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50 ${
              selectedTemplate?.id === template.id
                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelect(template)}
          >
            <CardHeader className="pb-3 px-4 sm:px-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base truncate">{template.name}</CardTitle>
                  {template.isRecommended && (
                    <Badge variant="secondary" className="mt-1 text-[10px] sm:text-xs">
                      <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 fill-current" />
                      Recommended
                    </Badge>
                  )}
                </div>
                {selectedTemplate?.id === template.id && (
                  <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 px-4 sm:px-6">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2 border-t">
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold text-primary">
                    ${template.totalBudget.toLocaleString()}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold">
                    {template.allocations.length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-sm sm:text-lg font-bold capitalize">
                    {template.period.slice(0, 3)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Period</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
