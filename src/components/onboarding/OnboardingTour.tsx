'use client';

import { useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, ArrowLeft, ArrowRight, SkipForward, Play, Sparkles, Settings, HelpCircle, Zap, Clock } from 'lucide-react';
import { findTargetElement, scrollToElement, addHighlightClass, removeHighlightClass, getElementRect } from '@/utils/domHelpers';

// Contextual help messages for each step
const getContextualHelp = (stepId: string): string => {
  const helpMessages: Record<string, string> = {
    'welcome': 'Take your time to explore each feature. You can always return to this tour later from the Tour Guide menu.',
    'dashboard-overview': 'Your dashboard updates in real-time. Check back daily to track your financial progress.',
    'sidebar-navigation': 'You can collapse the sidebar for more screen space or customize it in Settings.',
    'transactions-page': 'Filter and sort transactions to find specific entries quickly. Export data for tax purposes.',
    'budgets': 'Set realistic budgets and track your spending habits. Adjust monthly based on your needs.',
    'reports': 'Generate monthly reports to share with financial advisors or for personal tracking.',
    'accounts': 'Connect all your financial accounts in one place. Track balances and monitor account health.',
    'banking': 'Securely link your bank accounts for automatic transaction imports and real-time updates.',
    'notifications': 'Stay on top of your finances with smart alerts for budget limits, unusual spending, and more.',
    'templates': 'Save time with templates for recurring bills, subscriptions, and regular income sources.',
    'recycle-bin': 'Safety net for accidental deletions. Items are kept for 30 days before permanent removal.',
    'settings': 'Customize your experience with themes, notifications, keyboard shortcuts, and data management.'
  };
  
  return helpMessages[stepId] || 'Explore this feature at your own pace. Click Next when you\'re ready to continue.';
};

