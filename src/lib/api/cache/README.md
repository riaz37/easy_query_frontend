# Enhanced Cache System

## Overview
The enhanced cache system provides intelligent caching with invalidation support to prevent stale data issues.

## Key Features

### 1. **Automatic Cache Invalidation**
- Invalidate cache entries when data changes
- Pattern-based invalidation (e.g., invalidate all user-related data)
- Endpoint-based invalidation

### 2. **Cache Patterns**
- Register invalidation patterns when caching data
- Automatic cleanup when patterns are invalidated
- Support for wildcard patterns

### 3. **Manual Invalidation**
- Invalidate specific cache keys
- Invalidate by patterns
- Invalidate all cache entries

## Usage Examples

### Basic Caching with Invalidation Patterns
```typescript
// When fetching users data
const users = await apiClient.get('/api/users', {
  invalidationPatterns: ['users', 'user-*']
});

// When creating a user, invalidate user-related cache
await apiClient.post('/api/users', userData);
CacheInvalidator.invalidateUsers(); // This will clear all user-related cache
```

### Using the React Hook
```typescript
import { useCacheInvalidation } from '@/lib/hooks/use-cache-invalidation';

function UserManagement() {
  const { invalidateUsers, invalidateAfterAction } = useCacheInvalidation();

  const handleCreateUser = async (userData) => {
    await createUser(userData);
    invalidateAfterAction('create', 'users');
    // This will automatically refresh user lists
  };

  const handleUpdateUser = async (userId, userData) => {
    await updateUser(userId, userData);
    invalidateAfterAction('update', 'users');
  };

  const handleDeleteUser = async (userId) => {
    await deleteUser(userId);
    invalidateAfterAction('delete', 'users');
  };
}
```

### API Service Integration
```typescript
// In your API service
export class UserService {
  static async getUsers() {
    return apiClient.get('/api/users', {
      invalidationPatterns: ['users', 'user-*']
    });
  }

  static async createUser(userData) {
    const result = await apiClient.post('/api/users', userData);
    // Invalidate user-related cache
    CacheInvalidator.invalidateUsers();
    return result;
  }

  static async updateUser(userId, userData) {
    const result = await apiClient.put(`/api/users/${userId}`, userData);
    CacheInvalidator.invalidateUsers();
    return result;
  }

  static async deleteUser(userId) {
    const result = await apiClient.delete(`/api/users/${userId}`);
    CacheInvalidator.invalidateUsers();
    return result;
  }
}
```

## Cache Invalidation Patterns

### Common Patterns
- `users` - All user-related data
- `reports` - All report-related data
- `databases` - All database-related data
- `companies` - All company-related data
- `tables` - All table-related data
- `queries` - All query-related data

### Wildcard Patterns
- `user-*` - All cache keys starting with "user-"
- `*reports*` - All cache keys containing "reports"
- `api/users/*` - All user API endpoints

## Best Practices

### 1. **Always Invalidate After Mutations**
```typescript
// ✅ Good
await createUser(userData);
CacheInvalidator.invalidateUsers();

// ❌ Bad - will show stale data
await createUser(userData);
// No invalidation
```

### 2. **Use Specific Patterns**
```typescript
// ✅ Good - specific pattern
invalidationPatterns: ['users', 'user-stats']

// ❌ Bad - too broad
invalidationPatterns: ['*']
```

### 3. **Invalidate Related Data**
```typescript
// When updating a user, also invalidate user stats
const handleUpdateUser = async (userData) => {
  await updateUser(userData);
  CacheInvalidator.invalidateUsers();
  CacheInvalidator.invalidateReports(); // If user affects reports
};
```

## Debugging

### Check Cache Status
```typescript
import { CacheInvalidator } from '@/lib/api/cache/cache-invalidator';

// Get cache statistics
const stats = CacheInvalidator.getStats();
console.log('Cache stats:', stats);

// Get all cache keys
const keys = CacheInvalidator.getCacheKeys();
console.log('Cache keys:', keys);
```

### Force Refresh
```typescript
// Clear all cache and force fresh data
CacheInvalidator.invalidateAll();
```

## Migration Guide

### Before (Problematic)
```typescript
// Old way - no invalidation
const users = await apiClient.get('/api/users');
// Data becomes stale when users are updated
```

### After (Fixed)
```typescript
// New way - with invalidation patterns
const users = await apiClient.get('/api/users', {
  invalidationPatterns: ['users']
});

// When updating users
await apiClient.post('/api/users', userData);
CacheInvalidator.invalidateUsers(); // Fresh data on next fetch
```
