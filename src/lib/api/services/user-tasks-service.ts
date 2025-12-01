import { BaseService } from './base';
import { API_ENDPOINTS, buildEndpointWithQueryParams } from '../endpoints';
import { UserTasksResponse, GetUserTasksRequest } from '@/types/reports';

/**
 * Service for managing user tasks
 */
export class UserTasksService extends BaseService {
  protected readonly serviceName = 'UserTasksService';

  /**
   * Get user tasks with optional filtering and pagination
   * NOTE: GET_USER_TASKS endpoint removed - functionality not available in new API
   */
  async getUserTasks(request: GetUserTasksRequest): Promise<UserTasksResponse> {
    throw new Error('GET_USER_TASKS endpoint has been removed. User tasks functionality is not available in the new API.');
  }

  /**
   * Get user tasks with a specific limit
   */
  async getUserTasksWithLimit(userId: string, limit: number = 10): Promise<UserTasksResponse> {
    return this.getUserTasks({ userId, limit });
  }

  /**
   * Get all user tasks (no limit)
   */
  async getAllUserTasks(userId: string): Promise<UserTasksResponse> {
    return this.getUserTasks({ userId });
  }

  /**
   * Get user tasks by status
   */
  async getUserTasksByStatus(userId: string, status: UserTasksResponse['tasks'][0]['status']): Promise<UserTasksResponse> {
    return this.getUserTasks({ userId, status });
  }
}

// Export singleton instance
export const userTasksService = new UserTasksService(); 