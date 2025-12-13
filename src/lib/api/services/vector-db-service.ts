import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import { CacheInvalidator } from "../cache/cache-invalidator";

export interface VectorDBConfig {
  db_id: number;
  db_config: {
    schema: string;
    DB_HOST: string;
    DB_NAME: string;
    DB_PORT: number;
    DB_USER: string;
    [key: string]: any; // Allow other properties
  };
  created_at?: string;
  updated_at: string;
}

export interface UserTableNamesResponse {
  table_names: string[];
}

export interface UserConfig {
  config_id: number;
  user_id: string;
  db_id: number;
  db_config: {
    schema: string;
    DB_HOST: string;
    DB_NAME: string;
    DB_PORT: number;
    DB_USER: string;
    DB_PASSWORD?: string;
    [key: string]: any;
  };
  access_level: number;
  accessible_tables: string[];
  table_names: string[];
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserConfigsResponse {
  configs: UserConfig[];
  count: number;
}

/**
 * Service for managing vector database operations
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class VectorDBService extends BaseService {
  protected readonly serviceName = 'VectorDBService';

  /**
   * Get all available vector database configurations for the authenticated user
   */
  async getVectorDBConfigs(): Promise<ServiceResponse<VectorDBConfig[]>> {
    // Use FMS_DB_CONFIG for vector DB configs
    const response = await this.get<any>(API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL);

    // Extract the configs array from the nested response structure
    const configs = response.data?.configs || [];

    return {
      data: configs,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a new vector database configuration
   */
  async createVectorDBConfig(config: {
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    schema: string;
  }): Promise<ServiceResponse<any>> {
    this.validateRequired(config, ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'schema']);

    if (config.DB_PORT <= 0 || config.DB_PORT > 65535) {
      throw this.createValidationError('DB_PORT must be a valid port number (1-65535)');
    }

    const result = await this.post<any>(
      API_ENDPOINTS.FMS_DB_CONFIG_CREATE,
      {
        db_config: config,
      }
    );

    if (result.success) {
      CacheInvalidator.invalidateDatabases();
    }

    return result;
  }

  /**
   * Update a vector database configuration
   */
  async updateVectorDBConfig(
    dbId: number,
    config: {
      DB_HOST?: string;
      DB_PORT?: number;
      DB_NAME?: string;
      DB_USER?: string;
      DB_PASSWORD?: string;
      schema?: string;
    }
  ): Promise<ServiceResponse<any>> {
    this.validateRequired({ dbId }, ['dbId']);

    if (config.DB_PORT && (config.DB_PORT <= 0 || config.DB_PORT > 65535)) {
      throw this.createValidationError('DB_PORT must be a valid port number (1-65535)');
    }

    const result = await this.put<any>(
      API_ENDPOINTS.FMS_DB_CONFIG_UPDATE(dbId),
      {
        db_config: config,
      }
    );

    if (result.success) {
      CacheInvalidator.invalidateDatabases();
    }

    return result;
  }

  /**
   * Delete a vector database configuration
   */
  async deleteVectorDBConfig(dbId: number): Promise<ServiceResponse<void>> {
    this.validateRequired({ dbId }, ['dbId']);

    const result = await this.delete<void>(API_ENDPOINTS.FMS_DB_CONFIG_DELETE(dbId));

    if (result.success) {
      CacheInvalidator.invalidateDatabases();
    }

    return result;
  }

  /**
   * Get available table names for a config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  async getUserTableNames(configId: number): Promise<ServiceResponse<string[]>> {
    if (!configId || configId <= 0) {
      throw this.createValidationError('configId is required and must be positive');
    }

    const endpoint = API_ENDPOINTS.FMS_DB_CONFIG_GET_TABLE_NAMES(configId);
    const response = await this.get<any>(endpoint);

    // Handle API response structure: { status: "success", message: "...", data: [...] }
    let tableNames: string[] = [];

    // Check if response.data is the API response object with nested data
    if (response.data && typeof response.data === 'object') {
      // If response.data has a data property (nested structure)
      if (Array.isArray(response.data.data)) {
        tableNames = response.data.data;
      }
      // If response.data is directly an array
      else if (Array.isArray(response.data)) {
        tableNames = response.data;
      }
      // If response.data has table_names property
      else if (response.data.table_names && Array.isArray(response.data.table_names)) {
        tableNames = response.data.table_names;
      }
    }

    return {
      data: tableNames,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create vector database access for the authenticated user
   * User ID is extracted from JWT token on backend
   */
  async createVectorDBAccess(request: {
    vector_db_id: number;
    accessible_tables: string[];
    access_level: string;
  }): Promise<ServiceResponse<any>> {
    this.validateRequired(request, ['vector_db_id', 'accessible_tables', 'access_level']);
    this.validateTypes(request, {
      vector_db_id: 'number',
      access_level: 'string',
    });

    if (!Array.isArray(request.accessible_tables)) {
      throw this.createValidationError('accessible_tables must be an array');
    }

    if (request.vector_db_id <= 0) {
      throw this.createValidationError('vector_db_id must be positive');
    }

    const requestBody = {
      access_type: "vector_db",
      vector_db_id: request.vector_db_id,
      accessible_tables: request.accessible_tables,
      access_level: request.access_level,
    };

    // Use FMS_DB_CONFIG for vector DB user configs
    const result = await this.post<any>(API_ENDPOINTS.FMS_DB_CONFIG_SET_USER_CONFIG, requestBody);

    // Invalidate user-related cache after creating vector DB access
    if (result.success) {
      CacheInvalidator.invalidateUsers();
    }

    return result;
  }

  /**
   * Get all user configurations
   * Returns all user configurations for vector DB
   * API response structure: { status: "success", message: "...", data: { configs: [...], count: ... } }
   */
  async getAllUserConfigs(): Promise<ServiceResponse<UserConfigsResponse>> {
    const response = await this.get<any>(API_ENDPOINTS.FMS_DB_CONFIG_GET_ALL_USER_CONFIGS);

    // Handle API response structure: { status: "success", message: "...", data: { configs: [...], count: ... } }
    let configs: UserConfig[] = [];
    let count = 0;

    if (response.data && typeof response.data === 'object') {
      // Check if response.data is the API response object with nested data
      if (response.data.status === 'success' && response.data.data) {
        // API returns { status, message, data: { configs, count } }
        configs = Array.isArray(response.data.data.configs) ? response.data.data.configs : [];
        count = response.data.data.count || configs.length;
      }
      // If response.data is directly the data object
      else if (response.data.configs) {
        configs = Array.isArray(response.data.configs) ? response.data.configs : [];
        count = response.data.count || configs.length;
      }
      // If response.data is directly an array (fallback)
      else if (Array.isArray(response.data)) {
        configs = response.data;
        count = configs.length;
      }
    }

    return {
      data: {
        configs,
        count,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create user configuration for vector DB
   * Admin can assign vector DB configurations to users
   */
  async createUserConfig(request: {
    user_id: string;
    db_id: number;
    access_level: number;
    accessible_tables?: string[];
    table_names?: string[];
  }): Promise<ServiceResponse<any>> {
    this.validateRequired(request, ['user_id', 'db_id', 'access_level']);
    this.validateTypes(request, {
      user_id: 'string',
      db_id: 'number',
      access_level: 'number',
    });

    if (request.db_id <= 0) {
      throw this.createValidationError('db_id must be positive');
    }

    if (request.access_level < 0) {
      throw this.createValidationError('access_level must be non-negative');
    }

    const requestBody = {
      user_id: request.user_id,
      db_id: request.db_id,
      access_level: request.access_level,
      accessible_tables: request.accessible_tables || [],
      table_names: request.table_names || [],
    };

    const result = await this.post<any>(API_ENDPOINTS.FMS_DB_CONFIG_SET_USER_CONFIG, requestBody);

    // Invalidate user-related cache after creating user config
    if (result.success) {
      CacheInvalidator.invalidateUsers();
    }

    return result;
  }

  /**
   * Create user configuration directly (combined endpoint)
   * Creates both vector DB config and user config in a single call
   * Admin can create vector DB configurations and assign to users simultaneously
   */
  async createUserConfigDirect(request: {
    user_id: string;
    db_config: {
      DB_HOST: string;
      DB_PORT: number;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      schema: string;
    };
    access_level: number;
    accessible_tables?: string[];
    table_names?: string[];
  }): Promise<ServiceResponse<any>> {
    this.validateRequired(request, ['user_id', 'db_config', 'access_level']);
    this.validateRequired(request.db_config, ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'schema']);
    this.validateTypes(request, {
      user_id: 'string',
      access_level: 'number',
    });

    if (request.db_config.DB_PORT <= 0 || request.db_config.DB_PORT > 65535) {
      throw this.createValidationError('DB_PORT must be a valid port number (1-65535)');
    }

    if (request.access_level < 0) {
      throw this.createValidationError('access_level must be non-negative');
    }

    const requestBody = {
      user_id: request.user_id,
      db_config: request.db_config,
      access_level: request.access_level,
      accessible_tables: request.accessible_tables || [],
      table_names: request.table_names || [],
    };

    const result = await this.post<any>(API_ENDPOINTS.FMS_DB_CONFIG_USER_CONFIG_DIRECT, requestBody);

    // Invalidate both database and user cache after creating combined config
    if (result.success) {
      CacheInvalidator.invalidateDatabases();
      CacheInvalidator.invalidateUsers();
    }

    return result;
  }

  /**
   * Get user configuration by database ID for the authenticated user
   * User ID is extracted from JWT token on backend
   */
  async getUserConfigByDB(dbId: number): Promise<ServiceResponse<any>> {
    this.validateRequired({ dbId }, ['dbId']);
    this.validateTypes({ dbId }, { dbId: 'number' });

    if (dbId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    // Use FMS_DB_CONFIG to get user config by database
    // Note: May need to use FMS_DB_CONFIG_GET_ALL_CONFIGS_FOR_USER or similar
    return this.get<any>(API_ENDPOINTS.FMS_DB_CONFIG_GET(dbId));
  }

  /**
   * Get vector DB configuration by config ID
   * Returns full config details including db_config with DB_NAME
   */
  async getConfigById(configId: number): Promise<ServiceResponse<any>> {
    this.validateRequired({ configId }, ['configId']);
    this.validateTypes({ configId }, { configId: 'number' });

    if (configId <= 0) {
      throw this.createValidationError('Config ID must be positive');
    }

    return this.get<any>(API_ENDPOINTS.FMS_DB_CONFIG_GET_CONFIG(configId));
  }

  /**
   * Add table name for a config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  async addUserTableName(tableName: string, configId: number): Promise<ServiceResponse<any>> {
    this.validateRequired({ tableName, configId }, ['tableName', 'configId']);
    this.validateTypes({ tableName, configId }, { tableName: 'string', configId: 'number' });

    if (tableName.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    if (configId <= 0) {
      throw this.createValidationError('Config ID must be positive');
    }

    // Validate table name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(tableName)) {
      throw this.createValidationError('Table name must start with a letter and contain only letters, numbers, and underscores');
    }

    return this.post<any>(API_ENDPOINTS.FMS_DB_CONFIG_APPEND_TABLE_NAME(configId), {
      table_name: tableName,
    });
  }

  /**
   * Delete table name for a config
   * NOTE: Updated to use configId instead of userId - requires configId parameter
   */
  async deleteUserTableName(tableName: string, configId: number): Promise<ServiceResponse<any>> {
    this.validateRequired({ tableName, configId }, ['tableName', 'configId']);
    this.validateTypes({ tableName, configId }, { tableName: 'string', configId: 'number' });

    if (tableName.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    if (configId <= 0) {
      throw this.createValidationError('Config ID must be positive');
    }

    const result = await this.delete<any>(API_ENDPOINTS.FMS_DB_CONFIG_DELETE_TABLE_NAME(configId, tableName));

    // Invalidate user-related cache after deleting table name
    if (result.success) {
      CacheInvalidator.invalidateUsers();
    }

    return result;
  }

  /**
   * Bulk add multiple table names
   * NOTE: Updated to use configId instead of userId
   */
  async addMultipleTableNames(tableNames: string[], configId: number): Promise<ServiceResponse<{
    successful: string[];
    failed: Array<{ tableName: string; error: string }>;
  }>> {
    this.validateRequired({ tableNames, configId }, ['tableNames', 'configId']);

    if (!Array.isArray(tableNames)) {
      throw this.createValidationError('tableNames must be an array');
    }

    if (tableNames.length === 0) {
      throw this.createValidationError('tableNames array cannot be empty');
    }

    if (configId <= 0) {
      throw this.createValidationError('Config ID must be positive');
    }

    const results = await Promise.allSettled(
      tableNames.map(tableName => this.addUserTableName(tableName, configId))
    );

    const successful: string[] = [];
    const failed: Array<{ tableName: string; error: string }> = [];

    results.forEach((result, index) => {
      const tableName = tableNames[index];
      if (result.status === 'fulfilled') {
        successful.push(tableName);
      } else {
        failed.push({
          tableName,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return {
      data: { successful, failed },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get user table names with metadata
   * NOTE: Updated to use configId instead of userId
   */
  async getUserTableNamesWithMetadata(configId: number): Promise<ServiceResponse<{
    tableNames: string[];
    count: number;
    lastUpdated: string;
  }>> {
    if (!configId || configId <= 0) {
      throw this.createValidationError('configId is required and must be positive');
    }

    const response = await this.getUserTableNames(configId);

    return {
      data: {
        tableNames: response.data,
        count: response.data.length,
        lastUpdated: new Date().toISOString(),
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate table name format
   */
  validateTableName(tableName: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!tableName || typeof tableName !== 'string') {
      errors.push('Table name must be a string');
      return { isValid: false, errors };
    }

    if (tableName.trim().length === 0) {
      errors.push('Table name cannot be empty');
    }

    if (tableName.length > 128) {
      errors.push('Table name cannot be longer than 128 characters');
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(tableName)) {
      errors.push('Table name must start with a letter and contain only letters, numbers, and underscores');
    }

    // Check for reserved keywords
    const reservedKeywords = ['select', 'insert', 'update', 'delete', 'drop', 'create', 'alter', 'table'];
    if (reservedKeywords.includes(tableName.toLowerCase())) {
      errors.push('Table name cannot be a reserved SQL keyword');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const vectorDBService = new VectorDBService();

// Export for backward compatibility
export default vectorDBService; 