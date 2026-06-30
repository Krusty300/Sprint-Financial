import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WidgetSkeletonProps {
  type: 'card' | 'chart' | 'list' | 'heatmap' | 'progress';
  className?: string;
  height?: string;
}

export function WidgetSkeleton({ type, className, height = 'h-48' }: WidgetSkeletonProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {type === 'card' && (
          <div className="space-y-3">
            <Skeleton className="h-8 w-24" />
            <Skeleton className={cn('w-full', height)} />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        )}
        
        {type === 'chart' && (
          <div className="space-y-4">
            <Skeleton className={cn('w-full', height)} />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
        
        {type === 'list' && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        )}
        
        {type === 'heatmap' && (
          <div className="space-y-3">
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1" />
              ))}
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1" />
              ))}
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-16 flex-1" />
              ))}
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        )}
        
        {type === 'progress' && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
