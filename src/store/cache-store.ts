import { create } from 'zustand';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheState {
  cache: Map<string, CacheEntry>;
  
  // Actions
  set: <T>(key: string, data: T, ttl?: number) => void;
  get: <T>(key: string) => T | null;
  has: (key: string) => boolean;
  delete: (key: string) => void;
  clear: () => void;
  clearExpired: () => void;
  getStats: () => {
    total: number;
    expired: number;
    valid: number;
  };
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: new Map(),

  set: <T>(key: string, data: T, ttl: number = DEFAULT_TTL) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
      return { cache: newCache };
    });
  },

  get: <T>(key: string): T | null => {
    const entry = get().cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      get().delete(key);
      return null;
    }

    return entry.data as T;
  },

  has: (key: string) => {
    const entry = get().cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttl;

    if (isExpired) {
      get().delete(key);
      return false;
    }

    return true;
  },

  delete: (key: string) => {
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.delete(key);
      return { cache: newCache };
    });
  },

  clear: () => {
    set({ cache: new Map() });
  },

  clearExpired: () => {
    set((state) => {
      const newCache = new Map(state.cache);
      const now = Date.now();

      newCache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          newCache.delete(key);
        }
      });

      return { cache: newCache };
    });
  },

  getStats: () => {
    const cache = get().cache;
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    cache.forEach((entry) => {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      } else {
        valid++;
      }
    });

    return {
      total: cache.size,
      expired,
      valid,
    };
  },
}));

// Auto-cleanup expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    useCacheStore.getState().clearExpired();
  }, 60 * 1000);
}

