import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import {
  UserConfigCreateRequest,
  UserConfigCreateResponse,
  UserConfigResponse,
  UserConfigsListResponse,
  UserConfigByDbResponse,
  UserConfigUpdateRequest,
  UserConfigUpdateResponse,
  AddUserTableNameRequest,
  UserTableNameActionResponse,
  GetUserTableNamesResponse,
} from "@/types/api";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Service for managing user configuration operations
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class UserConfigService extends BaseService {
  protected readonly serviceName = 'UserConfigService';
  /**
   * Create a new user configuration
   */
  async createUserConfig(
    request: UserConfigCreateRequest
  ): Promise<ServiceResponse<UserConfigCreateResponse>> {
    this.validateRequired(request, ['user_id', 'db_id', 'access_level']);
    this.validateTypes(request, {
      user_id: 'string',
      db_id: 'number',
      access_level: 'number',
    });

    if (request.user_id.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    if (request.db_id <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    if (request.access_level < 0 || request.access_level > 10) {
      throw this.createValidationError('Access level must be between 0 and 10');
    }

    try {
      // Use FMS_DB_CONFIG for user configs
      const result = await this.post<UserConfigCreateResponse>(
        API_ENDPOINTS.FMS_DB_CONFIG_SET_USER_CONFIG,
        request
      );
      
      // Invalidate user-related cache after creating user config
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'create user config');
    }
  }

  /**
   * Get all user configurations
   */
  async getUserConfigs(): Promise<ServiceResponse<UserConfigsListResponse>> {
    try {
      return await this.get<UserConfigsListResponse>(API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL_USER_CONFIGS, {
        invalidationPatterns: ['users', 'user-config']
      });
    } catch (error: any) {
      throw this.handleError(error, 'get user configs');
    }
  }

  /**
   * Get user configuration by user ID
   */
  static async getUserConfig(userId: string): Promise<UserConfigResponse> {
    try {
      // Use FMS_DB_CONFIG - may need to filter by user
      const response = await apiClient.get(
        API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL_USER_CONFIGS
      );
      return response;
    } catch (error) {
      console.error(`Error fetching user configuration for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user configuration by user ID and database ID
   */
  static async getUserConfigByDb(
    userId: string,
    dbId: number
  ): Promise<UserConfigByDbResponse> {
    try {
      // Get all user configs and filter by user and database
      const allConfigsResponse = await apiClient.get(API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL_USER_CONFIGS);
      
      // Extract the configs array from the response
      const allConfigs = allConfigsResponse.configs || [];
      
      // Filter configs for the specific user and database
      const userConfigs = allConfigs.filter((config: any) => 
        config.user_id === userId && config.db_id === dbId
      );
      
      if (userConfigs.length === 0) {
        return {
          configs: [],
          count: 0,
          latest_config_id: 0,
          user_id: userId,
          db_id: dbId,
          database_name: ''
        };
      }
      
      // Find the latest config (most recent)
      const latestConfig = userConfigs.reduce((latest: any, current: any) => 
        new Date(current.created_at) > new Date(latest.created_at) ? current : latest
      );
      
      return {
        configs: userConfigs,
        count: userConfigs.length,
        latest_config_id: latestConfig.config_id,
        user_id: userId,
        db_id: dbId,
        database_name: latestConfig.db_config?.DB_NAME || ''
      };
    } catch (error) {
      console.error(
        `Error fetching user configuration for ${userId} with db ${dbId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get configuration by config ID
   */
  static async getConfigById(id: number): Promise<UserConfigResponse> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.FMS_DB_CONFIG_GET_CONFIG(id));
      return response;
    } catch (error) {
      console.error(`Error fetching configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user configuration
   */
  static async updateUserConfig(
    id: number,
    request: UserConfigUpdateRequest
  ): Promise<UserConfigUpdateResponse> {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.FMS_DB_CONFIG_UPDATE_USER_CONFIG(id),
        request
      );
      
      // Invalidate user-related cache after updating user config
      CacheInvalidator.invalidateUsers();
      
      return response;
    } catch (error) {
      console.error(`Error updating user configuration ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add table name for config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  static async addUserTableName(
    configId: number,
    request: AddUserTableNameRequest
  ): Promise<UserTableNameActionResponse> {
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.FMS_DB_CONFIG_APPEND_TABLE_NAME(configId),
        request
      );
      return response;
    } catch (error) {
      console.error(`Error adding table name for config ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Get table names for config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  static async getUserTableNames(
    configId: number
  ): Promise<GetUserTableNamesResponse> {
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.FMS_DB_CONFIG_GET_TABLE_NAMES(configId)
      );
      return response;
    } catch (error) {
      console.error(`Error fetching table names for config ${configId}:`, error);
      throw error;
    }
  }

  /**
   * Delete table name for config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  static async deleteUserTableName(
    configId: number,
    tableName: string
  ): Promise<UserTableNameActionResponse> {
    try {
      const response = await apiClient.delete(
        API_ENDPOINTS.FMS_DB_CONFIG_DELETE_TABLE_NAME(configId, tableName)
      );
      return response;
    } catch (error) {
      console.error(
        `Error deleting table name ${tableName} for config ${configId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Delete user configuration
   */
  async deleteUserConfig(userId: string): Promise<ServiceResponse<{
    user_id: string;
    deleted_count: number;
    configs_affected: number;
  }>> {
    this.validateRequired({ userId }, ['userId']);
    this.validateTypes({ userId }, { userId: 'string' });

    if (userId.trim().length === 0) {
      throw this.createValidationError('User ID cannot be empty');
    }

    try {
      // Use FMS_DB_CONFIG - get user configs first, then delete each config
      // Note: This is a workaround - ideally there should be a delete-by-user endpoint
      const configsResponse = await this.get<any>(API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL_USER_CONFIGS);
      let deletedCount = 0;
      let configsAffected = 0;
      
      if (configsResponse.success && configsResponse.data) {
        const configs = Array.isArray(configsResponse.data) ? configsResponse.data : configsResponse.data.configs || [];
        const userConfigs = configs.filter((config: any) => config.user_id === userId);
        configsAffected = userConfigs.length;
        
        // Delete each config
        for (const config of userConfigs) {
          if (config.config_id) {
            try {
              await this.delete<void>(API_ENDPOINTS.FMS_DB_CONFIG_DELETE_CONFIG(config.config_id));
              deletedCount++;
            } catch (error) {
              // Continue with other configs
            }
          }
        }
      }
      
      const result: ServiceResponse<{
        user_id: string;
        deleted_count: number;
        configs_affected: number;
      }> = {
        data: {
          user_id: userId,
          deleted_count: deletedCount,
          configs_affected: configsAffected,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
      
      // Invalidate user-related cache after deleting user config
      if (result.success) {
        CacheInvalidator.invalidateUsers();
      }
      
      return result;
    } catch (error: any) {
      throw this.handleError(error, 'delete user config');
    }
  }

  /**
   * Validate user config create request
   */
  static validateCreateRequest(request: UserConfigCreateRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.user_id || request.user_id.trim() === "") {
      errors.push("User ID is required");
    }

    if (!request.db_id || request.db_id <= 0) {
      errors.push("Database ID is required and must be a positive number");
    }

    if (
      request.access_level === undefined ||
      request.access_level < 0 ||
      request.access_level > 10
    ) {
      errors.push("Access level must be between 0 and 10");
    }

    if (!Array.isArray(request.accessible_tables)) {
      errors.push("Accessible tables must be an array");
    }

    if (!Array.isArray(request.table_names)) {
      errors.push("Table names must be an array");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user config update request
   */
  static validateUpdateRequest(request: UserConfigUpdateRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.db_id || request.db_id <= 0) {
      errors.push("Database ID is required and must be a positive number");
    }

    if (
      request.access_level === undefined ||
      request.access_level < 0 ||
      request.access_level > 10
    ) {
      errors.push("Access level must be between 0 and 10");
    }

    if (!Array.isArray(request.accessible_tables)) {
      errors.push("Accessible tables must be an array");
    }

    if (!Array.isArray(request.table_names)) {
      errors.push("Table names must be an array");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate add table name request
   */
  static validateAddTableNameRequest(request: AddUserTableNameRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!request.table_name || request.table_name.trim() === "") {
      errors.push("Table name is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default UserConfigService;
