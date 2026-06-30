'use client';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Play, RotateCcw, Trophy } from 'lucide-react';

export function OnboardingProgress() {
  const {
    progress,
    steps,
    startOnboarding,
    resetOnboarding,
    isActive,
  } = useOnboarding();

  if (progress.isCompleted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Trophy className="h-5 w-5 text-green-600" />
            Onboarding Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-700">
              Congratulations! You've completed the onboarding tour.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetOnboarding}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset Tour
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Onboarding Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              Overall Progress
            </span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {progress.percentage}%
            </Badge>
          </div>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-blue-700">
            {progress.completedSteps} of {progress.totalSteps} steps completed
          </p>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-900">Tour Steps</h4>
          <div className="space-y-1">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  index === progress.currentStep - 1 && isActive
                    ? 'bg-blue-100 border border-blue-300'
                    : 'hover:bg-blue-50'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {step.content.substring(0, 50)}...
                  </p>
                </div>
                {index === progress.currentStep - 1 && isActive && (
                  <Badge variant="default" className="bg-blue-600 text-white text-xs">
                    Current
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isActive && progress.percentage < 100 && (
            <Button
              onClick={startOnboarding}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-1" />
              {progress.completedSteps > 0 ? 'Resume Tour' : 'Start Tour'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={resetOnboarding}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or minimal spaces
export function OnboardingProgressCompact() {
  const { progress, startOnboarding, isActive } = useOnboarding();

  if (progress.isCompleted) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
        <Trophy className="h-4 w-4 text-green-600" />
        <span className="text-xs font-medium text-green-800">Tour Complete</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">Tour Progress</span>
        <span className="text-xs text-gray-500">{progress.percentage}%</span>
      </div>
      <Progress value={progress.percentage} className="h-1" />
      {!isActive && progress.percentage < 100 && (
        <Button
          onClick={startOnboarding}
          variant="ghost"
          size="sm"
          className="w-full h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          {progress.completedSteps > 0 ? 'Resume' : 'Start'} Tour
        </Button>
      )}
    </div>
  );
}
