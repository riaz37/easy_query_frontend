import { API_ENDPOINTS, buildEndpointWithQueryParams } from "../endpoints";
import { BaseService, ServiceResponse, ServiceError } from "./base";
import { transformResponse } from "../transformers";

/**
 * Search query parameters
 */
export interface SearchQueryParams {
  query: string;
  useIntentReranker?: boolean;
  useChunkReranker?: boolean;
  useDualEmbeddings?: boolean;
  intentTopK?: number;
  chunkTopK?: number;
  chunkSource?: string;
  maxChunksForAnswer?: number;
  answerStyle?: string;
}

/**
 * Database query parameters
 */
export interface DbQueryParams {
  question: string;
  userId?: string; // Added userId to DbQueryParams (not sent to API, extracted from JWT)
  db_id?: number; // Database ID (changed from database_id to match API)
  model?: 'gemini' | 'llama-3.3-70b-versatile' | 'openai/gpt-oss-120b'; // AI model selection
  table_agent_mode?: 'embedding' | 'llm' | string; // Table agent mode
  use_column_agent?: boolean; // Whether to use column agent
  background?: boolean; // Whether to run query in background
}

/**
 * Query result data structure matching API response
 */
export interface QueryResultData {
  sql: string;
  data: any[];
  history: Array<{
    timestamp: string;
    question: string;
    query: string;
    results_summary: string;
  }>;
  model_used: string;
}

