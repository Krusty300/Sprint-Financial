'use client';

import { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { getOnboardingStorage } from '@/utils/storageHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, SkipForward, Play, Settings, HelpCircle } from 'lucide-react';

export function OnboardingSkip() {
  const { resetOnboarding, progress, isActive } = useOnboarding();
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [hasSkipped, setHasSkipped] = useState(false);

  useEffect(() => {
    const storage = getOnboardingStorage();
    const hasSkippedOnboarding = storage.getSkipped();
    setHasSkipped(!!hasSkippedOnboarding);
  }, []);

  const handleSkipTour = () => {
    const storage = getOnboardingStorage();
    storage.setSkipped(true);
    storage.setWelcomeSeen(true);
    setHasSkipped(true);
    setShowSkipDialog(false);
  };

  const handleUnskipTour = () => {
    const storage = getOnboardingStorage();
    storage.setSkipped(false);
    setHasSkipped(false);
    resetOnboarding();
  };

  const showSkipOption = !hasSkipped && progress.completedSteps === 0 && !progress.isCompleted && !isActive;

  if (!showSkipOption) {
    return null;
  }

  return (
    <>
      {/* Skip Tour Button for new users */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSkipDialog(true)}
        className="fixed top-32 right-4 z-40 bg-background border-2 shadow-lg"
      >
        <SkipForward className="h-4 w-4 mr-2" />
        Skip Tour
      </Button>

      {/* Skip Confirmation Dialog */}
      {showSkipDialog && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowSkipDialog(false)}
          />
          
          {/* Dialog */}
          <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 max-w-[90vw] z-50 shadow-2xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {hasSkipped ? 'Tour Options' : 'Skip Onboarding Tour?'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSkipDialog(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to skip the onboarding tour? You can always start it later from:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Settings → Onboarding Progress</li>
                  <li>• Tour Guide button (top-right)</li>
                  <li>• The "Start Tour" button that appears</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  What you'll miss:
                </h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Quick overview of key features</li>
                  <li>• Tips for efficient navigation</li>
                  <li>• Best practices for tracking finances</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSkipDialog(false)}
                  className="flex-1"
                >
                  Keep Tour
                </Button>
                <Button
                  onClick={handleSkipTour}
                  className="flex-1"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip Tour
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
