import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import { CacheInvalidator } from "../cache/cache-invalidator";
import { authService } from "./auth-service";

/**
 * Service for admin operations - user management, database management, and access control
 * All methods require admin role
 */
export class AdminService extends BaseService {
  protected readonly serviceName = 'AdminService';

  // ========== User Management ==========

  /**
   * Get all users
   */
  async getAllUsers(): Promise<ServiceResponse<any>> {
    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_GET_ALL_USERS, {
        invalidationPatterns: ['users', 'admin']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get all users');
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    userId: string,
    password: string,
    role: 'admin' | 'user' = 'user'
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId, password }, ['userId', 'password']);
    this.validateTypes({ userId, password }, { userId: 'string', password: 'string' });

    if (userId.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    if (password.length < 8) {
      throw this.createValidationError('Password must be at least 8 characters long');
    }

    try {
      const result = await this.post<any>(
        API_ENDPOINTS.RBAC_CREATE_USER,
        {
          user_id: userId,
          password: password,
          role: role,
        }
      );
      
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'create user');
    }
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_GET_USER_ROLE(userId), {
        invalidationPatterns: ['users', 'admin']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get user role');
    }
  }

  /**
   * Set user role
   */
  async setUserRole(
    userId: string,
    role: 'admin' | 'user'
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId, role }, ['userId', 'role']);

    try {
      const result = await this.post<any>(
        API_ENDPOINTS.RBAC_SET_ROLE,
        {
          user_id: userId,
          role: role,
        }
      );
      
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'set user role');
    }
  }

  /**
   * Admin change password
   */
  async adminChangePassword(
    targetUserId: string,
    newPassword: string
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ targetUserId, newPassword }, ['targetUserId', 'newPassword']);

    if (newPassword.length < 8) {
      throw this.createValidationError('Password must be at least 8 characters long');
    }

    try {
      return await this.post<any>(
        API_ENDPOINTS.RBAC_ADMIN_CHANGE_PASSWORD,
        {
          target_user_id: targetUserId,
          new_password: newPassword,
        }
      );
    } catch (error: any) {
      throw this.handleError(error, 'admin change password');
    }
  }

  // ========== Database Management ==========

  /**
   * Get all databases
   */
  async getAllDatabases(): Promise<ServiceResponse<any>> {
    try {
      return await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET_ALL, {
        invalidationPatterns: ['databases', 'admin']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get all databases');
    }
  }

  /**
   * Get database by ID
   */
  async getDatabase(dbId: number): Promise<ServiceResponse<any>> {
    this.validateRequired({ dbId }, ['dbId']);
    this.validateTypes({ dbId }, { dbId: 'number' });

    try {
      return await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET(dbId), {
        invalidationPatterns: ['databases', 'admin']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get database');
    }
  }

  /**
   * Create database configuration
   */
  async createDatabase(config: {
    db_name: string;
    db_url?: string;
    business_rule?: string;
    file?: File;
  }): Promise<ServiceResponse<any>> {
    this.validateRequired(config, ['db_name']);

    try {
      // Use set-config workflow endpoint (returns task_id for background processing)
      const formData = new FormData();
      formData.append('db_name', config.db_name);
      if (config.db_url) formData.append('db_url', config.db_url);
      if (config.business_rule) formData.append('business_rule', config.business_rule);
      if (config.file) formData.append('file', config.file);

      const result = await this.post<any>(
        API_ENDPOINTS.MSSQL_CONFIG_CREATE,
        formData,
        {
          headers: {
            // Don't set Content-Type for FormData - browser will set it with boundary
          }
        }
      );
      
      // Note: This returns a task_id, the actual config creation happens in background
      
      if (result.success) {
        CacheInvalidator.invalidateDatabases();
        
        // If the response contains db_id, trigger learn-sync
        // The response structure may vary, so we check for db_id in different possible locations
        const dbId = result.data?.db_id || result.data?.data?.db_id || result.data?.id;
        
        if (dbId && typeof dbId === 'number') {
          // Trigger learn-sync in the background (don't wait for it)
          // This initializes the database learning process
          this.triggerDatabaseLearnSync(dbId).catch((error) => {
            console.warn('Failed to trigger learn-sync after database creation:', error);
            // Don't throw - database creation succeeded, learn-sync is optional
          });
        }
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'create database');
    }
  }

  /**
   * Update database configuration
   */
  async updateDatabase(
    dbId: number,
    config: {
      db_name?: string;
      db_url?: string;
      business_rule?: string;
      file?: File;
    }
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ dbId }, ['dbId']);

    try {
      const formData = new FormData();
      if (config.db_name) formData.append('db_name', config.db_name);
      if (config.db_url) formData.append('db_url', config.db_url);
      if (config.business_rule) formData.append('business_rule', config.business_rule);
      if (config.file) formData.append('file', config.file);

      // Use the update-config workflow endpoint
      const result = await this.put<any>(
        API_ENDPOINTS.MSSQL_CONFIG_UPDATE(dbId),
        formData,
        {
          headers: {
            // Don't set Content-Type for FormData
          }
        }
      );
      
      if (result.success) {
        CacheInvalidator.invalidateDatabases();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'update database');
    }
  }

  /**
   * Delete database
   */
  async deleteDatabase(dbId: number): Promise<ServiceResponse<void>> {
    this.validateRequired({ dbId }, ['dbId']);

    try {
      const result = await this.delete<void>(API_ENDPOINTS.MSSQL_CONFIG_DELETE(dbId));
      
      if (result.success) {
        CacheInvalidator.invalidateDatabases();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'delete database');
    }
  }

  // ========== Access Management ==========

  /**
   * Get user access
   */
  async getUserAccess(userId: string): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      return await this.get<any>(API_ENDPOINTS.RBAC_GET_USER_ACCESS(userId), {
        invalidationPatterns: ['users', 'user-access', 'admin']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get user access');
    }
  }

  /**
   * Grant access to databases and/or vector DB configs
   * Supports both MSSQL database access (dbIds) and vector DB access (configIds)
   * @param userId - User ID to grant access to
   * @param dbIds - Array of database IDs for MSSQL database access (optional)
   * @param configIds - Array of config IDs for vector DB access (optional)
   * @returns Service response with access grant result
   */
  async grantAccess(
    userId: string,
    dbIds?: number[],
    configIds?: number[]
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    // Validate that at least one of configIds or dbIds is provided
    const hasConfigIds = configIds && Array.isArray(configIds) && configIds.length > 0;
    const hasDbIds = dbIds && Array.isArray(dbIds) && dbIds.length > 0;

    if (!hasConfigIds && !hasDbIds) {
      throw this.createValidationError('At least one of configIds or dbIds must be provided');
    }

    // Validate configIds if provided
    if (hasConfigIds) {
      if (configIds!.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All configIds must be positive numbers');
      }
    }

    // Validate dbIds if provided
    if (hasDbIds) {
      if (dbIds!.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All dbIds must be positive numbers');
      }
    }

    try {
      const result = await this.post<any>(
        API_ENDPOINTS.RBAC_GRANT_ACCESS,
        {
          user_id: userId,
          db_id: hasDbIds ? dbIds : null,
          config_id: hasConfigIds ? configIds : null,
        }
      );
      
      if (result.success) {
        CacheInvalidator.invalidateUsers();
        CacheInvalidator.invalidateUserAccess();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'grant access');
    }
  }

  /**
   * Revoke access from databases and/or vector DB configs (admin only)
   * 
   * Behavior:
   * - If configIds is provided (non-empty array): revokes access to the specified vector DB configs
   * - If configIds is not provided or empty: revokes all vector DB config access for the user
   * - If dbIds is provided (non-empty array): revokes access to the specified MSSQL databases
   * - If dbIds is not provided or empty: revokes all MSSQL database access for the user
   * - If both configIds and dbIds are not provided or empty: revokes ALL access (both databases and vector DB configs) for the user
   * - Supports multiple IDs - will revoke access for all specified combinations
   * 
   * @param userId - User ID to revoke access from (required)
   * @param dbIds - Array of database IDs for MSSQL database access to revoke (optional, can be a list, revoke all if not provided or empty)
   * @param configIds - Array of config IDs for vector DB access to revoke (optional, can be a list, revoke all if not provided or empty)
   * @returns Service response with access revoke result
   */
  async revokeAccess(
    userId: string,
    dbIds?: number[],
    configIds?: number[]
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    // Normalize empty arrays to null (revoke all)
    const normalizedConfigIds = (configIds && Array.isArray(configIds) && configIds.length > 0) ? configIds : null;
    const normalizedDbIds = (dbIds && Array.isArray(dbIds) && dbIds.length > 0) ? dbIds : null;

    // Validate configIds if provided
    if (normalizedConfigIds) {
      if (normalizedConfigIds.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All configIds must be positive numbers');
      }
    }

    // Validate dbIds if provided
    if (normalizedDbIds) {
      if (normalizedDbIds.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All dbIds must be positive numbers');
      }
    }

    try {
      const result = await this.request<any>(
        'DELETE',
        API_ENDPOINTS.RBAC_REVOKE_ACCESS,
        {
          user_id: userId,
          db_id: normalizedDbIds,
          config_id: normalizedConfigIds,
        }
      );
      
      if (result.success) {
        CacheInvalidator.invalidateUsers();
        CacheInvalidator.invalidateUserAccess();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'revoke access');
    }
  }

  /**
   * Bulk grant access to multiple users
   */
  async bulkGrantAccess(
    userIds: string[],
    dbIds: number[]
  ): Promise<ServiceResponse<{
    successful: number;
    failed: number;
    errors: Array<{ userId: string; error: string }>;
  }>> {
    this.validateRequired({ userIds, dbIds }, ['userIds', 'dbIds']);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw this.createValidationError('userIds must be a non-empty array');
    }

    if (!Array.isArray(dbIds) || dbIds.length === 0) {
      throw this.createValidationError('dbIds must be a non-empty array');
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ userId: string; error: string }>,
    };

    // Grant access to each user
    for (const userId of userIds) {
      try {
        await this.grantAccess(userId, dbIds);
        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          userId,
          error: error.message || 'Unknown error',
        });
      }
    }

    return {
      data: results,
      success: results.failed === 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check access
   * Check if a user has access to a specific database or vector DB config
   * @param userId - User ID to check access for
   * @param dbId - Database ID for MSSQL database access check (optional)
   * @param configId - Config ID for vector DB access check (optional)
   * @returns Service response with access check result
   * @note At least one of configId or dbId should be provided for meaningful check
   */
  async checkAccess(
    userId: string,
    dbId?: number,
    configId?: number
  ): Promise<ServiceResponse<{
    user_id: string;
    has_access: boolean;
    is_admin: boolean;
    config_id: number | null;
    db_id: number | null;
  }>> {
    this.validateRequired({ userId }, ['userId']);

    // Validate configId if provided
    if (configId !== undefined && (typeof configId !== 'number' || configId <= 0)) {
      throw this.createValidationError('configId must be a positive number');
    }

    // Validate dbId if provided
    if (dbId !== undefined && (typeof dbId !== 'number' || dbId <= 0)) {
      throw this.createValidationError('dbId must be a positive number');
    }

    try {
      return await this.post<{
        user_id: string;
        has_access: boolean;
        is_admin: boolean;
        config_id: number | null;
        db_id: number | null;
      }>(
        API_ENDPOINTS.RBAC_CHECK_ACCESS,
        {
          user_id: userId,
          db_id: dbId ?? null,
          config_id: configId ?? null,
        }
      );
    } catch (error: any) {
      throw this.handleError(error, 'check access');
    }
  }

  // ========== System Statistics ==========

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<ServiceResponse<{
    totalUsers: number;
    totalDatabases: number;
    totalAccessEntries: number;
    activeUsers: number;
  }>> {
    try {
      const [usersResponse, databasesResponse] = await Promise.all([
        this.getAllUsers(),
        this.getAllDatabases(),
      ]);

      const totalUsers = usersResponse.data?.length || 0;
      const totalDatabases = databasesResponse.data?.length || 0;

      // Calculate total access entries (simplified - can be enhanced)
      let totalAccessEntries = 0;
      if (usersResponse.success && Array.isArray(usersResponse.data)) {
        for (const user of usersResponse.data.slice(0, 10)) { // Sample first 10 users
          try {
            const accessResponse = await this.getUserAccess(user.user_id || user.id);
            if (accessResponse.success) {
              totalAccessEntries += accessResponse.data?.total_access_entries || 0;
            }
          } catch {
            // Skip if can't get access for this user
          }
        }
      }

      return {
        data: {
          totalUsers,
          totalDatabases,
          totalAccessEntries,
          activeUsers: totalUsers, // Simplified - can be enhanced with activity tracking
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'get system stats');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<ServiceResponse<{
    totalDatabases: number;
    totalQueries: number;
    totalTasks: number;
  }>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      const [accessResponse] = await Promise.all([
        this.getUserAccess(userId),
        // Can add more stats endpoints here
      ]);

      const totalDatabases = accessResponse.data?.db_ids?.length || 0;

      return {
        data: {
          totalDatabases,
          totalQueries: 0, // Can be enhanced with query history endpoint
          totalTasks: 0, // Can be enhanced with tasks endpoint
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'get user stats');
    }
  }

  // ========== DB Query Update Operations ==========

  /**
   * Trigger combined learn-sync for a database after creation
   * This should be called after creating a database to initialize learning
   * 
   * @param dbId - Database ID to sync
   * @param options - Optional configuration for learn-sync
   * @param options.userId - User ID (defaults to extracting from JWT token)
   * @param options.doTableDescriptions - Whether to generate table descriptions (default: true)
   * @param options.doLearn - Whether to perform learning (default: true)
   * @param options.doSubIntentSync - Whether to sync sub-intents (default: true)
   */
  async triggerDatabaseLearnSync(
    dbId: number,
    options?: {
      userId?: string;
      doTableDescriptions?: boolean;
      doLearn?: boolean;
      doSubIntentSync?: boolean;
    }
  ): Promise<ServiceResponse<{ task_id: string }>> {
    this.validateRequired({ dbId }, ['dbId']);

    try {
      // Get user_id from token if not provided
      let userId = options?.userId;
      if (!userId) {
        // Try to extract from token using auth service
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (token) {
          userId = authService.getUserIdFromToken(token) || 'admin';
        } else {
          userId = 'admin'; // Fallback
        }
      }

      const requestBody = {
        user_id: userId,
        do_table_descriptions: options?.doTableDescriptions ?? true,
        do_learn: options?.doLearn ?? true,
        do_sub_intent_sync: options?.doSubIntentSync ?? true,
      };

      const result = await this.post<{ task_id: string }>(
        API_ENDPOINTS.DB_QUERY_UPDATE_COMBINED_LEARN_SYNC(dbId),
        requestBody,
        {
          invalidationPatterns: ['databases', 'tasks']
        }
      );
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'trigger database learn sync');
    }
  }

  /**
   * Get task status for DB query update operations
   * Uses getFresh to avoid caching and get real-time status
   */
  async getDbQueryUpdateTaskStatus(taskId: string): Promise<ServiceResponse<any>> {
    this.validateRequired({ taskId }, ['taskId']);

    try {
      return await this.getFresh<any>(
        API_ENDPOINTS.DB_QUERY_UPDATE_GET_TASK(taskId)
      );
    } catch (error: any) {
      throw this.handleError(error, 'get db query update task status');
    }
  }

}

// Export singleton instance
export const adminService = new AdminService();

// Export for backward compatibility
export default adminService;

