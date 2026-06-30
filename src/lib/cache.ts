// Local storage caching utilities with performance optimizations

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  version?: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  version?: string;
  compress?: boolean; // Enable compression for large data
}

class LocalStorageCache {
  private prefix = 'finance_tracker_';
  private compressionThreshold = 1024; // Compress data larger than 1KB

  // Generate cache key with prefix
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Simple compression for large strings
  private compress(data: string): string {
    try {
      // Basic compression - replace repeated patterns
      return data.replace(/([a-zA-Z])\1{3,}/g, (match) => `${match[0]}${match.length}`);
    } catch {
      return data;
    }
  }

  // Simple decompression
  private decompress(data: string): string {
    try {
      return data.replace(/([a-zA-Z])(\d+)/g, (match, char, count) => char.repeat(parseInt(count)));
    } catch {
      return data;
    }
  }

  // Set cache entry
  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    try {
      const now = Date.now();
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        version: options.version,
      };

      // Add expiration if TTL is provided
      if (options.ttl) {
        entry.expiresAt = now + options.ttl;
      }

      let serializedData = JSON.stringify(entry);
      
      // Compress large data if enabled
      if (options.compress && serializedData.length > this.compressionThreshold) {
        serializedData = this.compress(serializedData);
        // Add compression flag
        serializedData = `compressed:${serializedData}`;
      }

      localStorage.setItem(this.getKey(key), serializedData);
      return true;
    } catch (error) {
      console.warn('Failed to cache data:', error);
      return false;
    }
  }

  // Get cache entry
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (!item) return defaultValue ?? null;

      let serializedData = item;
      
      // Check if data is compressed
      if (serializedData.startsWith('compressed:')) {
        serializedData = this.decompress(serializedData.slice(11));
      }

      const entry: CacheEntry<T> = JSON.parse(serializedData);

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.delete(key);
        return defaultValue ?? null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return defaultValue ?? null;
    }
  }

  // Delete cache entry
  delete(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  // Clear all cache entries
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch {
      return false;
    }
  }

  // Get cache size estimate
  getSize(): number {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      return keys.reduce((size, key) => {
        const item = localStorage.getItem(key);
        return size + (item?.length || 0);
      }, 0);
    } catch {
      return 0;
    }
  }

  // Clean expired entries
  cleanup(): number {
    let cleaned = 0;
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry: CacheEntry<any> = JSON.parse(item.startsWith('compressed:') ? item.slice(11) : item);
            if (entry.expiresAt && Date.now() > entry.expiresAt) {
              localStorage.removeItem(key);
              cleaned++;
            }
          } catch {
            // Remove corrupted entries
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      });
    } catch {
      // Silently fail
    }
    return cleaned;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Get all cache keys (without prefix)
  keys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.slice(this.prefix.length));
    } catch {
      return [];
    }
  }
}

// Session storage cache (clears when tab is closed)
class SessionStorageCache {
  private prefix = 'finance_tracker_session_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  set<T>(key: string, data: T): boolean {
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(this.getKey(key));
      return item ? JSON.parse(item) : defaultValue ?? null;
    } catch {
      return defaultValue ?? null;
    }
  }

  delete(key: string): boolean {
    try {
      sessionStorage.removeItem(this.getKey(key));
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch {
      return false;
    }
  }
}

// Memory cache for frequently accessed data
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean expired entries
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Cache instances
export const localStorageCache = new LocalStorageCache();
export const sessionStorageCache = new SessionStorageCache();
export const memoryCache = new MemoryCache();

// Utility functions for common caching patterns
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { useMemory?: boolean } = {}
): Promise<T> {
  const { useMemory = false, ttl = 5 * 60 * 1000, ...cacheOptions } = options;
  
  // Try memory cache first
  if (useMemory) {
    const cached = memoryCache.get<T>(key);
    if (cached) return Promise.resolve(cached);
  }

  // Try localStorage cache
  const cached = localStorageCache.get<T>(key);
  if (cached) {
    if (useMemory) {
      memoryCache.set(key, cached, ttl);
    }
    return Promise.resolve(cached);
  }

  // Fetch fresh data
  return fetcher().then(data => {
    // Cache the result
    localStorageCache.set(key, data, { ttl, ...cacheOptions });
    if (useMemory) {
      memoryCache.set(key, data, ttl);
    }
    return data;
  });
}

// Debounced cache setter
export function debouncedCacheSet<T>(
  key: string,
  data: T,
  delay: number = 1000,
  options: CacheOptions = {}
): void {
  const timeoutId = `debounce_${key}`;
  
  // Clear existing timeout
  const existingTimeout = memoryCache.get<NodeJS.Timeout>(timeoutId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new timeout
  const timeout = setTimeout(() => {
    localStorageCache.set(key, data, options);
    memoryCache.delete(timeoutId);
  }, delay);

  memoryCache.set(timeoutId, timeout);
}

// Cache invalidation utilities
export function invalidatePattern(pattern: string): number {
  const keys = localStorageCache.keys();
  const regex = new RegExp(pattern);
  let invalidated = 0;

  keys.forEach(key => {
    if (regex.test(key)) {
      localStorageCache.delete(key);
      memoryCache.delete(key);
      invalidated++;
    }
  });

  return invalidated;
}

// Initialize cache cleanup on app start
if (typeof window !== 'undefined') {
  // Clean expired entries periodically
  setInterval(() => {
    localStorageCache.cleanup();
    memoryCache.cleanup();
  }, 10 * 60 * 1000); // Every 10 minutes

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    memoryCache.clear();
  });
}
