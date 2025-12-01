/**
 * React hook for cache invalidation
 */
import { useCallback } from 'react';
import { CacheInvalidator } from '@/lib/api/cache/cache-invalidator';

export function useCacheInvalidation() {
  const invalidateUsers = useCallback(() => {
    return CacheInvalidator.invalidateUsers();
  }, []);

  const invalidateReports = useCallback(() => {
    return CacheInvalidator.invalidateReports();
  }, []);

  const invalidateDatabases = useCallback(() => {
    return CacheInvalidator.invalidateDatabases();
  }, []);

  // Company invalidation removed - company system no longer exists

  const invalidateTables = useCallback(() => {
    return CacheInvalidator.invalidateTables();
  }, []);

  const invalidateQueries = useCallback(() => {
    return CacheInvalidator.invalidateQueries();
  }, []);

  const invalidateAll = useCallback(() => {
    CacheInvalidator.invalidateAll();
  }, []);

  const invalidateAfterAction = useCallback((
    action: 'create' | 'update' | 'delete',
    resource: string
  ) => {
    return CacheInvalidator.invalidateAfterAction(action, resource);
  }, []);

  const getCacheStats = useCallback(() => {
    return CacheInvalidator.getStats();
  }, []);

  const getCacheKeys = useCallback(() => {
    return CacheInvalidator.getCacheKeys();
  }, []);

  return {
    invalidateUsers,
    invalidateReports,
    invalidateDatabases,
    invalidateTables,
    invalidateQueries,
    invalidateAll,
    invalidateAfterAction,
    getCacheStats,
    getCacheKeys,
  };
}