/**
 * Service for handling query-related API calls
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class QueryService extends BaseService {
  protected readonly serviceName = 'QueryService';

  /**
   * Send a search query to the API
   * NOTE: SEARCH endpoint removed - use MSSQL_QUERY for database queries instead
   */
  async search(params: SearchQueryParams): Promise<ServiceResponse<QueryResultData>> {
    throw new Error('SEARCH endpoint has been removed. Use query() method with MSSQL_QUERY endpoint instead.');
  }

  /**
   * Send a database query to the API (synchronous)
   * User ID is extracted from JWT token on backend
   * All parameters are sent as query parameters, not in the request body
   */
  async query(params: DbQueryParams): Promise<ServiceResponse<QueryResultData>> {
    // Validate required parameters
    this.validateRequired(params, ['question']);
    this.validateTypes(params, { question: 'string' });

    if (!params.question.trim()) {
      throw this.createValidationError('Query question cannot be empty');
    }

    // Build query parameters object
    const queryParams: Record<string, any> = {
      question: params.question,
    };
    
    if (params.db_id !== undefined) {
      queryParams.db_id = params.db_id;
    }
    if (params.userId) {
      queryParams.user_id = params.userId;
    }
    if (params.model) {
      queryParams.model = params.model;
    }
    if (params.table_agent_mode !== undefined) {
      queryParams.table_agent_mode = params.table_agent_mode;
    }
    if (params.use_column_agent !== undefined) {
      queryParams.use_column_agent = params.use_column_agent;
    }
    if (params.background !== undefined) {
      queryParams.background = params.background;
    }

    // Build endpoint with query parameters
    const endpoint = buildEndpointWithQueryParams(API_ENDPOINTS.MSSQL_QUERY, queryParams);

    console.log("QueryService - Sending query:", {
      question: params.question,
      model: params.model || 'gemini',
      db_id: params.db_id,
      user_id: params.userId,
      table_agent_mode: params.table_agent_mode,
      use_column_agent: params.use_column_agent,
      background: params.background
    });

    // POST request with empty body, all params in query string
    // If background=true: API returns { status_code: 200, task_id: string }
    // If background=false: API returns { status_code: 200, payload: { sql, data, history, model_used } }
    const response = await this.post<{
      status_code: number;
      task_id?: string;
      payload?: QueryResultData;
    }>(endpoint, {}, {
      timeout: params.background ? 30000 : 120000, // Shorter timeout for background (just to get task_id)
    });

    // Handle background query response
    if (params.background && response.success && response.data?.task_id) {
      // Return task_id for background processing
      return {
        success: true,
        data: { task_id: response.data.task_id } as any,
        timestamp: response.timestamp || new Date().toISOString()
      };
    }

    // Handle synchronous query response
    if (response.success && response.data) {
      // Handle both nested (response.data.payload) and direct (response.data) structures
      const payload = response.data.payload || response.data;
      return {
        success: true,
        data: payload,
        timestamp: response.timestamp || new Date().toISOString()
      };
    }

    return response as ServiceResponse<QueryResultData>;
  }

  /**
   * Poll for background query completion
   */
  async pollBackgroundQuery(taskId: string): Promise<ServiceResponse<QueryResultData>> {
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
              payload: QueryResultData;
            };
          };
        }>(API_ENDPOINTS.MSSQL_QUERY_BACKGROUND_STATUS(taskId));

        if (statusResponse.success && statusResponse.data) {
          const { task } = statusResponse.data;
          
          if (task.status === 'completed' && task.result?.payload) {
            console.log("QueryService - Background query completed successfully");
            return {
              success: true,
              data: task.result.payload,
              timestamp: new Date().toISOString()
            };
          } else if (task.status === 'failed') {
            throw new Error('Background query failed');
          } else {
            // Still processing, wait and try again
            console.log(`QueryService - Query status: ${task.status}, attempt ${attempt + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        } else {
          throw new Error('Failed to get query status');
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        console.warn(`QueryService - Polling attempt ${attempt + 1} failed:`, error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Query timeout: Maximum polling attempts reached');
  }

  /**
   * Send a database query directly with question string and user ID
   * User ID is required for database access (extracted from JWT on backend)
   */
  async sendDatabaseQuery(
    question: string, 
    userId: string, 
    model?: string,
    dbId?: number,
    options?: {
      table_agent_mode?: 'embedding' | 'llm' | string;
      use_column_agent?: boolean;
      background?: boolean;
    }
  ): Promise<ServiceResponse<QueryResultData>> {
    if (!question || typeof question !== 'string') {
      throw this.createValidationError('Question must be a non-empty string');
    }

    if (!userId || typeof userId !== 'string') {
      throw this.createValidationError('User ID is required for database queries');
    }

    return this.query({ 
      question, 
      userId, 
      model: model as any,
      db_id: dbId,
      table_agent_mode: options?.table_agent_mode,
      use_column_agent: options?.use_column_agent,
      background: options?.background
    });
  }

  /**
   * Get the status of a background query without polling
   */
  async getBackgroundQueryStatus(taskId: string): Promise<ServiceResponse<{
    task_id: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    result?: QueryResultData;
  }>> {
    if (!taskId || typeof taskId !== 'string') {
      throw this.createValidationError('Task ID must be a non-empty string');
    }

    const statusResponse = await this.getFresh<{
      status_code: number;
      task: {
        task_id: string;
        status: 'queued' | 'running' | 'completed' | 'failed';
        result?: {
          status_code: number;
          payload: QueryResultData;
        };
      };
    }>(API_ENDPOINTS.MSSQL_QUERY_BACKGROUND_STATUS(taskId));

    if (statusResponse.success && statusResponse.data) {
      const { task } = statusResponse.data;
      return {
        success: true,
        data: {
          task_id: task.task_id,
          status: task.status,
          result: task.result?.payload
        },
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: false,
      error: 'Failed to get query status',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate query content for potential security issues
   */
  validateQuerySecurity(query: string): { isValid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for potential SQL injection patterns
    const suspiciousPatterns = [
      /;\s*drop\s+/i,
      /;\s*delete\s+from\s+/i,
      /;\s*truncate\s+/i,
      /;\s*alter\s+table\s+/i,
      /union\s+select/i,
      /exec\s*\(/i,
      /execute\s*\(/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        warnings.push('Query contains potentially dangerous SQL patterns');
        break;
      }
    }

    // Check for very long queries
    if (query.length > 10000) {
      warnings.push('Query is very long and may impact performance');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  /**
   * Get query execution statistics
   */
  async getQueryStats(): Promise<ServiceResponse<any>> {
    // This would typically call a dedicated stats endpoint
    // For now, return a placeholder
    return {
      data: {
        totalQueries: 0,
        averageExecutionTime: 0,
        successRate: 100,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const queryService = new QueryService();

// Export for backward compatibility
export default queryService;
