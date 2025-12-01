/**
 * Shared data cache for components to avoid duplicate API calls
 */
export class SharedDataCache {
  private static instance: SharedDataCache;
  private data = new Map<string, any>();
  private loading = new Map<string, Promise<any>>();

  static getInstance(): SharedDataCache {
    if (!SharedDataCache.instance) {
      SharedDataCache.instance = new SharedDataCache();
    }
    return SharedDataCache.instance;
  }

  /**
   * Get data with automatic loading
   */
  async get<T>(key: string, loader: () => Promise<T>, ttl: number = 5 * 60 * 1000): Promise<T> {
    // Check if data is already cached and not expired
    const cached = this.data.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if data is already being loaded
    if (this.loading.has(key)) {
      return this.loading.get(key)!;
    }

    // Load data
    const promise = loader().then(data => {
      this.data.set(key, { data, timestamp: Date.now() });
      this.loading.delete(key);
      return data;
    }).catch(error => {
      this.loading.delete(key);
      throw error;
    });

    this.loading.set(key, promise);
    return promise;
  }

  /**
   * Set data manually
   */
  set<T>(key: string, data: T): void {
    this.data.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Clear specific data
   */
  clear(key: string): void {
    this.data.delete(key);
    this.loading.delete(key);
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.data.clear();
    this.loading.clear();
  }

  /**
   * Check if data exists and is not expired
   */
  has(key: string, ttl: number = 5 * 60 * 1000): boolean {
    const cached = this.data.get(key);
    return cached && Date.now() - cached.timestamp < ttl;
  }
}

// Export singleton instance
export const sharedData = SharedDataCache.getInstance();
