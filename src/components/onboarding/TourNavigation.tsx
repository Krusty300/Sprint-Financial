'use client';

import { useState, useEffect } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Menu, 
  X, 
  Play, 
  CheckCircle2, 
  Circle, 
  LayoutDashboard,
  CreditCard,
  Target,
  PieChart,
  Settings,
  ChevronRight,
  BookOpen,
  Map,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TourCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  steps: string[];
  color: string;
}

const TOUR_CATEGORIES: TourCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics and navigate the interface',
    icon: LayoutDashboard,
    steps: ['welcome', 'dashboard-overview'],
    color: 'bg-blue-500',
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'Add and manage your financial transactions',
    icon: CreditCard,
    steps: [],
    color: 'bg-green-500',
  },
  {
    id: 'planning',
    title: 'Planning & Budgets',
    description: 'Set budgets and track your goals',
    icon: Target,
    steps: ['budgets'],
    color: 'bg-purple-500',
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'View insights and generate reports',
    icon: PieChart,
    steps: ['reports'],
    color: 'bg-orange-500',
  },
  {
    id: 'settings',
    title: 'Settings & Customization',
    description: 'Configure your preferences and manage data',
    icon: Settings,
    steps: ['settings'],
    color: 'bg-gray-500',
  },
];

export function TourNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const { 
    steps, 
    currentStepIndex, 
    isActive, 
    startOnboarding, 
    setStepCompleted,
    progress 
  } = useOnboarding();

  const currentStep = steps[currentStepIndex];

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress.percentage]);

  const getCategoryProgress = (category: TourCategory) => {
    const categorySteps = category.steps;
    const completedSteps = categorySteps.filter(stepId => 
      steps.find(s => s.id === stepId)?.completed
    ).length;
    return {
      completed: completedSteps,
      total: categorySteps.length,
      percentage: Math.round((completedSteps / categorySteps.length) * 100)
    };
  };

  const getCurrentCategory = () => {
    if (!currentStep) return null;
    return TOUR_CATEGORIES.find(category => 
      category.steps.includes(currentStep.id)
    );
  };

  const getBreadcrumbs = () => {
    const currentCategory = getCurrentCategory();
    if (!currentCategory) return [];
    
    const currentStepIndexInCategory = currentCategory.steps.indexOf(currentStep.id);
    return currentCategory.steps.slice(0, currentStepIndexInCategory + 1);
  };

  const { jumpToStep: contextJumpToStep } = useOnboarding();

  const jumpToStep = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      // Mark all previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        setStepCompleted(steps[i].id, true);
      }
      
      // Use context's jumpToStep method
      if (!isActive) {
        startOnboarding();
      }
      // Jump to specific step
      setTimeout(() => {
        contextJumpToStep(stepIndex);
      }, 100);
    }
  };

  const startCategory = (category: TourCategory) => {
    const firstStepId = category.steps[0];
    if (firstStepId) {
      jumpToStep(firstStepId);
    }
  };

  if (progress.isCompleted) {
    return null;
  }

  return (
    <>
      {/* Tour Menu Button with theme support */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-4 z-40 bg-background border-2 shadow-lg transition-all duration-300 hover:scale-105"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Tour Guide
        <ChevronRight className={`h-4 w-4 ml-2 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </Button>

      {/* Mini Map Toggle with theme support */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMiniMap(!showMiniMap)}
        className="fixed top-32 right-4 z-40 bg-background border-2 shadow-lg transition-all duration-300 hover:scale-105"
        title="Toggle Tour Mini-Map"
      >
        <Map className="h-4 w-4 mr-2" />
        Mini-Map
      </Button>

      {/* Mini Map */}
      {showMiniMap && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowMiniMap(false)}
          />
          
          {/* Mini Map Panel */}
          <Card className="fixed top-16 right-4 w-72 max-h-[70vh] overflow-y-auto z-50 shadow-2xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Tour Mini-Map
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMiniMap(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Compact Overview */}
              <div className="grid grid-cols-5 gap-1">
                {steps.map((step, index) => {
                  const isCompleted = step.completed;
                  const isCurrent = index === currentStepIndex;
                  const category = TOUR_CATEGORIES.find(cat => cat.steps.includes(step.id));
                  
                  return (
                    <div
                      key={step.id}
                      className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-all duration-300 cursor-pointer hover:scale-110 ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                      }`}
                      onClick={() => {
                        jumpToStep(step.id);
                        setShowMiniMap(false);
                      }}
                      title={step.title}
                      style={{
                        backgroundColor: isCurrent ? undefined : category?.color.replace('bg-', '').replace('-500', '-100')
                      }}
                    >
                      {isCurrent ? (
                        <Play className="h-3 w-3" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Category Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Categories</h4>
                {TOUR_CATEGORIES.map((category) => {
                  const categoryProgress = getCategoryProgress(category);
                  const isCurrentCategory = currentStep && category.steps.includes(currentStep.id);
                  
                  return (
                    <div
                      key={category.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isCurrentCategory ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                      }`}
                      onClick={() => {
                        startCategory(category);
                        setShowMiniMap(false);
                      }}
                    >
                      <category.icon className={`h-4 w-4 ${category.color.replace('bg-', 'text-')}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {categoryProgress.completed}/{categoryProgress.total}
                          </span>
                        </div>
                        <Progress 
                          value={categoryProgress.percentage} 
                          className="h-1 mt-1 transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tour Navigation Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <Card className="fixed top-16 right-4 w-80 max-h-[80vh] overflow-y-auto z-50 shadow-2xl border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Tour Navigation
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Overall Progress with Animation and theme support */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    Overall Progress
                    <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </span>
                  <Badge variant="secondary" className="transition-all duration-500">
                    {animatedProgress}%
                  </Badge>
                </div>
                <Progress 
                  value={animatedProgress} 
                  className="h-2 transition-all duration-500 ease-out"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.completedSteps} of {progress.totalSteps} steps completed
                </p>
              </div>

              {/* Visual Breadcrumbs with theme support */}
              {currentStep && (
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                    Current Path
                    <ArrowRight className="h-3 w-3" />
                  </h4>
                  <div className="flex items-center gap-1 flex-wrap">
                    {getBreadcrumbs().map((stepId, index) => {
                      const step = steps.find(s => s.id === stepId);
                      const isCurrentStep = step?.id === currentStep.id;
                      return (
                        <div key={stepId} className="flex items-center">
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-300 ${
                              isCurrentStep
                                ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {step?.title || stepId}
                          </div>
                          {index < getBreadcrumbs().length - 1 && (
                            <ChevronRight className="h-3 w-3 mx-1 text-primary/60" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Jump to Section</h4>
                
                {TOUR_CATEGORIES.map((category) => {
                  const categoryProgress = getCategoryProgress(category);
                  const isCurrentCategory = currentStep && category.steps.includes(currentStep.id);
                  
                  return (
                    <div
                      key={category.id}
                      className={`p-3 rounded-lg border transition-all duration-300 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                        isCurrentCategory 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => startCategory(category)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${category.color} bg-opacity-10`}>
                          <category.icon className={`h-4 w-4 text-${category.color.split('-')[1]}-500`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="text-sm font-medium truncate">{category.title}</h5>
                            {categoryProgress.completed > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {categoryProgress.percentage}%
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {category.description}
                          </p>
                          
                          {/* Category Progress with Animation */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>Progress</span>
                              <span>{categoryProgress.completed}/{categoryProgress.total}</span>
                            </div>
                            <Progress 
                              value={categoryProgress.percentage} 
                              className="h-1 transition-all duration-500 ease-out"
                            />
                          </div>
                          
                          {/* Individual Steps */}
                          <div className="mt-2 space-y-1">
                            {category.steps.map((stepId, index) => {
                              const step = steps.find(s => s.id === stepId);
                              const isCompleted = step?.completed;
                              const isCurrentStep = step?.id === currentStep?.id;
                              
                              return (
                                <div
                                  key={stepId}
                                  className={`flex items-center gap-2 p-1 rounded text-xs cursor-pointer transition-all duration-200 ${
                                    isCurrentStep 
                                      ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                                      : isCompleted 
                                      ? 'text-muted-foreground' 
                                      : 'hover:bg-muted hover:scale-[1.02]'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    jumpToStep(stepId);
                                  }}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600 animate-pulse" />
                                  ) : (
                                    <Circle className="h-3 w-3" />
                                  )}
                                  <span className="flex-1 truncate">
                                    {step?.title || stepId}
                                  </span>
                                  {isCurrentStep && (
                                    <Play className="h-3 w-3" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t space-y-2">
                <Button
                  onClick={() => {
                    startOnboarding();
                    setIsOpen(false);
                  }}
                  className="w-full"
                  disabled={isActive}
                >
                  {isActive ? 'Tour in Progress' : 'Start Full Tour'}
                </Button>
                
                {progress.percentage > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="w-full"
                  >
                    Close Guide
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
