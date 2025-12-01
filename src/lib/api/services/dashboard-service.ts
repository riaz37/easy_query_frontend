import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";

/**
 * Service for user dashboard data aggregation
 */
export class DashboardService extends BaseService {
  protected readonly serviceName = 'DashboardService';

  /**
   * Get user dashboard data (aggregated)
   */
  async getUserDashboardData(userId: string): Promise<ServiceResponse<{
    accessibleDatabases: Array<{
      id: number;
      name: string;
      description: string;
      url: string;
    }>;
    recentQueries: any[];
    recentTasks: any[];
    stats: {
      totalDatabases: number;
      totalQueries: number;
      totalTasks: number;
    };
  }>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      const [databasesResponse] = await Promise.all([
        this.getAccessibleDatabases(userId),
        // Can add more parallel calls here for recent queries, tasks, etc.
      ]);

      const databases = databasesResponse.data?.databases || [];

      return {
        data: {
          accessibleDatabases: databases.map(db => ({
            id: db.id,
            name: db.name,
            description: db.description,
            url: db.url,
          })),
          recentQueries: [], // Can be populated from history endpoints
          recentTasks: [], // Can be populated from task endpoints
          stats: {
            totalDatabases: databases.length,
            totalQueries: 0, // Can be enhanced
            totalTasks: 0, // Can be enhanced
          },
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'get user dashboard data');
    }
  }

  /**
   * Get accessible databases for user
   */
  async getAccessibleDatabases(userId: string): Promise<ServiceResponse<{
    databases: Array<{
      id: number;
      name: string;
      description: string;
      url: string;
      access_level: number;
    }>;
    count: number;
  }>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      const response = await this.get<any>(
        API_ENDPOINTS.MSSQL_CONFIG_GET_USER_DATABASES(userId),
        {
          invalidationPatterns: ['databases', 'user-access']
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
        access_level: 2, // Default to full access
      }));

      return {
        data: {
          databases,
          count: databases.length,
        },
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw this.handleError(error, 'get accessible databases');
    }
  }

  /**
   * Get recent queries (from history)
   */
  async getRecentQueries(
    userId: string,
    limit: number = 10
  ): Promise<ServiceResponse<any[]>> {
    this.validateRequired({ userId }, ['userId']);

    try {
      const response = await this.get<any>(
        API_ENDPOINTS.MSSQL_GET_USER_QUERY_HISTORY(userId),
        {
          params: { limit },
          invalidationPatterns: ['history', 'queries']
        }
      );

      return {
        data: Array.isArray(response.data) ? response.data.slice(0, limit) : [],
        success: response.success,
        timestamp: response.timestamp,
      };
    } catch (error: any) {
      throw this.handleError(error, 'get recent queries');
    }
  }

  /**
   * Get recent tasks
   */
  /**
   * Get recent tasks for a user
   * NOTE: REPORT_GET_USER_TASKS endpoint removed - functionality not available in new API
   */
  async getRecentTasks(
    userId: string,
    limit: number = 10
  ): Promise<ServiceResponse<any[]>> {
    throw new Error('REPORT_GET_USER_TASKS endpoint has been removed. Recent tasks functionality is not available in the new API.');
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Export for backward compatibility
export default dashboardService;