export function OnboardingTour() {
  const {
    isActive,
    currentStepIndex,
    steps,
    progress,
    nextStep,
    previousStep,
    skipOnboarding,
    pauseOnboarding,
    completeStep,
  } = useOnboarding();

  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tourSpeed, setTourSpeed] = useState<'slow' | 'normal' | 'fast'>(() => {
  // Load tour speed from localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('onboarding-tour-speed');
    return saved ? (saved as 'slow' | 'normal' | 'fast') : 'normal';
  }
  return 'normal';
});
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [showCustomization, setShowCustomization] = useState(false);
  const [userInteractions, setUserInteractions] = useState(0);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());

  const currentStep = steps[currentStepIndex];

  // Persist tour speed to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding-tour-speed', tourSpeed);
    }
  }, [tourSpeed]);

  // Reset manual speed flag when starting a new tour
  useEffect(() => {
    if (isActive && currentStepIndex === 0) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding-tour-speed-manual');
      }
    }
  }, [isActive, currentStepIndex]);

  // Adaptive pacing - adjust tour speed based on user interactions
  useEffect(() => {
    const currentTime = Date.now();
    const timeSinceLastInteraction = currentTime - lastInteractionTime;
    
    // Only auto-adjust if user hasn't manually set speed
    const hasManualSpeedChange = localStorage.getItem('onboarding-tour-speed-manual');
    if (!hasManualSpeedChange) {
      // If user is interacting quickly, speed up the tour
      if (timeSinceLastInteraction < 2000 && userInteractions > 3) {
        setTourSpeed('fast');
      } else if (timeSinceLastInteraction > 10000 && userInteractions < 2) {
        setTourSpeed('slow');
      } else {
        setTourSpeed('normal');
      }
    }
  }, [userInteractions, lastInteractionTime]);

  // Smart positioning - calculate best position for tooltip
  const calculateOptimalPosition = (rect: DOMRect) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 350;
    const tooltipHeight = 200;
    
    // Calculate available space
    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;
    
    // Determine best position based on available space
    if (spaceBelow >= tooltipHeight + 20) return 'bottom';
    if (spaceAbove >= tooltipHeight + 20) return 'top';
    if (spaceRight >= tooltipWidth + 20) return 'right';
    if (spaceLeft >= tooltipWidth + 20) return 'left';
    
    // Default to bottom if none have enough space
    return 'bottom';
  };

  // Find and highlight target element with enhanced effects
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      setHighlightRect(null);
      return;
    }

    setIsAnimating(true);
    const element = findTargetElement(currentStep.target);
    if (element) {
      setTargetElement(element);
      const rect = getElementRect(element);
      setHighlightRect(rect);
      
      // Calculate smart positioning
      if (rect) {
        const optimalPosition = calculateOptimalPosition(rect);
        setPosition(optimalPosition);
      }

      // Scroll element into view with smooth behavior
      scrollToElement(element);

      // Add enhanced highlight class with animation
      addHighlightClass(element);
      
      // Trigger animation with adaptive timing
      const animationDuration = tourSpeed === 'fast' ? 200 : tourSpeed === 'slow' ? 800 : 400;
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), animationDuration);
      
      return () => {
        removeHighlightClass(element);
      };
    } else {
      console.warn(`Tour target element not found: ${currentStep.target}`);
      setIsAnimating(false);
    }
  }, [isActive, currentStep, currentStepIndex, tourSpeed]);

  if (!isActive || !currentStep) {
    return null;
  }

  const handleNext = () => {
    completeStep(currentStep.id);
    // Track user interaction for adaptive pacing
    setUserInteractions(prev => prev + 1);
    setLastInteractionTime(Date.now());
    
    // Adaptive delay based on tour speed
    const delay = tourSpeed === 'fast' ? 100 : tourSpeed === 'slow' ? 600 : 300;
    setTimeout(() => nextStep(), delay);
  };

  const handlePrevious = () => {
    setUserInteractions(prev => prev + 1);
    setLastInteractionTime(Date.now());
    previousStep();
  };

  const handleSkip = () => {
    setUserInteractions(prev => prev + 1);
    setLastInteractionTime(Date.now());
    skipOnboarding();
  };

  const handlePause = () => {
    setUserInteractions(prev => prev + 1);
    setLastInteractionTime(Date.now());
    pauseOnboarding();
  };

  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 pointer-events-none" />
      
      {/* Enhanced Highlight overlay with theme support */}
      {highlightRect && (
        <>
          {/* Pulsing ring effect */}
          <div
            className={`absolute border-4 rounded-lg shadow-2xl z-40 pointer-events-none transition-all duration-500 ${
              isAnimating ? 'animate-pulse scale-110' : 'scale-100'
            } border-primary`}
            style={{
              top: highlightRect.top - 12,
              left: highlightRect.left - 12,
              width: highlightRect.width + 24,
              height: highlightRect.height + 24,
              boxShadow: 'var(--glow-shadow), 0 0 20px var(--primary-foreground/20)'
            }}
          />
          
          {/* Inner glow effect */}
          <div
            className="absolute bg-primary/20 rounded-lg z-39 pointer-events-none transition-all duration-300"
            style={{
              top: highlightRect.top - 8,
              left: highlightRect.left - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
            }}
          />
          
          {/* Animated corner accents */}
          {isAnimating && (
            <>
              <div className="absolute w-4 h-4 border-t-2 border-l-2 border-primary z-41 pointer-events-none animate-ping"
                style={{ top: highlightRect.top - 10, left: highlightRect.left - 10 }}
              />
              <div className="absolute w-4 h-4 border-t-2 border-r-2 border-primary z-41 pointer-events-none animate-ping"
                style={{ top: highlightRect.top - 10, left: highlightRect.right + 6 }}
              />
              <div className="absolute w-4 h-4 border-b-2 border-l-2 border-primary z-41 pointer-events-none animate-ping"
                style={{ top: highlightRect.bottom + 6, left: highlightRect.left - 10 }}
              />
              <div className="absolute w-4 h-4 border-b-2 border-r-2 border-primary z-41 pointer-events-none animate-ping"
                style={{ top: highlightRect.bottom + 6, left: highlightRect.right + 6 }}
              />
            </>
          )}
        </>
      )}

      {/* Enhanced Tour tooltip with smooth animations */}
      <div
        className={`fixed z-50 max-w-sm transition-all duration-500 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          top: highlightRect 
            ? position === 'top' 
              ? highlightRect.top - 220
              : position === 'bottom'
              ? highlightRect.bottom + 20
              : highlightRect.top
            : '50%',
          left: highlightRect
            ? position === 'left'
              ? highlightRect.left - 370
              : position === 'right'
              ? highlightRect.right + 20
              : highlightRect.left + highlightRect.width / 2 - 175
            : '50%',
          transform: !highlightRect ? 'translate(-50%, -50%)' : undefined,
        }}
      >
        <Card className="shadow-2xl border-2 transition-all duration-300 hover:shadow-lg border-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-foreground">
                {currentStep.title}
                {isAnimating && <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePause}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 leading-relaxed">
              {currentStep.content}
            </p>
            
            {/* Contextual Help with theme support */}
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 text-xs text-primary mb-1">
                <HelpCircle className="h-3 w-3" />
                <span className="font-medium">Pro Tip</span>
              </div>
              <p className="text-xs text-primary/80">
                {getContextualHelp(currentStep.id)}
              </p>
            </div>
            
            {/* Tour Speed Indicator with theme support */}
            <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                <span>Tour Speed:</span>
              </div>
              <Badge 
                variant={tourSpeed === 'fast' ? 'default' : tourSpeed === 'slow' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {tourSpeed === 'fast' ? 'Fast' : tourSpeed === 'slow' ? 'Slow' : 'Normal'}
              </Badge>
            </div>
            
            {/* Enhanced Progress bar with animations */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Step {progress.currentStep} of {progress.totalSteps}</span>
                <span className="font-medium text-primary">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2 transition-all duration-500" />
            </div>

            {/* Enhanced Action buttons with hover effects */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-xs transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" />
                    Previous
                  </Button>
                )}
                
                {/* Customization Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="text-xs transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                  title="Customize Tour"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-xs text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
                >
                  <SkipForward className="h-3 w-3 mr-1" />
                  Skip Tour
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="text-xs bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg text-primary-foreground"
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ArrowRight className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
            
            {/* Tour Customization Panel with theme support */}
            {showCustomization && (
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Settings className="h-4 w-4" />
                  Customize Tour
                </h4>
                
                {/* Speed Control */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Tour Speed</label>
                  <div className="flex gap-1">
                    {(['slow', 'normal', 'fast'] as const).map((speed) => (
                      <Button
                        key={speed}
                        variant={tourSpeed === speed ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setTourSpeed(speed);
                          // Mark that user manually changed speed
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('onboarding-tour-speed-manual', 'true');
                          }
                        }}
                        className="text-xs flex-1"
                      >
                        {speed === 'slow' && <Clock className="h-3 w-3 mr-1" />}
                        {speed === 'fast' && <Zap className="h-3 w-3 mr-1" />}
                        {speed.charAt(0).toUpperCase() + speed.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Section Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">Focus Sections</label>
                  <div className="grid grid-cols-2 gap-1">
                    {['Getting Started', 'Transactions', 'Planning', 'Analytics'].map((section) => (
                      <Button
                        key={section}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {section}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </>
  );
}

// Floating trigger button for starting onboarding
export function OnboardingTrigger() {
  const { isActive, startOnboarding, progress } = useOnboarding();

  if (isActive || progress.isCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={startOnboarding}
        size="sm"
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2"
      >
        <Play className="h-4 w-4" />
        <span className="text-sm font-medium">Take a Tour</span>
      </Button>
    </div>
  );
}
