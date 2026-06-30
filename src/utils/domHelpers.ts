/**
 * DOM utilities for onboarding system
 * Provides safe element finding and validation
 */

export const findTargetElement = (selector: string): Element | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  try {
    const element = document.querySelector(selector);
    if (!element) {
      console.warn(`Tour target element not found: ${selector}`);
      return null;
    }
    return element;
  } catch (error) {
    console.error(`Error finding target element ${selector}:`, error);
    return null;
  }
};

export const scrollToElement = (element: Element, options?: ScrollIntoViewOptions) => {
  if (!element || typeof element.scrollIntoView !== 'function') {
    return;
  }

  try {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
      ...options
    });
  } catch (error) {
    console.error('Error scrolling to element:', error);
    // Fallback to basic scroll
    element.scrollIntoView?.();
  }
};

export const addHighlightClass = (element: Element, className: string = 'onboarding-highlight') => {
  if (!element || typeof element.classList !== 'object') {
    return false;
  }

  try {
    element.classList.add(className);
    return true;
  } catch (error) {
    console.error('Error adding highlight class:', error);
    return false;
  }
};

export const removeHighlightClass = (element: Element, className: string = 'onboarding-highlight') => {
  if (!element || typeof element.classList !== 'object') {
    return false;
  }

  try {
    element.classList.remove(className);
    return true;
  } catch (error) {
    console.error('Error removing highlight class:', error);
    return false;
  }
};

export const getElementRect = (element: Element): DOMRect | null => {
  if (!element || typeof element.getBoundingClientRect !== 'function') {
    return null;
  }

  try {
    return element.getBoundingClientRect();
  } catch (error) {
    console.error('Error getting element rect:', error);
    return null;
  }
};

export const isElementVisible = (element: Element): boolean => {
  if (!element) return false;

  try {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0
    );
  } catch (error) {
    console.error('Error checking element visibility:', error);
    return false;
  }
};

export const waitForElement = (selector: string, timeout: number = 5000): Promise<Element | null> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const element = findTargetElement(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const foundElement = findTargetElement(selector);
      if (foundElement) {
        observer.disconnect();
        resolve(foundElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};
