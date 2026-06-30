'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { GlobalSearchSimple } from '@/components/search/GlobalSearchSimple';
import { BreadcrumbNavigation } from '@/components/navigation/BreadcrumbNavigation';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ToastNotifications } from '@/components/notifications/NotificationSystem';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { OnboardingTour, OnboardingTrigger, OnboardingNotifications, OnboardingHints, FeatureDiscoveryNotifications, TourNavigation } from '@/components/onboarding/index';
import { Button } from '@/components/ui/button';
import { QuickAddModal } from '@/components/forms/QuickAddModal';
import { KeyboardShortcutsHelp } from '@/components/help/KeyboardShortcutsHelp';
import { QuickAddProvider, useQuickAdd } from '@/contexts/QuickAddContext';
import { Menu, Eye, EyeOff, ChevronRight, Search, Plus, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { AppErrorBoundary } from '@/components/error/AppErrorBoundary';
import { PageLoader, PageSkeleton } from '@/components/loading/PageLoader';
import { useDataLoader } from '@/hooks/useDataLoader';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PageTransitionWrapper } from '@/components/ui/PageTransitionWrapper';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuickAddProvider>
      <MainLayoutContent children={children} />
    </QuickAddProvider>
  );
}

function MainLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showSidebarIcons, setShowSidebarIcons] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { isOpen: isQuickAddOpen, openQuickAdd, closeQuickAdd } = useQuickAdd();
  const [isPageLoading, setIsPageLoading] = useState(false);
  
  // Initialize data loading system
  const { isAnyLoading } = useDataLoader();

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    onQuickAdd: openQuickAdd,
    onSearchFocus: () => {
      if ((window as any).openGlobalSearch) {
        (window as any).openGlobalSearch();
      }
    },
    onToggleSearch: () => {
      if ((window as any).openGlobalSearch) {
        (window as any).openGlobalSearch();
      }
    },
    onClose: () => {
      // Close quick add modal if open
      if (isQuickAddOpen) {
        closeQuickAdd();
      }
    }
  });

  // Load sidebar state from localStorage on mount and detect mobile
  useEffect(() => {
    const loadState = () => {
      const savedState = localStorage.getItem('sidebar-collapsed');
      if (savedState !== null) {
        setIsSidebarCollapsed(JSON.parse(savedState));
      }
      
      const savedIconsState = localStorage.getItem('sidebar-show-icons');
      if (savedIconsState !== null) {
        setShowSidebarIcons(JSON.parse(savedIconsState));
      } else {
        // Default to false and save to localStorage
        setShowSidebarIcons(false);
        localStorage.setItem('sidebar-show-icons', 'false');
      }
      
      // Detect mobile
      const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
      
      setIsLoaded(true);
    };

    loadState();
  }, []);

  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed, isLoaded]);

  // Save icons state to localStorage when it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('sidebar-show-icons', JSON.stringify(showSidebarIcons));
  }, [showSidebarIcons, isLoaded]);

  // Add keyboard shortcut and resize listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isMobile) {
          setIsMobileSidebarOpen(!isMobileSidebarOpen);
        } else {
          toggleSidebar();
        }
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !isSidebarCollapsed) {
        setIsSidebarCollapsed(true);
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSidebarCollapsed, isMobile, isMobileSidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const toggleIcons = () => {
    setShowSidebarIcons(!showSidebarIcons);
  };

  // Simulate page loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000); // Show loading for 1 second
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={isMobile ? false : isSidebarCollapsed} 
        onToggle={toggleSidebar} 
        showIcons={showSidebarIcons}
        isMobile={isMobile}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onCloseMobileSidebar={closeMobileSidebar}
      />
      <main className={cn(
        "flex-1 overflow-hidden relative flex flex-col",
        "will-change-transform",
        "z-30", // Ensure main content is above sidebar but below other overlays
        "h-screen", // Ensure main content takes full height
        // Mobile adjustments
        isMobile && "md:hidden", // Hide on mobile when sidebar is open as overlay
        !isMobile && isSidebarCollapsed && "ml-0" // No margin when collapsed on desktop
      )}>
        {/* Global Search */}
        <GlobalSearchSimple />
        
        {/* Mobile Menu Button - Always visible on mobile */}
        {isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "fixed top-4 left-4 z-50 h-12 w-12 p-0", // Larger for better touch
              "shadow-lg bg-background border-2 border-border/50",
              "group transition-all duration-200 hover:scale-105", // Smooth hover effect
              "touch-manipulation-none" // Prevent zoom on touch
            )}
            title="Toggle Sidebar Menu"
            aria-label="Toggle sidebar menu"
          >
            <Menu className={cn(
              "h-6 w-6 transition-transform duration-200 group-hover:rotate-90" // Animated icon
            )} />
          </Button>
        )}
        
        {/* Desktop floating toggle button */}
        {!isMobile && isSidebarCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "fixed top-6 left-6 z-50 h-12 w-12 p-0", // Consistent size
              "shadow-lg bg-background border-2 border-border/50",
              "group transition-all duration-200 hover:scale-105 hover:shadow-xl", // Enhanced hover
              // Responsive positioning
              "sm:top-4 sm:left-4 sm:h-10 sm:w-10", // Smaller on small screens
              "md:top-4 md:left-4 md:h-10 md:w-10", // Consistent medium size
              "touch-manipulation-none" // Prevent zoom on touch
            )}
            title="Toggle Sidebar (Ctrl/Cmd + B)"
            aria-label="Toggle sidebar"
          >
            <ChevronRight className={cn(
              "h-6 w-6 transition-transform duration-200 group-hover:translate-x-0.5", // Animated icon
              "sm:h-5 sm:w-5 md:h-5 md:w-5" // Consistent icon sizing
            )} />
          </Button>
        )}
        
        {/* Breadcrumb Navigation */}
        <div className={cn(
          "flex-shrink-0 z-10 bg-background/95 backdrop-blur-sm border-b",
          "p-3 sm:p-4",
          // Add left padding when sidebar is collapsed to avoid overlap with floating toggle
          !isMobile && isSidebarCollapsed && "pl-20 sm:pl-16", // Only on desktop
          // Add proper padding for mobile menu button (larger button now)
          isMobile && "pl-20 sm:pl-20", // Space for larger mobile menu button
          "transition-all duration-200" // Smooth spacing transitions
        )}>
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <BreadcrumbNavigation />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 ml-2">
              {/* Desktop Search Button */}
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if ((window as any).openGlobalSearch) {
                      (window as any).openGlobalSearch();
                    }
                  }}
                  className="relative"
                  aria-label="Search (Ctrl+K)"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Search</span>
                  <kbd className={cn(
                    "ml-auto px-1.5 py-0.5 text-xs rounded border transition-colors duration-200",
                    resolvedTheme === 'dark'
                      ? "bg-background/80 border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                      : "bg-background border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    Ctrl+K
                  </kbd>
                </Button>
              </div>
              
              {/* Desktop Quick Add Button */}
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openQuickAdd}
                  className="relative"
                  aria-label="Quick Add Transaction (Ctrl+Q)"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Quick Add</span>
                  <kbd className={cn(
                    "ml-auto px-1.5 py-0.5 text-xs rounded border transition-colors duration-200",
                    resolvedTheme === 'dark'
                      ? "bg-background/80 border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                      : "bg-background border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    Ctrl+Q
                  </kbd>
                </Button>
              </div>
              
              {/* Desktop Help Button */}
              <div className="hidden md:block">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsKeyboardHelpOpen(true)}
                  className="relative"
                  aria-label="Keyboard Shortcuts Help"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden lg:inline ml-2">Shortcuts</span>
                  <kbd className={cn(
                    "ml-auto px-1.5 py-0.5 text-xs rounded border transition-colors duration-200",
                    resolvedTheme === 'dark'
                      ? "bg-background/80 border-border/50 text-muted-foreground hover:bg-background hover:text-foreground"
                      : "bg-background border-border/40 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                    ?
                  </kbd>
                </Button>
              </div>
              
              <ConnectionStatus />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleIcons}
                className="h-8 w-8 p-0 transition-colors duration-200"
                title={showSidebarIcons ? "Hide Sidebar Icons" : "Show Sidebar Icons"}
              >
                {showSidebarIcons ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <NotificationCenter />
              <ThemeToggle />
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <AppErrorBoundary>
            <Suspense 
              fallback={<PageSkeleton />}
            >
              {/* Global Page Loader */}
              <PageLoader 
                isLoading={isAnyLoading() || isPageLoading}
                title="Loading Application"
                message="Preparing your finance dashboard..."
              />
              
              <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
                <PageTransitionWrapper>
                  {children}
                </PageTransitionWrapper>
              </div>
            </Suspense>
          </AppErrorBoundary>
        </div>
        
        {/* Toast Notifications */}
        <ToastNotifications />
        
        {/* Onboarding Components */}
        <OnboardingTour />
        <OnboardingTrigger />
        <TourNavigation />
        <OnboardingNotifications />
        <OnboardingHints />
        <FeatureDiscoveryNotifications />
        
        {/* Quick Add Modal */}
        <QuickAddModal 
          open={isQuickAddOpen} 
          onOpenChange={(open) => open ? openQuickAdd() : closeQuickAdd()} 
        />
        
        {/* Keyboard Shortcuts Help Modal */}
        <KeyboardShortcutsHelp 
          open={isKeyboardHelpOpen} 
          onOpenChange={setIsKeyboardHelpOpen} 
        />
      </main>
      
          </div>
  );
}
