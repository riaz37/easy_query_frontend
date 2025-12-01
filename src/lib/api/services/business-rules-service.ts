import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import {
  MSSQLConfigData,
  MSSQLConfigTaskResponse,
  TaskStatusResponse,
} from "@/types/api";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Service for managing business rules
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class BusinessRulesService extends BaseService {
  protected readonly serviceName = 'BusinessRulesService';

  /**
   * Get business rules for a specific database
   */
  async getBusinessRules(databaseId: number): Promise<ServiceResponse<string>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    try {
      const response = await this.get<MSSQLConfigData>(
        API_ENDPOINTS.MSSQL_CONFIG_GET(databaseId)
      );

      // Extract business rule from the response
      const businessRule = response.data?.business_rule || "";

      return {
        data: businessRule,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.statusCode === 404) {
        return {
          data: "",
          success: true,
          timestamp: new Date().toISOString(),
        };
      }
      
      throw error;
    }
  }

  /**
   * Update business rules for a specific database
   */
  async updateBusinessRules(
    content: string, 
    databaseId: number
  ): Promise<ServiceResponse<MSSQLConfigTaskResponse>> {
    this.validateRequired({ content, databaseId }, ['content', 'databaseId']);
    this.validateTypes({ content, databaseId }, { 
      content: 'string', 
      databaseId: 'number' 
    });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    if (content.trim().length === 0) {
      throw this.createValidationError('Business rules content cannot be empty');
    }

    // Validate content for security
    const validation = this.validateBusinessRulesContent(content);
    if (!validation.isValid) {
      throw this.createValidationError(
        `Business rules validation failed: ${validation.errors.join(', ')}`,
        { validationErrors: validation.errors }
      );
    }

    // Prepare the update request as FormData (matching MSSQLConfigService pattern)
    const formData = new FormData();
    formData.append("business_rule", content);

    const result = await this.put<MSSQLConfigTaskResponse>(
      API_ENDPOINTS.MSSQL_CONFIG_UPDATE(databaseId),
      formData
    );
    
    // Invalidate database-related cache after updating business rules
    if (result.success) {
      CacheInvalidator.invalidateDatabases();
    }
    
    return result;
  }

  /**
   * Get business rules for the authenticated user's current database
   * NOTE: GET_USER_CURRENT_DB endpoint removed - requires dbId parameter directly
   */
  async getBusinessRulesForCurrentDatabase(dbId: number): Promise<ServiceResponse<string>> {
    return this.getBusinessRules(dbId);
  }

  /**
   * Update business rules for the authenticated user's current database
   * NOTE: GET_USER_CURRENT_DB endpoint removed - requires dbId parameter directly
   */
  async updateBusinessRulesForCurrentDatabase(
    content: string, 
    dbId: number
  ): Promise<ServiceResponse<MSSQLConfigTaskResponse>> {
    return await this.updateBusinessRules(content, dbId);
  }

  /**
   * Validate business rules content for security and format
   */
  validateBusinessRulesContent(content: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (typeof content !== 'string') {
      errors.push("Business rules must be a string");
      return { isValid: false, errors, warnings };
    }

    // Check if content is too short
    if (content.trim().length < 10) {
      warnings.push("Business rules content seems very short. Consider adding more detail.");
    }

    // Check if content is too long (example: 50KB limit)
    if (content.length > 50000) {
      errors.push("Business rules content is too long (maximum 50KB)");
    }

    // Check for common SQL injection patterns (basic check)
    const suspiciousPatterns = [
      /;\s*drop\s+table/i,
      /;\s*delete\s+from/i,
      /;\s*truncate\s+table/i,
      /union\s+select/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push("Business rules content contains potentially dangerous SQL patterns");
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get task status for business rules operations
   */
  async getTaskStatus(taskId: string): Promise<ServiceResponse<TaskStatusResponse>> {
    this.validateRequired({ taskId }, ['taskId']);
    this.validateTypes({ taskId }, { taskId: 'string' });

    if (taskId.trim().length === 0) {
      throw this.createValidationError('Task ID cannot be empty');
    }

    return this.get<TaskStatusResponse>(API_ENDPOINTS.MSSQL_CONFIG_GET_TASK_STATUS(taskId));
  }

  /**
   * Get all business rules for accessible databases
   */
  async getAllBusinessRules(): Promise<ServiceResponse<Array<{
    databaseId: number;
    databaseName: string;
    businessRule: string;
  }>>> {
    try {
      // Get all accessible databases
      const databasesResponse = await this.get<any>(API_ENDPOINTS.MSSQL_CONFIG_GET_ALL);
      
      const databases = Array.isArray(databasesResponse.data) 
        ? databasesResponse.data 
        : databasesResponse.data?.configs || [];

      // Get business rules for each database
      const businessRulesPromises = databases.map(async (db: MSSQLConfigData) => {
        try {
          const rulesResponse = await this.getBusinessRules(db.db_id);
          return {
            databaseId: db.db_id,
            databaseName: db.db_name,
            businessRule: rulesResponse.data,
          };
        } catch (error) {
          return {
            databaseId: db.db_id,
            databaseName: db.db_name,
            businessRule: "",
          };
        }
      });

      const businessRules = await Promise.all(businessRulesPromises);

      return {
        data: businessRules,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const businessRulesService = new BusinessRulesService();

// Export for backward compatibility
export default businessRulesService;
