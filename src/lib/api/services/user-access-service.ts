import { API_ENDPOINTS, buildEndpointWithQueryParams } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import {
  UserAccessCreateRequest,
  UserAccessCreateResponse,
  UserAccessResponse,
  UserAccessListResponse,
} from "@/types/api";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Service for managing user access to databases and companies
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class UserAccessService extends BaseService {
  protected readonly serviceName = 'UserAccessService';

  /**
   * Create or update user access configuration
   * Supports both database access (db_ids) and vector DB access (config_ids)
   * @param accessConfig - Access configuration with user_id, db_ids (for MSSQL), config_ids (for vector DB), and access_level
   */
  async createUserAccess(
    accessConfig: UserAccessCreateRequest & { config_ids?: number[] }
  ): Promise<ServiceResponse<UserAccessCreateResponse>> {
    this.validateRequired(accessConfig, [
      'user_id',
      'access_level'
    ]);

    this.validateTypes(accessConfig, {
      user_id: 'string',
      access_level: 'number',
    });

    // Validate that at least one of db_ids or config_ids is provided
    const hasDbIds = accessConfig.db_ids && Array.isArray(accessConfig.db_ids) && accessConfig.db_ids.length > 0;
    const hasConfigIds = accessConfig.config_ids && Array.isArray(accessConfig.config_ids) && accessConfig.config_ids.length > 0;

    if (!hasDbIds && !hasConfigIds) {
      throw this.createValidationError('At least one of db_ids or config_ids must be provided');
    }

    // Validate db_ids if provided
    if (accessConfig.db_ids) {
      if (!Array.isArray(accessConfig.db_ids)) {
        throw this.createValidationError('db_ids must be an array');
      }
    }

    // Validate config_ids if provided (for vector DB access)
    if (accessConfig.config_ids) {
      if (!Array.isArray(accessConfig.config_ids)) {
        throw this.createValidationError('config_ids must be an array');
      }
      if (accessConfig.config_ids.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All config_ids must be positive numbers');
      }
    }

    // Validate user ID format
    if (accessConfig.user_id.trim().length === 0) {
      throw this.createValidationError('user_id cannot be empty');
    }

    // Validate access level (0, 1, or 2)
    if (![0, 1, 2].includes(accessConfig.access_level)) {
      throw this.createValidationError('access_level must be 0, 1, or 2');
    }

    // Use RBAC grant-access endpoint with both db_ids and config_ids
    const result = await this.post<UserAccessCreateResponse>(
      API_ENDPOINTS.RBAC_GRANT_ACCESS,
      {
        user_id: accessConfig.user_id,
        db_id: hasDbIds ? accessConfig.db_ids : null,
        config_id: hasConfigIds ? accessConfig.config_ids : null,
      }
    );
    
    // Invalidate user-related cache after creating user access
    if (result.success) {
      CacheInvalidator.invalidateUsers();
    }
    
    const totalCount = (hasDbIds ? accessConfig.db_ids!.length : 0) + (hasConfigIds ? accessConfig.config_ids!.length : 0);
    
    return {
      data: {
        user_id: accessConfig.user_id,
        databases_count: totalCount,
      },
      success: result.success,
      timestamp: result.timestamp,
    };
  }

  /**
   * Get all user access configurations
   * Uses RBAC: Gets all users first, then fetches access for each user
   * Includes both database access (db_ids) and vector DB access (config_ids)
   */
  async getUserAccessConfigs(): Promise<ServiceResponse<UserAccessListResponse>> {
    try {
      // Get all users first using RBAC
      const usersResponse = await this.get<any>(API_ENDPOINTS.RBAC_GET_ALL_USERS, {
        invalidationPatterns: ['users', 'user-access']
      });

      if (!usersResponse.success || !usersResponse.data) {
        return {
          data: { access_configs: [], total_access_entries: 0 },
          success: true,
          timestamp: new Date().toISOString(),
        };
      }

      const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      
      // Fetch access for each user using RBAC
      const accessPromises = users.map(async (user: any) => {
        const userId = user.user_id || user.id || user.email;
        if (!userId) return null;
        
        try {
          const accessResponse = await this.get<any>(
            API_ENDPOINTS.RBAC_GET_USER_ACCESS(userId)
          );
          if (accessResponse.success && accessResponse.data) {
            return {
              user_id: userId,
              db_ids: accessResponse.data.db_ids || [],
              config_ids: accessResponse.data.config_ids || [], // Include vector DB config_ids
              ...accessResponse.data
            };
          }
        } catch (error) {
          // If user has no access, return empty access
          return {
            user_id: userId,
            db_ids: [],
            config_ids: [],
          };
        }
        return null;
      });

      const accessConfigs = (await Promise.all(accessPromises)).filter(
        (config): config is any => config !== null
      );

      // Calculate total access entries including both db_ids and config_ids
      const totalAccessEntries = accessConfigs.reduce(
        (sum, config) => sum + (config.db_ids?.length || 0) + (config.config_ids?.length || 0),
        0
      );

      return {
        data: {
          access_configs: accessConfigs,
          total_access_entries: totalAccessEntries,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'get user access configs');
    }
  }

  /**
   * Get access configurations for a specific user
   */
  async getUserAccess(userId: string): Promise<ServiceResponse<UserAccessResponse>> {
    this.validateRequired({ userId }, ['userId']);
    this.validateTypes({ userId }, { userId: 'string' });

    if (userId.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    return this.get<UserAccessResponse>(API_ENDPOINTS.RBAC_GET_USER_ACCESS(userId), {
      invalidationPatterns: ['users', 'user-access']
    });
  }

  /**
   * Get accessible databases for a specific user (simplified - uses RBAC endpoint)
   */
  async getUserAccessibleDatabases(userId: string): Promise<ServiceResponse<{
    databases: Array<{
      id: number;
      name: string;
      description: string;
      url: string;
      access_level: number;
    }>;
    count: number;
  }>> {
    // Use the optimized endpoint from OpenAPI
    const response = await this.get<any>(
      API_ENDPOINTS.MSSQL_CONFIG_GET_USER_DATABASES(userId),
      {
        invalidationPatterns: ['users', 'user-access', 'databases']
      }
    );
    
    if (!response.success || !response.data?.configs) {
      return {
        data: { databases: [], count: 0 },
        success: true,
        timestamp: new Date().toISOString(),
      };
    }

    const databases = response.data.configs.map((config: any) => ({
      id: config.db_id,
      name: config.db_name || `Database ${config.db_id}`,
      description: config.db_name || `Database ${config.db_id}`,
      url: config.db_url || '',
      access_level: 2, // Default to full access, can be enhanced later
    }));

    return {
      data: {
        databases,
        count: databases.length,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update user access configuration (uses RBAC)
   * Supports both database access (db_ids) and vector DB access (config_ids)
   */
  async updateUserAccess(
    userId: string,
    accessConfig: Partial<UserAccessCreateRequest & { config_ids?: number[] }>
  ): Promise<ServiceResponse<UserAccessCreateResponse>> {
    this.validateRequired({ userId }, ['userId']);
    this.validateTypes({ userId }, { userId: 'string' });

    if (userId.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    if (!accessConfig || typeof accessConfig !== 'object') {
      throw this.createValidationError('Access configuration is required');
    }

    const hasDbIds = accessConfig.db_ids && Array.isArray(accessConfig.db_ids) && accessConfig.db_ids.length > 0;
    const hasConfigIds = accessConfig.config_ids && Array.isArray(accessConfig.config_ids) && accessConfig.config_ids.length > 0;

    if (!hasDbIds && !hasConfigIds) {
      throw this.createValidationError('At least one of db_ids or config_ids must be provided for update');
    }

    // Validate config_ids if provided (for vector DB access)
    if (accessConfig.config_ids) {
      if (!Array.isArray(accessConfig.config_ids)) {
        throw this.createValidationError('config_ids must be an array');
      }
      if (accessConfig.config_ids.some(id => typeof id !== 'number' || id <= 0)) {
        throw this.createValidationError('All config_ids must be positive numbers');
      }
    }

    // Grant access using RBAC endpoint with both db_ids and config_ids
    const result = await this.post<UserAccessCreateResponse>(
      API_ENDPOINTS.RBAC_GRANT_ACCESS,
      {
        user_id: userId,
        db_id: hasDbIds ? accessConfig.db_ids : null,
        config_id: hasConfigIds ? accessConfig.config_ids : null,
      }
    );
    
    if (result.success) {
      CacheInvalidator.invalidateUsers();
    }
    
    const totalCount = (hasDbIds ? accessConfig.db_ids!.length : 0) + (hasConfigIds ? accessConfig.config_ids!.length : 0);
    
    return {
      data: {
        user_id: userId,
        databases_count: totalCount,
      },
      success: result.success,
      timestamp: result.timestamp,
    };
  }


  /**
   * Delete user access configuration
   */
  async deleteUserAccess(userId: string): Promise<ServiceResponse<void>> {
    this.validateRequired({ userId }, ['userId']);
    this.validateTypes({ userId }, { userId: 'string' });

    if (userId.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    try {
      // Use RBAC revoke-access endpoint - need to get user's access first to revoke all
      // For now, revoke with null db_id and config_id to revoke all access
      const result = await this.request<void>(
        'DELETE',
        API_ENDPOINTS.RBAC_REVOKE_ACCESS,
        {
          user_id: userId,
          db_id: null,
          config_id: null,
        }
      );
      
      // Invalidate user-related cache after deleting user access
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'delete user access');
    }
  }

  /**
   * Check if user has access to a specific database (uses RBAC check-access)
   */
  async checkUserDatabaseAccess(
    userId: string,
    databaseId: number
  ): Promise<ServiceResponse<{
    hasAccess: boolean;
    accessLevel?: number;
    isAdmin?: boolean;
  }>> {
    const response = await this.post<{
      user_id: string;
      has_access: boolean;
      is_admin: boolean;
      config_id: number | null;
      db_id: number | null;
    }>(
      API_ENDPOINTS.RBAC_CHECK_ACCESS,
      {
        user_id: userId,
        db_id: databaseId,
      }
    );

    return {
      data: {
        hasAccess: response.data.has_access,
        accessLevel: response.data.has_access ? 2 : undefined, // Can be enhanced with actual access level
        isAdmin: response.data.is_admin,
      },
      success: response.success,
      timestamp: response.timestamp,
    };
  }

  /**
   * Get user access summary
   * Includes both database access (db_ids) and vector DB access (config_ids)
   */
  async getUserAccessSummary(userId: string): Promise<ServiceResponse<{
    totalDatabases: number;
    dbIds: number[];
    configIds: number[];
    totalAccessEntries: number;
  }>> {
    const userAccessResponse = await this.getRBACUserAccess(userId);
    
    if (!userAccessResponse.success) {
      return {
        data: {
          totalDatabases: 0,
          dbIds: [],
          configIds: [],
          totalAccessEntries: 0,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      data: {
        totalDatabases: userAccessResponse.data.db_ids.length,
        dbIds: userAccessResponse.data.db_ids,
        configIds: userAccessResponse.data.config_ids || [],
        totalAccessEntries: userAccessResponse.data.total_access_entries,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check access (RBAC)
   * Check if a user has access to a specific database or vector DB config
   * @param userId - User ID to check access for
   * @param configId - Config ID for vector DB access check (optional)
   * @param dbId - Database ID for MSSQL database access check (optional)
   * @returns Service response with access check result
   * @note At least one of configId or dbId should be provided for meaningful check
   */
  async checkAccess(
    userId: string,
    configId?: number,
    dbId?: number
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
          config_id: configId ?? null,
          db_id: dbId ?? null,
        }
      );
    } catch (error: any) {
      throw this.handleError(error, 'check access');
    }
  }

  /**
   * Grant access (RBAC)
   * Supports both database access (dbIds) and vector DB access (configIds)
   * @param userId - User ID to grant access to
   * @param configIds - Array of config IDs for vector DB access (optional)
   * @param dbIds - Array of database IDs for MSSQL database access (optional)
   * @returns Service response with access grant result
   */
  async grantAccess(
    userId: string,
    configIds?: number[],
    dbIds?: number[]
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
          config_id: hasConfigIds ? configIds : null,
          db_id: hasDbIds ? dbIds : null,
        }
      );
      
      // Invalidate user-related cache after granting access
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'grant access');
    }
  }

  /**
   * Revoke access (RBAC)
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
   * @param configIds - Array of config IDs for vector DB access to revoke (optional, can be a list, revoke all if not provided or empty)
   * @param dbIds - Array of database IDs for MSSQL database access to revoke (optional, can be a list, revoke all if not provided or empty)
   * @returns Service response with access revoke result
   */
  async revokeAccess(
    userId: string,
    configIds?: number[],
    dbIds?: number[]
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
      // DELETE with body - use request method directly
      // If configIds/dbIds are undefined or empty, send null to revoke all access of that type
      const result = await this.request<any>(
        'DELETE',
        API_ENDPOINTS.RBAC_REVOKE_ACCESS,
        {
          user_id: userId,
          config_id: normalizedConfigIds,
          db_id: normalizedDbIds,
        }
      );
      
      // Invalidate user-related cache after revoking access
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'revoke access');
    }
  }

  /**
   * Get user access (RBAC)
   */
  async getRBACUserAccess(userId: string): Promise<ServiceResponse<{
    user_id: string;
    config_ids: number[];
    db_ids: number[];
    access_details: any[];
    total_access_entries: number;
  }>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      return await this.get<{
        user_id: string;
        config_ids: number[];
        db_ids: number[];
        access_details: any[];
        total_access_entries: number;
      }>(
        API_ENDPOINTS.RBAC_GET_USER_ACCESS(userId),
        {
          invalidationPatterns: ['users', 'user-access']
        }
      );
    } catch (error: any) {
      throw this.handleError(error, 'get RBAC user access');
    }
  }

  /**
   * Get user database access details (RBAC)
   * @param userId - User ID to get database access for
   * @param options - Optional field selection parameters
   */
  async getUserDBAccess(
    userId: string,
    options?: {
      db_id?: boolean;
      db_url?: boolean;
      db_name?: boolean;
      business_rule?: boolean;
      table_info?: boolean;
      db_schema?: boolean;
      dbPath?: boolean;
      report_structure?: boolean;
      config_id?: boolean;
      db_config?: boolean;
      access_level?: boolean;
      accessible_tables?: boolean;
      table_names?: boolean;
      is_latest?: boolean;
      created_at?: boolean;
      updated_at?: boolean;
    }
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      // Build query parameters from options
      const queryParams: Record<string, string> = {};
      
      if (options) {
        // Default to true for essential fields if not specified
        queryParams.db_id = String(options.db_id !== false);
        queryParams.db_name = String(options.db_name !== false);
        queryParams.config_id = String(options.config_id !== false);
        
        // Set other fields based on options
        if (options.db_url !== undefined) queryParams.db_url = String(options.db_url);
        if (options.business_rule !== undefined) queryParams.business_rule = String(options.business_rule);
        if (options.table_info !== undefined) queryParams.table_info = String(options.table_info);
        if (options.db_schema !== undefined) queryParams.db_schema = String(options.db_schema);
        if (options.dbPath !== undefined) queryParams.dbPath = String(options.dbPath);
        if (options.report_structure !== undefined) queryParams.report_structure = String(options.report_structure);
        if (options.db_config !== undefined) queryParams.db_config = String(options.db_config);
        if (options.access_level !== undefined) queryParams.access_level = String(options.access_level);
        if (options.accessible_tables !== undefined) queryParams.accessible_tables = String(options.accessible_tables);
        if (options.table_names !== undefined) queryParams.table_names = String(options.table_names);
        if (options.is_latest !== undefined) queryParams.is_latest = String(options.is_latest);
        if (options.created_at !== undefined) queryParams.created_at = String(options.created_at);
        if (options.updated_at !== undefined) queryParams.updated_at = String(options.updated_at);
      } else {
        // Default: get essential fields
        queryParams.db_id = 'true';
        queryParams.db_name = 'true';
        queryParams.config_id = 'true';
      }

      const endpoint = buildEndpointWithQueryParams(
        API_ENDPOINTS.RBAC_GET_USER_DB_ACCESS(userId),
        queryParams
      );

      return await this.get<any>(
        endpoint,
        undefined,
        {
          invalidationPatterns: ['users', 'user-access']
        }
      );
    } catch (error: any) {
      throw this.handleError(error, 'get user DB access');
    }
  }
}

// Export singleton instance
export const userAccessService = new UserAccessService();

// Export for backward compatibility
export default userAccessService;