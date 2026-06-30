'use client';

import { useState, useEffect } from 'react';

export function MobileTest() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const [sidebarState, setSidebarState] = useState({
    shouldCollapse: false,
    currentWidth: '',
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      
      // Test the same logic as in Sidebar component
      let sidebarWidth = '';
      if (width < 640) {
        sidebarWidth = 'w-14 sm:w-16'; // Mobile - always collapsed
      } else if (width < 768) {
        sidebarWidth = 'w-48'; // Tablet - medium width
      } else if (width < 1024) {
        sidebarWidth = 'w-64'; // Small desktop
      } else if (width < 1280) {
        sidebarWidth = 'w-72'; // Large desktop
      } else {
        sidebarWidth = 'w-80'; // Extra large desktop
      }

      setSidebarState({
        shouldCollapse: width < 640,
        currentWidth: sidebarWidth,
      });
    };

    // Initial call
    handleResize();

    // Add resize listener
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Mobile Responsiveness Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Window Size</h3>
          <p>Width: {windowSize.width}px</p>
          <p>Height: {windowSize.height}px</p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-semibold mb-2">Sidebar State</h3>
          <p>Should Collapse: {sidebarState.shouldCollapse ? 'YES' : 'NO'}</p>
          <p>Current Width: {sidebarState.currentWidth}</p>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Breakpoint Status</h3>
        <div className="space-y-1">
          <p className={windowSize.width < 640 ? 'text-red-600 font-bold' : ''}>
            Mobile (&lt; 640px): {windowSize.width < 640 ? 'ACTIVE' : 'Inactive'}
          </p>
          <p className={windowSize.width >= 640 && windowSize.width < 768 ? 'text-orange-600 font-bold' : ''}>
            Tablet (640px - 768px): {windowSize.width >= 640 && windowSize.width < 768 ? 'ACTIVE' : 'Inactive'}
          </p>
          <p className={windowSize.width >= 768 && windowSize.width < 1024 ? 'text-blue-600 font-bold' : ''}>
            Small Desktop (768px - 1024px): {windowSize.width >= 768 && windowSize.width < 1024 ? 'ACTIVE' : 'Inactive'}
          </p>
          <p className={windowSize.width >= 1024 && windowSize.width < 1280 ? 'text-green-600 font-bold' : ''}>
            Large Desktop (1024px - 1280px): {windowSize.width >= 1024 && windowSize.width < 1280 ? 'ACTIVE' : 'Inactive'}
          </p>
          <p className={windowSize.width >= 1280 ? 'text-purple-600 font-bold' : ''}>
            Extra Large Desktop (&gt;= 1280px): {windowSize.width >= 1280 ? 'ACTIVE' : 'Inactive'}
          </p>
        </div>
      </div>

      <div className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Expected Behavior</h3>
        <ul className="space-y-1 text-sm">
          <li>• Mobile (&lt; 640px): Sidebar should auto-collapse to w-14</li>
          <li>• Tablet (640px - 768px): Sidebar should be w-48</li>
          <li>• Small Desktop (768px - 1024px): Sidebar should be w-64</li>
          <li>• Large Desktop (1024px - 1280px): Sidebar should be w-72</li>
          <li>• Extra Large Desktop (&gt;= 1280px): Sidebar should be w-80</li>
        </ul>
      </div>
    </div>
  );
}
