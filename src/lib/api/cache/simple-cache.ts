/**
 * Enhanced in-memory cache for API responses with invalidation support
 */
export class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Maximum number of cached items
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private invalidationPatterns = new Map<string, Set<string>>(); // Pattern -> Set of cache keys

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with optional invalidation patterns
   */
  set<T>(key: string, data: T, ttl?: number, invalidationPatterns?: string[]): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });

    // Register invalidation patterns
    if (invalidationPatterns) {
      invalidationPatterns.forEach(pattern => {
        if (!this.invalidationPatterns.has(pattern)) {
          this.invalidationPatterns.set(pattern, new Set());
        }
        this.invalidationPatterns.get(pattern)!.add(key);
      });
    }
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.invalidationPatterns.clear();
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern - Pattern to match against cache keys (supports wildcards)
   */
  invalidateByPattern(pattern: string): number {
    let invalidatedCount = 0;
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }
    
    // Clean up invalidation patterns
    for (const [patternKey, keys] of this.invalidationPatterns.entries()) {
      if (regex.test(patternKey)) {
        keys.forEach(key => this.cache.delete(key));
        invalidatedCount += keys.size;
        this.invalidationPatterns.delete(patternKey);
      }
    }
    
    return invalidatedCount;
  }

  /**
   * Invalidate cache entries by exact key
   */
  invalidateByKey(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a specific endpoint
   * @param endpoint - API endpoint (e.g., '/api/users', '/api/reports')
   */
  invalidateByEndpoint(endpoint: string): number {
    return this.invalidateByPattern(`.*${endpoint}.*`);
  }

  /**
   * Force refresh - clear cache and return false to force fresh data
   */
  forceRefresh(): void {
    this.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; patterns: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      patterns: this.invalidationPatterns.size
    };
  }

  /**
   * Get all cache keys (for debugging)
   */
  getCacheKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Check if cache has any entries for a pattern
   */
  hasPattern(pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.cache.keys()).some(key => regex.test(key));
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

interface CacheEntry {
  data: any;
  expiresAt: number;
}

// Export singleton instance
export const apiCache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 5 * 60 * 1000);
