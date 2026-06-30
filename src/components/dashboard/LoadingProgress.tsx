import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress: number;
  message?: string;
  className?: string;
}

export function LoadingProgress({ progress, message, className }: LoadingProgressProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-8 px-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <div className="w-full max-w-xs space-y-3">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            {message || `Loading... ${Math.round(progress)}%`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
