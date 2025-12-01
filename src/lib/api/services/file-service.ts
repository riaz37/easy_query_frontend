import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import {
  SmartFileSystemRequest,
  SmartFileSystemResponse,
  BundleTaskStatusResponse,
  BundleTaskStatusAllResponse,
  FilesSearchRequest,
  FilesSearchResponse,
} from "@/types/api";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Service for handling file-related API calls
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class FileService extends BaseService {
  protected readonly serviceName = 'FileService';

  /**
   * Upload files to smart file system
   * Supports both config_ids (for vector DB) and user_ids (legacy)
   */
  async uploadToSmartFileSystem(request: {
    files: File[];
    file_descriptions: string[];
    table_names?: string[];
    config_ids?: number | number[];
    user_ids?: string;
    use_table?: boolean;
  }): Promise<ServiceResponse<SmartFileSystemResponse>> {
    this.validateRequired(request, ['files', 'file_descriptions']);

    if (!Array.isArray(request.files) || request.files.length === 0) {
      throw this.createValidationError('At least one file is required');
    }

    if (!Array.isArray(request.file_descriptions) || request.file_descriptions.length === 0) {
      throw this.createValidationError('File descriptions are required');
    }

    // Either config_ids or user_ids must be provided
    const hasConfigIds = request.config_ids !== undefined;
    const hasUserIds = request.user_ids !== undefined && request.user_ids.trim().length > 0;

    if (!hasConfigIds && !hasUserIds) {
      throw this.createValidationError('Either config_ids or user_ids must be provided');
    }

    // Add default static table name if not provided or empty
    if (!request.table_names || !Array.isArray(request.table_names) || request.table_names.length === 0) {
      // Use a static default table name for each file
      request.table_names = request.files.map(() => 'file_uploads');
    }

    // Table names are only required if use_table is true
    if (request.use_table !== false && request.table_names) {
      if (!Array.isArray(request.table_names) || request.table_names.length === 0) {
        throw this.createValidationError('Table names are required when using tables');
      }
      if (request.files.length !== request.table_names.length) {
        throw this.createValidationError('Files and table names arrays must have the same length when using tables');
      }
    }

    if (request.files.length !== request.file_descriptions.length) {
      throw this.createValidationError('Files and descriptions arrays must have the same length');
    }

    // Validate file types and sizes
    const validationErrors = this.validateFiles(request.files);
    if (validationErrors.length > 0) {
      throw this.createValidationError(`File validation failed: ${validationErrors.join(', ')}`);
    }

    const formData = new FormData();
    
    // Add files
    request.files.forEach((file) => {
      formData.append('files', file);
    });

    // Add metadata - match the exact format from curl command
    formData.append('file_descriptions', request.file_descriptions[0] || 'string');
    
    // Add table_names if provided
    if (request.table_names && request.table_names.length > 0) {
      formData.append('table_names', request.table_names[0] || '');
    } else {
      formData.append('table_names', '');
    }
    
    // Add config_ids if provided (for vector DB), otherwise use user_ids
    if (hasConfigIds) {
      const configIds = Array.isArray(request.config_ids) 
        ? request.config_ids 
        : [request.config_ids!];
      formData.append('config_ids', String(configIds[0]));
    } else if (hasUserIds) {
      formData.append('user_ids', request.user_ids!);
    }

    // Use the new endpoint for config_ids, fallback to backend for user_ids
    const endpoint = hasConfigIds 
      ? API_ENDPOINTS.FILES_SMART_FILE_SYSTEM 
      : API_ENDPOINTS.FILES_SMART_FILE_SYSTEM_BACKEND;

    const result = await this.post<SmartFileSystemResponse>(
      endpoint,
      formData,
      {
        headers: {
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      }
    );
    
    // Invalidate file-related cache after uploading files
    if (result.success) {
      CacheInvalidator.invalidateQueries();
    }
    
    return result;
  }

  /**
   * Get bundle task status by bundle ID
   */
  async getBundleTaskStatus(bundleId: string): Promise<ServiceResponse<BundleTaskStatusResponse>> {
    this.validateRequired({ bundleId }, ['bundleId']);
    this.validateTypes({ bundleId }, { bundleId: 'string' });

    if (bundleId.trim().length === 0) {
      throw this.createValidationError('Bundle ID cannot be empty');
    }

    return this.getFresh<BundleTaskStatusResponse>(
      API_ENDPOINTS.FILES_BUNDLE_TASK_STATUS(bundleId)
    );
  }

  /**
   * Get all bundle task statuses
   * NOTE: BUNDLE_TASK_STATUS_ALL endpoint removed - use getBundleTaskStatus for individual bundles
   */
  async getAllBundleTaskStatuses(): Promise<ServiceResponse<BundleTaskStatusAllResponse>> {
    throw new Error('BUNDLE_TASK_STATUS_ALL endpoint has been removed. Use getBundleTaskStatus for individual bundles.');
  }


  /**
   * Search files synchronously (returns result directly)
   * User ID can be passed explicitly or extracted from JWT token on backend
   */
  async searchFiles(request: FilesSearchRequest): Promise<ServiceResponse<FilesSearchResponse>> {
    this.validateRequired(request, ['query']);
    this.validateTypes(request, { query: 'string' });

    if (request.query.trim().length === 0) {
      throw this.createValidationError('Search query cannot be empty');
    }

    // Validate optional parameters
    if (request.intent_top_k !== undefined && request.intent_top_k <= 0) {
      throw this.createValidationError('intent_top_k must be positive');
    }

    if (request.chunk_top_k !== undefined && request.chunk_top_k <= 0) {
      throw this.createValidationError('chunk_top_k must be positive');
    }

    if (request.max_chunks_for_answer !== undefined && request.max_chunks_for_answer <= 0) {
      throw this.createValidationError('max_chunks_for_answer must be positive');
    }

    // Build request body with all parameters
    const requestBody: any = {
      query: request.query,
      config_id: request.config_id,
      user_id: request.user_id,
      use_intent_reranker: request.use_intent_reranker ?? false,
      use_chunk_reranker: request.use_chunk_reranker ?? false,
      use_dual_embeddings: request.use_dual_embeddings ?? true,
      intent_top_k: request.intent_top_k ?? 20,
      chunk_top_k: request.chunk_top_k ?? 40,
      chunk_source: request.chunk_source ?? "reranked",
      max_chunks_for_answer: request.max_chunks_for_answer ?? 40,
      answer_style: request.answer_style ?? "detailed",
      table_specific: request.table_specific ?? false,
      tables: request.tables ?? []
    };

    // Remove undefined values to keep request clean
    Object.keys(requestBody).forEach(key => {
      if (requestBody[key] === undefined) {
        delete requestBody[key];
      }
    });

    console.log("FileService - Searching files synchronously:", requestBody);

    // Use FILES_SEARCH_SYNC for synchronous search (returns result directly)
    return this.post<FilesSearchResponse>(API_ENDPOINTS.FILES_SEARCH_SYNC, requestBody);
  }

  /**
   * Start a background file search
   */
  async startBackgroundFileSearch(request: FilesSearchRequest): Promise<ServiceResponse<{ task_id: string }>> {
    const requestBody: any = {
      query: request.query,
      config_id: request.config_id ?? 1, // Default to 0 if not provided
      user_id: request.user_id,
      use_intent_reranker: request.use_intent_reranker ?? false,
      use_chunk_reranker: request.use_chunk_reranker ?? false,
      use_dual_embeddings: request.use_dual_embeddings ?? true,
      intent_top_k: request.intent_top_k ?? 20,
      chunk_top_k: request.chunk_top_k ?? 40,
      chunk_source: request.chunk_source ?? "reranked",
      max_chunks_for_answer: request.max_chunks_for_answer ?? 40,
      answer_style: request.answer_style ?? "detailed",
      table_specific: request.table_specific ?? false,
      tables: request.tables ?? []
    };

    // Remove undefined values to keep request clean
    Object.keys(requestBody).forEach(key => {
      if (requestBody[key] === undefined) {
        delete requestBody[key];
      }
    });

    console.log("FileService - Starting background file search:", requestBody);

    // Use FILES_SEARCH_SYNC for synchronous search or background endpoint if available
    // For now, using sync endpoint - background search may need to be implemented differently
    return this.post<{ task_id: string }>(API_ENDPOINTS.FILES_SEARCH_SYNC, requestBody);
  }

  /**
   * Poll for background file search completion
   */
  async pollBackgroundFileSearch(taskId: string): Promise<ServiceResponse<FilesSearchResponse>> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusResponse = await this.getFresh<{
          status_code: number;
          task: {
            task_id: string;
            status: 'queued' | 'running' | 'completed' | 'failed';
            result?: {
              status_code: number;
              answer: {
                answer: string;
                sources_used: number;
                confidence: string;
                context_length: number;
                prompt_length: number;
                sources: Array<{
                  document_number: number;
                  file_name: string;
                  file_path: string;
                  page_range: string;
                  title: string;
                }>;
              };
              user_id_used: string;
              database_config: {
                host: string;
                port: number;
                database: string;
                schema: string;
              };
            };
          };
        }>(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://176.9.16.194:8200"}/files/search/background/${taskId}/status`);

        if (statusResponse.success && statusResponse.data) {
          const { task } = statusResponse.data;
          
          if (task.status === 'completed' && task.result?.answer) {
            console.log("FileService - Background file search completed successfully");
            return {
              success: true,
              data: task.result,
              timestamp: new Date().toISOString()
            };
          } else if (task.status === 'failed') {
            throw new Error('Background file search failed');
          } else {
            // Still processing, wait and try again
            console.log(`FileService - File search status: ${task.status}, attempt ${attempt + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        } else {
          throw new Error('Failed to get file search status');
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        console.warn(`FileService - Polling attempt ${attempt + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('File search timeout: Maximum polling attempts reached');
  }

  /**
   * Validate uploaded files
   */
  private validateFiles(files: File[]): string[] {
    const errors: string[] = [];
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    files.forEach((file, index) => {
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1} (${file.name}) is too large. Maximum size is 50MB`);
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1} (${file.name}) has unsupported type: ${file.type}`);
      }

      // Check file name
      if (file.name.length > 255) {
        errors.push(`File ${index + 1} name is too long. Maximum length is 255 characters`);
      }

      // Check for potentially dangerous file names
      if (/[<>:"|?*]/.test(file.name)) {
        errors.push(`File ${index + 1} name contains invalid characters`);
      }
    });

    return errors;
  }

  /**
   * Get file upload progress for a bundle
   */
  async getUploadProgress(bundleId: string): Promise<ServiceResponse<{
    bundleId: string;
    overallProgress: number;
    fileProgresses: Array<{
      fileName: string;
      status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
      progress: number;
      error?: string;
    }>;
  }>> {
    const statusResponse = await this.getBundleTaskStatus(bundleId);
    
    if (!statusResponse.success) {
      throw new Error(`Failed to get bundle status: ${statusResponse.error}`);
    }

    const status = statusResponse.data;
    
    const fileProgresses = status.individual_tasks.map(task => ({
      fileName: task.filename,
      status: task.status as 'pending' | 'uploading' | 'processing' | 'completed' | 'failed',
      progress: task.status === 'completed' ? 100 : 
                task.status === 'failed' ? 0 : 
                parseInt(task.progress) || 0,
      error: task.error_message || undefined,
    }));

    return {
      data: {
        bundleId,
        overallProgress: status.progress_percentage,
        fileProgresses,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Cancel file upload bundle
   */
  async cancelUpload(bundleId: string): Promise<ServiceResponse<void>> {
    this.validateRequired({ bundleId }, ['bundleId']);
    this.validateTypes({ bundleId }, { bundleId: 'string' });

    if (bundleId.trim().length === 0) {
      throw this.createValidationError('Bundle ID cannot be empty');
    }

    // This would require a cancel endpoint in the API
    // For now, we'll return a placeholder response
    return {
      data: undefined as any,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get supported file types
   */
  getSupportedFileTypes(): ServiceResponse<{
    types: string[];
    maxSize: number;
    description: string;
  }> {
    return {
      data: {
        types: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
          'application/json',
        ],
        maxSize: 50 * 1024 * 1024, // 50MB
        description: 'Supported file types include PDF, Word documents, Excel spreadsheets, text files, CSV, and JSON files. Maximum file size is 50MB.',
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const fileService = new FileService();

// Export for backward compatibility
export default fileService;
