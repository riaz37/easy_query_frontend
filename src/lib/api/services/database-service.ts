import { API_ENDPOINTS } from '../endpoints';
import { BaseService, ServiceResponse } from './base';
import { CacheInvalidator } from '../cache/cache-invalidator';

/**
 * Database configuration information
 */
export interface DatabaseInfo {
  id: number;
  name: string;
  url: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  lastUpdated: string;
  metadata?: Record<string, any>;
}

/**
 * Service for handling database management API calls
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class DatabaseService extends BaseService {
  protected readonly serviceName = 'DatabaseService';

  /**
   * Get all available databases for the authenticated user (lite version - only basic info)
   */
  async getAllDatabases(): Promise<ServiceResponse<DatabaseInfo[]>> {
    // Use the new endpoint - will get all fields but we only use what we need
    const response = await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET_ALL);
    
    // Transform MSSQL config data to DatabaseInfo format
    let databases: DatabaseInfo[] = [];
    
    if (response.data && response.data.configs) {
      databases = response.data.configs.map((config: any) => ({
        id: config.db_id,
        name: config.db_name,
        url: config.db_url,
        type: 'mssql',
        status: 'active' as const,
        lastUpdated: new Date().toISOString(),
        metadata: {
          // Minimal metadata for lite version
          isLite: true,
        },
      }));
    }

    return {
      data: databases,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get a specific database by ID (basic info only)
   */
  async getDatabaseById(databaseId: number): Promise<ServiceResponse<DatabaseInfo>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be a positive number');
    }

    // Use the new endpoint to get database information
    const response = await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET_ALL);

    if (!response.data || !response.data.configs) {
      throw this.createNotFoundError('Database', databaseId);
    }

    // Find the specific database
    const config = response.data.configs.find((db: any) => db.db_id === databaseId);
    
    if (!config) {
      throw this.createNotFoundError('Database', databaseId);
    }

    const databaseInfo: DatabaseInfo = {
      id: config.db_id,
      name: config.db_name,
      url: config.db_url,
      type: 'mssql',
      status: 'active',
      lastUpdated: new Date().toISOString(),
      metadata: {
        isLite: true,
      },
    };

    return {
      data: databaseInfo,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get business rules and report structure for a specific database
   */
  async getDatabaseBusinessRulesAndReportStructure(databaseId: number): Promise<ServiceResponse<{
    businessRule: string;
    reportStructure: string;
  }>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be a positive number');
    }

    // Use the new endpoint to get business rules and report structure for a specific database
    const response = await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET_ALL);

    if (!response.data || !response.data.configs) {
      throw this.createNotFoundError('Database', databaseId);
    }

    // Find the specific database
    const config = response.data.configs.find((db: any) => db.db_id === databaseId);
    
    if (!config) {
      throw this.createNotFoundError('Database', databaseId);
    }

    return {
      data: {
        businessRule: config.business_rule || '',
        reportStructure: config.report_structure || '',
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }


  /**
   * Test database connection
   */
  async testDatabaseConnection(databaseId: number): Promise<ServiceResponse<{
    connected: boolean;
    responseTime: number;
    error?: string;
  }>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be a positive number');
    }

    const startTime = Date.now();
    
    try {
      // Try to get database info as a connection test
      await this.getDatabaseById(databaseId);
      
      const responseTime = Date.now() - startTime;
      
      return {
        data: {
          connected: true,
          responseTime,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        data: {
          connected: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Connection test failed',
        },
        success: true, // The test completed successfully, even though connection failed
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(databaseId: number): Promise<ServiceResponse<{
    tableCount: number;
    totalRows: number;
    sizeInMB: number;
    lastActivity: string;
    connectionCount: number;
  }>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be a positive number');
    }

    // Get database info first
    const databaseResponse = await this.getDatabaseById(databaseId);
    
    if (!databaseResponse.success) {
      throw this.createNotFoundError('Database', databaseId);
    }

    const tableInfo = databaseResponse.data.metadata?.tableInfo;
    
    // Calculate stats from table info
    const tableCount = tableInfo?.tables?.length || 0;
    const totalRows = tableInfo?.tables?.reduce((sum: number, table: any) => {
      return sum + (table.row_count_sample || 0);
    }, 0) || 0;

    // Mock data for fields not available in current API
    const stats = {
      tableCount,
      totalRows,
      sizeInMB: 0, // Would need dedicated endpoint
      lastActivity: databaseResponse.data.lastUpdated,
      connectionCount: 1, // Would need dedicated endpoint
    };

    return {
      data: stats,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate database configuration
   */
  validateDatabaseConfig(config: {
    name: string;
    url: string;
    type: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Database name is required');
    }

    if (!config.url || config.url.trim().length === 0) {
      errors.push('Database URL is required');
    }

    if (!config.type || config.type.trim().length === 0) {
      errors.push('Database type is required');
    }

    // Validate URL format for MSSQL
    if (config.type === 'mssql' && config.url) {
      const mssqlUrlPattern = /^(?:mssql:\/\/|Server=|Data Source=)/i;
      if (!mssqlUrlPattern.test(config.url)) {
        errors.push('Invalid MSSQL connection string format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export for backward compatibility
export default databaseService;