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
 * Service for handling file query background tasks
 */
export class FileQueryBackgroundService extends BaseService {
  protected readonly serviceName = 'FileQueryBackgroundService';

  /**
   * Get background tasks for a user
   * NOTE: FILE_QUERY_BACKGROUND_USER_TASKS endpoint removed - use FILES_SEARCH_BACKGROUND_CONFIG_TASKS with configId instead
   */
  async getUserTasks(
    configId: number, 
    limit: number = 5
  ): Promise<ServiceResponse<BackgroundTasksListResponse>> {
    const response = await this.get<BackgroundTasksListResponse>(
      API_ENDPOINTS.FILES_SEARCH_BACKGROUND_CONFIG_TASKS(configId),
      { limit }
    );
    
    return response;
  }

  /**
   * Get specific task status and result
   * NOTE: Using status endpoint pattern - may need adjustment based on actual API
   */
  async getTaskStatus(taskId: string): Promise<ServiceResponse<BackgroundTaskDetail>> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://176.9.16.194:8200";
    const endpoint = `${baseUrl}/files/search/background/${taskId}/status`;
    const response = await this.get<BackgroundTaskStatusResponse>(endpoint);
    
    return {
      ...response,
      data: response.data.task
    };
  }

  /**
   * Get completed tasks only
   * NOTE: Updated to use configId instead of userId
   */
  async getCompletedTasks(
    configId: number, 
    limit: number = 10
  ): Promise<ServiceResponse<BackgroundTask[]>> {
    try {
      const response = await this.getUserTasks(configId, limit);
      
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
   * NOTE: Updated to use configId instead of userId
   */
  async getTaskStats(configId: number): Promise<ServiceResponse<{
    total: number;
    completed: number;
    pending: number;
    failed: number;
  }>> {
    try {
      const response = await this.getUserTasks(configId, 100); // Get more tasks for stats
      
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
   */
  async deleteTask(taskId: string): Promise<ServiceResponse<{ message: string }>> {
    try {
      const response = await this.delete<{ message: string }>(
        API_ENDPOINTS.FILES_SEARCH_BACKGROUND_DELETE(taskId)
      );
      
      return response;
    } catch (error) {
      return this.handleError(error, 'deleteTask');
    }
  }
}

// Export singleton instance
export const fileQueryBackgroundService = new FileQueryBackgroundService();

// Export for backward compatibility
export default fileQueryBackgroundService;
