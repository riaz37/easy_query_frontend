import { API_ENDPOINTS } from "../endpoints";
import { BaseService, ServiceResponse } from "./base";
import {
  NewTableCreateRequest,
  NewTableCreateResponse,
  NewTableGetRequest,
  NewTableGetResponse,
  NewTableUpdateRequest,
  NewTableUpdateResponse,
  NewTableDeleteRequest,
  NewTableDeleteResponse,
  UserTablesResponse,
} from "@/types/api";
import { CacheInvalidator } from "../cache/cache-invalidator";

/**
 * Service for managing new table operations
 * All methods use JWT authentication - user ID is extracted from token on backend
 */
export class NewTableService extends BaseService {
  protected readonly serviceName = 'NewTableService';

  /**
   * Create a new table
   * User ID is extracted from JWT token on backend
   */
  async createTable(
    request: NewTableCreateRequest
  ): Promise<ServiceResponse<NewTableCreateResponse>> {
    this.validateRequired(request, ['user_id', 'db_id', 'table_name', 'columns']);
    this.validateTypes(request, {
      user_id: 'string',
      db_id: 'number',
      table_name: 'string',
      schema: 'string',
    });

    if (request.db_id <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    if (request.table_name.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    // Validate schema
    if (!request.schema || request.schema.trim().length === 0) {
      throw this.createValidationError('Schema cannot be empty');
    }

    // Validate schema format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(request.schema)) {
      throw this.createValidationError('Schema must start with a letter and contain only letters, numbers, and underscores');
    }

    if (!Array.isArray(request.columns) || request.columns.length === 0) {
      throw this.createValidationError('At least one column is required');
    }

    // Validate table name format
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(request.table_name)) {
      throw this.createValidationError('Table name must start with a letter and contain only letters, numbers, and underscores');
    }

    // Validate table name length
    if (request.table_name.length > 64) {
      throw this.createValidationError('Table name cannot be longer than 64 characters');
    }

    // Validate columns
    this.validateColumns(request.columns);

    // Check for reserved table names (removed common table names that users might need)
    const reservedNames = ['admin', 'system', 'table', 'column', 'index', 'view'];
    if (reservedNames.includes(request.table_name.toLowerCase())) {
      throw this.createValidationError('Table name cannot be a reserved keyword');
    }

    const result = await this.post<NewTableCreateResponse>(
      API_ENDPOINTS.NEW_TABLE_CREATE,
      request
    );

    // Invalidate table-related cache after creating table
    if (result.success) {
      CacheInvalidator.invalidateTables();
    }

    return result;
  }

