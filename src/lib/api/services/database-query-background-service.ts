import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base/base-service";
import { 
  BackgroundTaskStatusResponse, 
  BackgroundTaskDetail,
} from '@/types/api';

/**
 * Service for handling database query background tasks
 */
export class DatabaseQueryBackgroundService extends BaseService {
  protected readonly serviceName = 'DatabaseQueryBackgroundService';


  /**
   * Get specific task status and result
   */
  async getTaskStatus(taskId: string): Promise<ServiceResponse<BackgroundTaskDetail>> {
    const response = await this.getFresh<BackgroundTaskStatusResponse>(
      API_ENDPOINTS.MSSQL_QUERY_BACKGROUND_STATUS(taskId)
    );
    
    return {
      ...response,
      data: response.data.task
    };
  }


  /**
   * Get task with full result data
   */
  async getTaskWithResult(taskId: string): Promise<ServiceResponse<BackgroundTaskDetail | null>> {
    try {
      const response = await this.getTaskStatus(taskId);
      
      if (!response.success) {
        return this.handleResponse(null);
      }

      return this.handleResponse(response.data);
    } catch (error) {
      return this.handleError(error, 'getTaskWithResult');
    }
  }

}

// Export singleton instance
export const databaseQueryBackgroundService = new DatabaseQueryBackgroundService();

// Export for backward compatibility
export default databaseQueryBackgroundService;