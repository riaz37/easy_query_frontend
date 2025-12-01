import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse, ServiceError } from "./base/base-service";
import { transformResponse } from "../transformers";
import { 
  BackgroundTasksListResponse, 
  BackgroundTaskStatusResponse, 
  BackgroundTaskDetail,
  BackgroundTask
} from '@/types/api';

/**
 * Service for handling database query background tasks
 */
export class DatabaseQueryBackgroundService extends BaseService {
  protected readonly serviceName = 'DatabaseQueryBackgroundService';

  /**
   * Get background tasks for a user
   * NOTE: MSSQL_QUERY_BACKGROUND_USER_TASKS endpoint removed - functionality not available in new API
   */
  async getUserTasks(
    userId: string, 
    limit: number = 5
  ): Promise<ServiceResponse<BackgroundTasksListResponse>> {
    throw new Error('MSSQL_QUERY_BACKGROUND_USER_TASKS endpoint has been removed. User tasks functionality is not available in the new API.');
  }

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
   * Get completed tasks only
   */
  async getCompletedTasks(
    userId: string, 
    limit: number = 10
  ): Promise<ServiceResponse<BackgroundTask[]>> {
    try {
      const response = await this.getUserTasks(userId, limit);
      
      if (!response.success) {
        return response;
      }

      const completedTasks = response.data.tasks.filter(task => task.status === 'completed');
      return this.handleResponse(completedTasks);
    } catch (error) {
      return this.handleError(error, 'getCompletedTasks');
    }
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

  /**
   * Get task statistics
   */
  async getTaskStats(userId: string): Promise<ServiceResponse<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
  }>> {
    try {
      const response = await this.getUserTasks(userId, 100); // Get more tasks for stats
      
      if (!response.success) {
        return response;
      }

      const tasks = response.data.tasks;
      const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending' || t.status === 'running').length,
        failed: tasks.filter(t => t.status === 'failed').length,
      };

      return this.handleResponse(stats);
    } catch (error) {
      return this.handleError(error, 'getTaskStats');
    }
  }

  /**
   * Delete a background task
   * NOTE: DELETE_MSSQL_QUERY_BACKGROUND_TASK endpoint removed - functionality not available in new API
   */
  async deleteTask(taskId: string): Promise<ServiceResponse<{ message: string }>> {
    throw new Error('DELETE_MSSQL_QUERY_BACKGROUND_TASK endpoint has been removed. Task deletion functionality is not available in the new API.');
  }
}

// Export singleton instance
export const databaseQueryBackgroundService = new DatabaseQueryBackgroundService();

// Export for backward compatibility
export default databaseQueryBackgroundService;