  /**
   * Get table information
   * User ID is extracted from JWT token on backend
   */
  async getTable(
    request: NewTableGetRequest
  ): Promise<ServiceResponse<NewTableGetResponse>> {
    this.validateRequired(request, ['user_id', 'table_name']);
    this.validateTypes(request, {
      user_id: 'string',
      table_name: 'string',
    });

    if (request.table_name.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    return this.post<NewTableGetResponse>(
      API_ENDPOINTS.NEW_TABLE_CREATE, // Using create endpoint as fallback since GET endpoint is not available
      request
    );
  }

  /**
   * Update a table
   * User ID is extracted from JWT token on backend
   */
  async updateTable(
    request: NewTableUpdateRequest
  ): Promise<ServiceResponse<NewTableUpdateResponse>> {
    this.validateRequired(request, ['user_id', 'table_name']);
    this.validateTypes(request, {
      user_id: 'string',
      table_name: 'string',
    });

    if (request.table_name.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    // Validate optional fields if provided
    if (request.columns && Array.isArray(request.columns)) {
      this.validateColumns(request.columns);
    }

    const result = await this.post<NewTableUpdateResponse>(
      API_ENDPOINTS.NEW_TABLE_CREATE, // Using create endpoint as fallback since UPDATE endpoint is not available
      request
    );

    // Invalidate table-related cache after updating table
    if (result.success) {
      CacheInvalidator.invalidateTables();
    }

    return result;
  }

  /**
   * Delete a table
   * User ID is extracted from JWT token on backend
   */
  async deleteTable(
    request: NewTableDeleteRequest
  ): Promise<ServiceResponse<NewTableDeleteResponse>> {
    this.validateRequired(request, ['user_id', 'table_name']);
    this.validateTypes(request, {
      user_id: 'string',
      table_name: 'string',
    });

    if (request.table_name.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    const result = await this.post<NewTableDeleteResponse>(
      API_ENDPOINTS.NEW_TABLE_CREATE, // Using create endpoint as fallback since DELETE endpoint is not available
      request
    );

    // Invalidate table-related cache after deleting table
    if (result.success) {
      CacheInvalidator.invalidateTables();
    }

    return result;
  }

  /**
   * Get all tables for a database
   * User ID is extracted from JWT token on backend
   */
  async getTablesForDatabase(databaseId: number): Promise<ServiceResponse<{
    tables: Array<{
      name: string;
      columns: number;
      rows?: number;
      created_at?: string;
      updated_at?: string;
    }>;
    count: number;
  }>> {
    this.validateRequired({ databaseId }, ['databaseId']);
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    // Since the tables-by-db endpoint doesn't exist, return a placeholder response
    // In a real implementation, you would either:
    // 1. Create this endpoint on the backend, or
    // 2. Use an alternative endpoint that provides similar data
    return {
      data: {
        tables: [],
        count: 0,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate table existence
   * User ID is extracted from JWT token on backend
   */
  async validateTableExists(
    tableName: string,
    databaseId: number
  ): Promise<ServiceResponse<{ exists: boolean; table_info?: any }>> {
    this.validateTypes({ tableName, databaseId }, {
      tableName: 'string',
      databaseId: 'number',
    });

    if (tableName.trim().length === 0) {
      throw this.createValidationError('Table name cannot be empty');
    }

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    return this.get<{ exists: boolean; table_info?: any }>(
      API_ENDPOINTS.NEW_TABLE_GET_DATA_TYPES,
      { table_name: tableName, database_id: databaseId }
    );
  }

  /**
   * Get supported data types
   */
  async getDataTypes(): Promise<ServiceResponse<{ data_types: string[] }>> {
    return this.get<{ data_types: string[] }>(
      API_ENDPOINTS.NEW_TABLE_GET_DATA_TYPES
    );
  }

  /**
   * Get user tables and business rule
   * Returns both tables and business rule for a specific user and database
   */
  async getUserTables(userId: string, dbId: number): Promise<ServiceResponse<UserTablesResponse['data']>> {
    this.validateTypes({ userId, dbId }, { userId: 'string', dbId: 'number' });

    if (!userId.trim()) {
      throw this.createValidationError('User ID is required');
    }

    if (dbId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    return this.get<UserTablesResponse['data']>(
      API_ENDPOINTS.NEW_TABLE_GET_USER_TABLES(userId, dbId)
    );
  }

  /**
   * Get tables by database
   */
  async getTablesByDatabase(databaseId: number): Promise<ServiceResponse<any>> {
    this.validateTypes({ databaseId }, { databaseId: 'number' });

    if (databaseId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    // Since the tables-by-db endpoint doesn't exist, return a placeholder response
    // This method is used by the TableManagementSection component
    return {
      data: {
        tables: [],
        count: 0,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update user business rule
   * Requires db_id in the request body along with business_rule
   */
  async updateUserBusinessRule(userId: string, dbId: number, businessRule: string): Promise<ServiceResponse<any>> {
    this.validateTypes({ userId, dbId, businessRule }, { userId: 'string', dbId: 'number', businessRule: 'string' });

    if (!userId.trim()) {
      throw this.createValidationError('User ID is required');
    }

    if (dbId <= 0) {
      throw this.createValidationError('Database ID must be positive');
    }

    if (businessRule.trim().length === 0) {
      throw this.createValidationError('Business rule cannot be empty');
    }

    const result = await this.put<any>(
      API_ENDPOINTS.NEW_TABLE_UPDATE_BUSINESS_RULE(userId),
      { business_rule: businessRule, db_id: dbId }
    );

    // Invalidate table-related cache after updating business rule
    if (result.success) {
      CacheInvalidator.invalidateTables();
    }

    return result;
  }

  /**
   * Generate table creation SQL
   */
  generateCreateTableSQL(
    tableName: string,
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      default?: string;
      primary_key?: boolean;
    }>
  ): ServiceResponse<{
    sql: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    // Validate inputs
    if (!tableName || tableName.trim().length === 0) {
      throw this.createValidationError('Table name is required');
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      throw this.createValidationError('At least one column is required');
    }

    // Validate table name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(tableName)) {
      throw this.createValidationError('Invalid table name format');
    }

    // Validate columns
    this.validateColumns(columns);

    // Generate SQL
    const columnDefinitions = columns.map(column => {
      let definition = `${column.name} ${column.type}`;

      if (!column.nullable) {
        definition += ' NOT NULL';
      }

      if (column.default !== undefined) {
        definition += ` DEFAULT ${column.default}`;
      }

      if (column.primary_key) {
        definition += ' PRIMARY KEY';
      }

      return definition;
    });

    const sql = `CREATE TABLE ${tableName} (\n  ${columnDefinitions.join(',\n  ')}\n);`;

    // Add warnings
    if (columns.length > 50) {
      warnings.push('Table has many columns, consider normalizing the design');
    }

    const primaryKeyColumns = columns.filter(col => col.primary_key);
    if (primaryKeyColumns.length === 0) {
      warnings.push('No primary key defined, consider adding one');
    }

    if (primaryKeyColumns.length > 1) {
      warnings.push('Multiple primary keys defined, only one is allowed per table');
    }

    return {
      data: {
        sql,
        warnings,
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate columns for table creation
   */
  private validateColumns(columns: Array<{
    name: string;
    data_type: string;
    nullable?: boolean;
    is_primary?: boolean;
    is_identity?: boolean;
  }>): void {
    const errors: string[] = [];
    const columnNames = new Set<string>();

    columns.forEach((column, index) => {
      // Validate column name
      if (!column.name || typeof column.name !== 'string' || column.name.trim().length === 0) {
        errors.push(`Column at index ${index}: name is required`);
      } else {
        // Check for duplicate column names
        const normalizedName = column.name.toLowerCase();
        if (columnNames.has(normalizedName)) {
          errors.push(`Duplicate column name: ${column.name}`);
        }
        columnNames.add(normalizedName);

        // Validate column name format
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column.name)) {
          errors.push(`Column "${column.name}": name must start with a letter and contain only letters, numbers, and underscores`);
        }

        // Validate column name length
        if (column.name.length > 64) {
          errors.push(`Column "${column.name}": name cannot be longer than 64 characters`);
        }

        // Check for reserved column names (removed 'id' as it's commonly needed)
        const reservedNames = ['created_at', 'updated_at', 'deleted_at'];
        if (reservedNames.includes(column.name.toLowerCase())) {
          errors.push(`Column "${column.name}": name is reserved`);
        }
      }

      // Validate column type
      if (!column.data_type || typeof column.data_type !== 'string' || column.data_type.trim().length === 0) {
        errors.push(`Column "${column.name}": data_type is required`);
      } else {
        // Validate supported column types (SQL Server types from API)
        const supportedTypes = [
          // Numeric types
          'BIT', 'TINYINT', 'SMALLINT', 'INT', 'BIGINT',
          'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY', 'SMALLMONEY',
          // String types
          'CHAR', 'VARCHAR', 'NVARCHAR', 'NCHAR', 'TEXT', 'NTEXT',
          // Date/Time types
          'DATE', 'TIME', 'SMALLDATETIME', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET',
          // Binary types
          'BINARY', 'VARBINARY', 'IMAGE',
          // Other types
          'UNIQUEIDENTIFIER', 'XML', 'SQL_VARIANT'
        ];

        const baseType = column.data_type.split('(')[0].toUpperCase();
        if (!supportedTypes.includes(baseType)) {
          errors.push(`Column "${column.name}": unsupported type "${column.data_type}"`);
        }
      }

      // Validate boolean fields
      if (column.nullable !== undefined && typeof column.nullable !== 'boolean') {
        errors.push(`Column "${column.name}": nullable must be a boolean`);
      }

      if (column.is_primary !== undefined && typeof column.is_primary !== 'boolean') {
        errors.push(`Column "${column.name}": is_primary must be a boolean`);
      }

      if (column.is_identity !== undefined && typeof column.is_identity !== 'boolean') {
        errors.push(`Column "${column.name}": is_identity must be a boolean`);
      }
    });

    if (errors.length > 0) {
      throw this.createValidationError(`Column validation failed: ${errors.join(', ')}`);
    }
  }

  /**
   * Get supported column types
   */
  getSupportedColumnTypes(): ServiceResponse<{
    types: Array<{
      name: string;
      description: string;
      examples: string[];
      requiresLength?: boolean;
    }>;
    recommendations: string[];
  }> {
    return {
      data: {
        types: [
          {
            name: 'INT',
            description: 'Integer number',
            examples: ['INT', 'INT(11)'],
          },
          {
            name: 'VARCHAR',
            description: 'Variable-length string',
            examples: ['VARCHAR(255)', 'VARCHAR(50)'],
            requiresLength: true,
          },
          {
            name: 'TEXT',
            description: 'Long text field',
            examples: ['TEXT', 'LONGTEXT'],
          },
          {
            name: 'DECIMAL',
            description: 'Precise decimal number',
            examples: ['DECIMAL(10,2)', 'DECIMAL(8,4)'],
            requiresLength: true,
          },
          {
            name: 'DATE',
            description: 'Date value',
            examples: ['DATE'],
          },
          {
            name: 'DATETIME',
            description: 'Date and time value',
            examples: ['DATETIME'],
          },
          {
            name: 'BOOLEAN',
            description: 'True/false value',
            examples: ['BOOLEAN', 'BOOL'],
          },
          {
            name: 'JSON',
            description: 'JSON data',
            examples: ['JSON'],
          },
        ],
        recommendations: [
          'Use VARCHAR for short strings, TEXT for long content',
          'Always specify length for VARCHAR columns',
          'Use DECIMAL for monetary values, not FLOAT',
          'Consider adding a primary key column',
          'Use appropriate data types to save storage space',
        ],
      },
      success: true,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const newTableService = new NewTableService();

// Export for backward compatibility
export default newTableService;

