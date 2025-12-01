import { BaseService } from './base';
import { API_ENDPOINTS } from '../endpoints';
import { CacheInvalidator } from '../cache/cache-invalidator';
import {
  GenerateReportRequest,
  GenerateReportResponse,
  ReportTaskStatus,
  UpdateReportStructureRequest,
  ReportResults,
  ReportHistoryItem,
  ReportFilterOptions,
  ReportGenerationOptions
} from '@/types/reports';

/**
 * Service for managing report generation and management
 */
export class ReportService extends BaseService {
  protected readonly serviceName = 'ReportService';

  /**
   * Start a background report generation task
   * NOTE: GENERATE_REPORT_BACKGROUND endpoint removed - functionality not available in new API
   */
  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    throw new Error('GENERATE_REPORT_BACKGROUND endpoint has been removed. Report generation functionality is not available in the new API.');
  }

  /**
   * Get the status of a report generation task
   * NOTE: GET_REPORT_TASK_STATUS endpoint removed - functionality not available in new API
   */
  async getTaskStatus(taskId: string): Promise<ReportTaskStatus> {
    throw new Error('GET_REPORT_TASK_STATUS endpoint has been removed. Report task status functionality is not available in the new API.');
  }

  /**
   * Update the report structure for a specific database configuration
   * NOTE: Updated to use MSSQL_CONFIG_UPDATE_REPORT_STRUCTURE
   */
  async updateReportStructure(
    dbId: number,
    request: UpdateReportStructureRequest
  ): Promise<void> {
    await this.put(
      API_ENDPOINTS.MSSQL_CONFIG_UPDATE_REPORT_STRUCTURE(dbId),
      request
    );
    
    // Invalidate report-related cache after updating user structure
    CacheInvalidator.invalidateReports();
  }

  /**
   * Update the report structure for a specific database configuration
   * Alias for updateReportStructure
   */
  async updateUserReportStructure(
    dbId: number,
    request: UpdateReportStructureRequest
  ): Promise<void> {
    return this.updateReportStructure(dbId, request);
  }

  /**
   * Get the current report structure for a specific database
   * NOTE: Updated to use dbId instead of userId - GET_USER_CURRENT_DB endpoint removed
   */
  async getReportStructure(dbId: number): Promise<string> {
    const response = await this.get<any>(
      API_ENDPOINTS.MSSQL_CONFIG_GET(dbId)
    );
    return response.data?.report_structure || '';
  }

  /**
   * Get report generation history with optional filtering
   * NOTE: Report history functionality not available in new API
   */
  async getReportHistory(filters?: ReportFilterOptions): Promise<ReportHistoryItem[]> {
    throw new Error('Report history functionality is not available in the new API.');
  }

  /**
   * Get user tasks with pagination
   * NOTE: GET_USER_TASKS endpoint removed - functionality not available in new API
   */
  async getUserTasks(userId: string, limit: number = 5, offset: number = 0): Promise<{
    tasks: any[];
    total: number;
    hasMore: boolean;
  }> {
    throw new Error('GET_USER_TASKS endpoint has been removed. User tasks functionality is not available in the new API.');
  }

  /**
   * Delete a report task
   * NOTE: DELETE_REPORT_TASK endpoint removed - functionality not available in new API
   */
  async deleteReportTask(taskId: string): Promise<void> {
    throw new Error('DELETE_REPORT_TASK endpoint has been removed. Report task deletion functionality is not available in the new API.');
  }

  /**
   * Monitor a report generation task with progress updates
   */
  async monitorReportTask(
    taskId: string,
    options: ReportGenerationOptions = {}
  ): Promise<ReportResults> {
    const {
      onProgress,
      onComplete,
      onError,
      pollInterval = 2000,
      timeout = 300000 // 5 minutes default
    } = options;

    const startTime = Date.now();
    let lastStatus: ReportTaskStatus | null = null;

    while (true) {
      try {
        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Report generation timeout exceeded');
        }

        const status = await this.getTaskStatus(taskId);
        
        // Call progress callback if status changed
        if (!lastStatus || lastStatus.status !== status.status) {
          onProgress?.(status);
          lastStatus = status;
        }

        // Check if completed
        if (status.status === 'completed' && status.results) {
          onComplete?.(status.results);
          return status.results;
        }

        // Check if failed
        if (status.status === 'failed') {
          const error = new Error(status.error || 'Report generation failed');
          onError?.(error);
          throw error;
        }

        // Wait before next poll
        await this.delay(pollInterval);
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    }
  }

  /**
   * Generate a report and wait for completion
   */
  async generateReportAndWait(
    request: GenerateReportRequest,
    options: ReportGenerationOptions = {}
  ): Promise<ReportResults> {
    // Start the report generation
    const response = await this.generateReport(request);
    
    // Monitor the task until completion
    return this.monitorReportTask(response.task_id, options);
  }

  /**
   * Build filter parameters for report history
   */
  private buildFilterParams(filters: ReportFilterOptions): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (filters.status) params.status = filters.status;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.user_id) params.user_id = filters.user_id;
    
    return params;
  }

  /**
   * Utility method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get a formatted progress message for a task status
   */
  getProgressMessage(status: ReportTaskStatus): string {
    switch (status.status) {
      case 'pending':
        return 'Report generation queued...';
      case 'processing':
        return `Processing queries: ${status.processed_queries}/${status.total_queries} (${status.progress_percentage}%)`;
      case 'completed':
        return 'Report generation completed successfully!';
      case 'failed':
        return `Report generation failed: ${status.error || 'Unknown error'}`;
      default:
        return 'Unknown status';
    }
  }

  /**
   * Get estimated time remaining for a task
   */
  getEstimatedTimeRemaining(status: ReportTaskStatus): string | null {
    if (status.status === 'completed' || status.status === 'failed') {
      return null;
    }

    if (status.progress_percentage === 0) {
      return 'Calculating...';
    }

    if (status.processing_time_seconds && status.progress_percentage > 0) {
      const elapsedSeconds = status.processing_time_seconds;
      const progressRatio = status.progress_percentage / 100;
      const estimatedTotalSeconds = elapsedSeconds / progressRatio;
      const remainingSeconds = estimatedTotalSeconds - elapsedSeconds;
      
      if (remainingSeconds < 60) {
        return `${Math.round(remainingSeconds)}s`;
      } else if (remainingSeconds < 3600) {
        return `${Math.round(remainingSeconds / 60)}m`;
      } else {
        return `${Math.round(remainingSeconds / 3600)}h ${Math.round((remainingSeconds % 3600) / 60)}m`;
      }
    }

    return 'Calculating...';
  }
} 