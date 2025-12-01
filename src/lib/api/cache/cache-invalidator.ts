/**
 * Cache invalidation utilities for managing data freshness
 */
import { apiCache } from './simple-cache';

export class CacheInvalidator {
  /**
   * Invalidate all user-related cache entries
   */
  static invalidateUsers(): number {
    return apiCache.invalidateByPattern('.*users.*');
  }

  /**
   * Invalidate all report-related cache entries
   */
  static invalidateReports(): number {
    return apiCache.invalidateByPattern('.*reports.*');
  }

  /**
   * Invalidate all database-related cache entries
   */
  static invalidateDatabases(): number {
    return apiCache.invalidateByPattern('.*databases.*');
  }

  // Company invalidation removed - company system no longer exists

  /**
   * Invalidate all table-related cache entries
   */
  static invalidateTables(): number {
    return apiCache.invalidateByPattern('.*tables.*');
  }

  /**
   * Invalidate all query-related cache entries
   */
  static invalidateQueries(): number {
    return apiCache.invalidateByPattern('.*queries.*');
  }

  /**
   * Invalidate all user access-related cache entries
   */
  static invalidateUserAccess(): number {
    return apiCache.invalidateByPattern('.*user.*access.*|.*access.*user.*');
  }

  /**
   * Invalidate cache after a specific action
   * @param action - The action that was performed (create, update, delete)
   * @param resource - The resource type (users, reports, etc.)
   */
  static invalidateAfterAction(action: 'create' | 'update' | 'delete', resource: string): number {
    console.log(`Invalidating cache after ${action} on ${resource}`);
    return apiCache.invalidateByPattern(`.*${resource}.*`);
  }

  /**
   * Invalidate all cache entries (use sparingly)
   */
  static invalidateAll(): void {
    console.log('Invalidating all cache entries');
    apiCache.clear();
  }

  /**
   * Get cache statistics for debugging
   */
  static getStats() {
    return apiCache.getStats();
  }

  /**
   * Get cache keys for debugging
   */
  static getCacheKeys(): string[] {
    return apiCache.getCacheKeys();
  }
}

// Export convenience functions
export const invalidateUsers = () => CacheInvalidator.invalidateUsers();
export const invalidateReports = () => CacheInvalidator.invalidateReports();
export const invalidateDatabases = () => CacheInvalidator.invalidateDatabases();
export const invalidateTables = () => CacheInvalidator.invalidateTables();
export const invalidateQueries = () => CacheInvalidator.invalidateQueries();
export const invalidateUserAccess = () => CacheInvalidator.invalidateUserAccess();
export const invalidateAll = () => CacheInvalidator.invalidateAll();
