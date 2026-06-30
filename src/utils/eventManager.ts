/**
 * Event Manager Utility
 * Provides safe event listener management with automatic cleanup
 */

export interface EventListener {
  target: EventTarget;
  type: string;
  listener: EventListenerOrEventListenerObject;
  options?: boolean | AddEventListenerOptions;
}

export class EventManager {
  private static listeners: Set<EventListener> = new Set();
  private static cleanupScheduled = false;

  /**
   * Add event listener with tracking for automatic cleanup
   */
  static addListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    // Validate target
    if (!target) {
      console.warn('EventManager: Attempted to add listener to null target');
      return;
    }

    // SSR protection
    if (typeof window === 'undefined') {
      return;
    }

    try {
      target.addEventListener(type, listener, options);
      
      const eventListener: EventListener = {
        target,
        type,
        listener,
        options
      };
      
      this.listeners.add(eventListener);
      
      // Schedule cleanup on page unload
      this.scheduleCleanup();
    } catch (error) {
      console.error(`EventManager: Failed to add ${type} listener:`, error);
    }
  }

  /**
   * Remove specific event listener
   */
  static removeListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    try {
      target.removeEventListener(type, listener, options);
      
      // Remove from tracking
      for (const eventListener of this.listeners) {
        if (
          eventListener.target === target &&
          eventListener.type === type &&
          eventListener.listener === listener
        ) {
          this.listeners.delete(eventListener);
          break;
        }
      }
    } catch (error) {
      console.error(`EventManager: Failed to remove ${type} listener:`, error);
    }
  }

  /**
   * Remove all listeners for a specific target
   */
  static removeListenersForTarget(target: EventTarget): void {
    const listenersToRemove: EventListener[] = [];
    
    for (const listener of this.listeners) {
      if (listener.target === target) {
        listenersToRemove.push(listener);
      }
    }
    
    listenersToRemove.forEach(listener => {
      this.removeListener(listener.target, listener.type, listener.listener, listener.options);
    });
  }

  /**
   * Remove all tracked event listeners
   */
  static removeAllListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener.target.removeEventListener(listener.type, listener.listener, listener.options);
      } catch (error) {
        console.error(`EventManager: Failed to remove ${listener.type} listener during cleanup:`, error);
      }
    }
    this.listeners.clear();
  }

  /**
   * Get count of active listeners
   */
  static getListenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Schedule cleanup on page unload
   */
  private static scheduleCleanup(): void {
    if (this.cleanupScheduled) return;
    
    this.cleanupScheduled = true;
    
    if (typeof window !== 'undefined') {
      const cleanup = () => {
        this.removeAllListeners();
        this.cleanupScheduled = false;
      };
      
      window.addEventListener('beforeunload', cleanup, { once: true });
    }
  }

  /**
   * Create a safe event listener hook for React components
   */
  static createEventListenerHook() {
    return {
      add: this.addListener.bind(this),
      remove: this.removeListener.bind(this),
      removeAll: this.removeAllListeners.bind(this),
      removeForTarget: this.removeListenersForTarget.bind(this),
      getCount: this.getListenerCount.bind(this)
    };
  }
}

// Export convenience functions
export const addSafeEventListener = EventManager.addListener.bind(EventManager);
export const removeSafeEventListener = EventManager.removeListener.bind(EventManager);
export const removeAllSafeEventListeners = EventManager.removeAllListeners.bind(EventManager);
