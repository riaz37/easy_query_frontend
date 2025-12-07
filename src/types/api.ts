// API-related types and interfaces

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationInfo;
}

export interface ApiRequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  retryCount?: number;
  url?: string;
  body?: any;
  skipCache?: boolean;
  cacheTTL?: number;
  invalidationPatterns?: string[]; // Patterns to invalidate when this data changes
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Smart File System Types
export interface SmartFileSystemRequest {
  files: File[];
  file_descriptions: string[];
  table_names?: string[]; // Optional: defaults to 'file_uploads' if not provided
  config_ids?: number | number[]; // Optional: for vector DB configs
  user_ids?: string; // Optional: single user ID string (either config_ids or user_ids must be provided)
  use_table?: boolean; // Optional: whether to use table names or not
}

export interface TaskId {
  task_id: string;
  pipeline: string;
  filename: string;
  file_description: string;
  table_name: string;
  user_id: string;
  status: string;
}

export interface SmartFileSystemResponse {
  message: string;
  bundle_id: string; // Always present when using smart_file_system endpoint (with config_ids)
  total_files: number;
  semi_structured_files: number;
  unstructured_files: number;
  processing_mode: string;
  task_ids: TaskId[];
}

// Bundle Task Status Types
export interface IndividualTask {
  task_id: string;
  status: string;
  filename: string;
  progress: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface BundleTaskStatusResponse {
  bundle_id: string;
  status: string;
  total_files: number;
  completed_files: number;
  failed_files: number;
  remaining_files: number;
  progress_percentage: number;
  created_at: string;
  last_updated: string;
  current_processing_files: string[];
  remaining_file_names: string[];
  individual_tasks: IndividualTask[];
}

// Bundle Status All Types
export interface BundleSummary {
  bundle_id: string;
  status: string;
  total_files: number;
  completed_files: number;
  failed_files: number;
  remaining_files: number;
  progress_percentage: number;
  created_at: string;
  last_updated: string;
  filenames: string[];
}

export interface BundleTaskStatusAllResponse {
  total_bundles: number;
  bundles: BundleSummary[];
}

// Files Search Types
export interface FilesSearchRequest {
  query: string;
  config_id?: number; // Configuration ID for file search (required by API)
  user_id?: string; // Now optional - extracted from JWT token on backend
  use_intent_reranker?: boolean;
  use_chunk_reranker?: boolean;
  use_dual_embeddings?: boolean;
  intent_top_k?: number;
  chunk_top_k?: number;
  chunk_source?: string;
  max_chunks_for_answer?: number;
  answer_style?: string;
  table_specific?: boolean;
  tables?: string[];
  file_ids?: string[]; // Added for file-specific queries
}

export interface SearchAnswer {
  answer: string;
  sources_used: number;
  confidence: string;
  context_length?: number;
  prompt_length?: number;
  sources: Array<{
    document_number: number;
    file_name: string;
    file_path: string;
    page_range: string;
    title: string;
  }>;
}

export interface SearchDatabaseConfig {
  host: string;
  port: number;
  database: string;
  schema: string;
}

export interface FilesSearchResponse {
  query: string;
  answer: SearchAnswer;
  config_id_used?: number;
  user_id_used?: string; // Keep for backward compatibility
  database_config: SearchDatabaseConfig;
}

export interface QueryRequest {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface QueryResponse extends ApiResponse {
  data: {
    results: any[];
    totalResults: number;
    queryTime: number;
    suggestions?: string[];
  };
}
// MSSQL Configuration Types
export interface MSSQLConfigRequest {
  db_url: string;
  db_name: string;
  business_rule?: string;
  table_info?: Record<string, any>;
  db_schema?: Record<string, any>;
  dbPath?: string;
}

export interface MSSQLConfigFormRequest {
  db_url: string;
  db_name: string;
  business_rule?: string;
  file?: File;
}

export interface MSSQLConfigData {
  db_id: number;
  db_url: string;
  db_name: string;
  business_rule: string;
  table_info: Record<string, any>;
  db_schema: Record<string, any>;
  dbpath: string;
  created_at: string;
  updated_at: string;
}

// Full API response structure (what the API actually returns)
export interface MSSQLConfigApiResponse {
  status: string;
  message: string;
  data: MSSQLConfigData;
}

export interface MSSQLConfigsListApiResponse {
  status: string;
  message: string;
  data: {
    configs: MSSQLConfigData[];
    count: number;
  };
}

// Service response types (what services return after API client interceptor)
export type MSSQLConfigResponse = MSSQLConfigData;
export type MSSQLConfigsListResponse = {
  configs: MSSQLConfigData[];
  count: number;
};

// Task-based API Types (New API Structure)
export interface MSSQLConfigTaskResponse {
  status: string;
  message: string;
  data: {
    task_id: string;
    status: string;
    db_id?: number;
  };
}

export interface MSSQLConfigTaskStatus {
  task_id: string;
  user_id: string;
  db_id: number;
  status: "pending" | "running" | "success" | "failed";
  progress: number;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface MSSQLConfigTaskStatusResponse {
  status: string;
  message: string;
  data: MSSQLConfigTaskStatus;
}

// Database Info Type (used in various contexts)
export interface DatabaseInfo {
  db_id: number;
  db_name: string;
  db_url: string;
  has_business_rule: boolean;
  has_db_schema: boolean;
}

//User Access Management Types (Simplified - Direct User-Database Access)
export interface DatabaseAccess {
  db_id: number;
  access_level: "full" | "read_only" | "limited";
}

export interface UserAccessCreateRequest {
  user_id: string;
  db_ids: number[];
  access_level: number; // 0, 1, or 2
  accessible_tables?: string[]; // Optional table-level restrictions
}

export interface UserAccessData {
  user_id: string;
  db_ids: number[];
  access_level: number;
  accessible_tables?: string[];
  created_at: string;
  updated_at: string;
}

// Full API response structure (what the API actually returns)
export interface UserAccessCreateApiResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    databases_count: number;
  };
}

export interface UserAccessApiResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    config_ids: number[];
    db_ids: number[];
    access_details: any[];
    total_access_entries: number;
  };
}

export interface UserAccessListApiResponse {
  status: string;
  message: string;
  data: {
    access_configs: UserAccessData[];
    count: number;
  };
}

// Service response types (what services return after API client interceptor)
export type UserAccessCreateResponse = {
  user_id: string;
  databases_count: number;
};

export type UserAccessResponse = {
  user_id: string;
  config_ids: number[];
  db_ids: number[];
  access_details: any[];
  total_access_entries: number;
};

export type UserAccessListResponse = {
  access_configs: UserAccessData[];
  count: number;
};

// User Configuration Types
export interface DatabaseConfig {
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  schema: string;
}

export interface UserConfigCreateRequest {
  user_id: string;
  db_id: number;
  access_level: number;
  accessible_tables: string[];
  table_names: string[];
}

export interface UserConfigData {
  config_id: number;
  user_id: string;
  db_id: number;
  db_config: DatabaseConfig;
  access_level: number;
  accessible_tables: string[];
  table_names: string[];
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

// Full API response structure (what the API actually returns)
export interface UserConfigCreateApiResponse {
  status: string;
  message: string;
  data: {
    config_id: number;
    db_id: number;
    config_reused: boolean;
    database_created: boolean;
    database_name: string;
    table_status: Record<string, any>;
  };
}

export interface UserConfigApiResponse {
  status: string;
  message: string;
  data: UserConfigData;
}

export interface UserConfigsListApiResponse {
  status: string;
  message: string;
  data: {
    configs: UserConfigData[];
    count: number;
  };
}

// Service response types (what services return after API client interceptor)
export type UserConfigCreateResponse = {
  config_id: number;
  db_id: number;
  config_reused: boolean;
  database_created: boolean;
  database_name: string;
  table_status: Record<string, any>;
};

export type UserConfigResponse = UserConfigData;

type UserConfigsListResponse = {
  configs: UserConfigData[];
  count: number;
};

// User Config by DB response (for GET /user-config/{userId}/{dbId})
export interface UserConfigByDbApiResponse {
  status: string;
  message: string;
  data: {
    configs: UserConfigData[];
    count: number;
    latest_config_id: number;
    user_id: string;
    db_id: number;
    database_name: string;
  };
}

export type UserConfigByDbResponse = {
  configs: UserConfigData[];
  count: number;
  latest_config_id: number;
  user_id: string;
  db_id: number;
  database_name: string;
};

// User Config update request
export interface UserConfigUpdateRequest {
  db_id: number;
  access_level: number;
  accessible_tables: string[];
  table_names: string[];
}

// User Config update response
export interface UserConfigUpdateApiResponse {
  status: string;
  message: string;
  data: {
    config_id: number;
    updated_config: UserConfigData;
    updated_fields: Record<string, boolean>;
  };
}

export type UserConfigUpdateResponse = {
  config_id: number;
  updated_config: UserConfigData;
  updated_fields: Record<string, boolean>;
};

// User Table Names Types
export interface AddUserTableNameRequest {
  table_name: string;
}

export interface UserTableNameActionApiResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    table_name: string;
    action: string;
  };
}

export type UserTableNameActionResponse = {
  user_id: string;
  table_name: string;
  action: string;
};

export interface GetUserTableNamesApiResponse {
  status: string;
  message: string;
  data: string[];
}

export type GetUserTableNamesResponse = string[];


// Table Info Generation Types
export interface GenerateTableInfoRequest {
  user_id: string;
}

export interface TaskData {
  task_id: string;
  status: "pending" | "running" | "completed" | "failed";
  db_id: number;
  user_id: string;
}

// Full API response structure (what the API actually returns)
export interface GenerateTableInfoApiResponse {
  status: string;
  message: string;
  data: TaskData;
}

// Service response types (what services return after API client interceptor)
export type GenerateTableInfoResponse = TaskData;

export interface TaskStatusData {
  task_id: string;
  user_id: string;
  db_id: number;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
}

// Full API response structure (what the API actually returns)
export interface TaskStatusApiResponse {
  status: string;
  message: string;
  data: TaskStatusData;
}

// Service response types (what services return after API client interceptor)
export type TaskStatusResponse = TaskStatusData;

// Matched Tables Generation Types
export interface GenerateMatchedTablesRequest {
  user_id: string;
}

export interface MatchedTablesMetadata {
  user_id: string;
  db_id: number;
  db_name: string;
  generated_at: string;
  total_business_rules_tables: number;
  total_schema_tables: number;
  total_matches: number;
}

export interface MatchedTablesData {
  status: string;
  message: string;
  metadata: MatchedTablesMetadata;
  matched_tables: any[];
  matched_tables_details: any[];
  business_rules_tables: any[];
  schema_tables: any[];
  unmatched_business_rules: any[];
  unmatched_schema: any[];
}

// Full API response structure (what the API actually returns)
export interface GenerateMatchedTablesApiResponse {
  status: string;
  message: string;
  data: {
    db_id: number;
    user_id: string;
    matched_tables_data: MatchedTablesData;
    updated_config: MSSQLConfigData;
  };
}

// Service response types (what services return after API client interceptor)
export type GenerateMatchedTablesResponse = {
  db_id: number;
  user_id: string;
  matched_tables_data: MatchedTablesData;
  updated_config: MSSQLConfigData;
};

// Table Info Types for React Flow Visualization
export interface TableColumn {
  name: string;
  type: string;
  is_primary: boolean;
  is_foreign: boolean;
  is_required: boolean;
  max_length?: number;
  references?: {
    table: string;
    column: string;
    constraint: string;
  };
}

export interface TableRelationship {
  type: string;
  via_column: string;
  via_related: string;
  related_table: string;
}

export interface TableInfo {
  schema: string;
  table_name: string;
  full_name: string;
  primary_keys: string[];
  columns: TableColumn[];
  relationships: TableRelationship[];
  sample_data: Record<string, any>[];
  row_count_sample: number;
}

export interface TableMetadata {
  extraction_date: string;
  total_tables: number;
  processed_tables: number;
  failed_tables: number;
  sample_row_count: number;
  database_url: string;
}

// Excel to Database Types - Updated to match actual API responses
export interface ExcelToDBHealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export interface ExcelToDBPushDataRequest {
  user_id: string;
  db_id: number;
  table_full_name: string;
  column_mapping: Record<string, string>; // Excel column name -> Database column name
  skip_first_row: boolean;
  excel_file: File;
}

export interface ExcelToDBPushDataResponse {
  status: string;
  message: string;
  data: {
    rows_processed: number;
    rows_inserted: number;
    errors: any[] | null;
  };
}

export interface ExcelToDBGetAIMappingRequest {
  user_id: string;
  db_id: number;
  table_full_name: string;
  excel_file: File;
}

export interface ColumnMappingSuggestion {
  excel_column: string;
  suggested_db_column: string;
  confidence: number;
  data_type_match: boolean;
}

// Updated API response format to match actual API
export interface MappingDetail {
  table_column: string;
  excel_column: string;
  is_identity: boolean;
  is_mapped: boolean;
  mapping_status: "MAPPED" | "IDENTITY" | "UNMAPPED";
}

export interface ExcelToDBGetAIMappingResponse {
  status: string;
  message: string;
  data: {
    all_table_columns: string[];
    identity_columns: string[];
    all_excel_columns: string[];
    mapping_details: MappingDetail[];
  };
}



// New Table API Types (matching backend API structure)
export interface NewTableCreateRequest {
  user_id: string;
  db_id: number;
  table_name: string;
  schema: string;
  columns: Array<{
    name: string;
    data_type: string;
    nullable: boolean;
    is_primary: boolean;
    is_identity: boolean;
  }>;
}

export interface NewTableCreateResponse {
  success: boolean;
  message: string;
  data: {
    table_name: string;
    schema: string;
    columns: Array<{
      name: string;
      data_type: string;
      nullable: boolean;
      is_primary: boolean;
      is_identity: boolean;
    }>;
    created_at: string;
    user_id: string;
  };
}

export interface NewTableGetRequest {
  user_id: string;
  table_name?: string;
  database_id?: number;
}

export interface NewTableGetResponse {
  success: boolean;
  message: string;
  data: Array<{
    table_name: string;
    schema: string;
    columns: Array<{
      name: string;
      data_type: string;
      nullable: boolean;
      is_primary: boolean;
      is_identity: boolean;
    }>;
    created_at: string;
    user_id: string;
  }>;
}

export interface NewTableUpdateRequest {
  user_id: string;
  table_name: string;
  schema?: string;
  columns?: Array<{
    name: string;
    data_type: string;
    nullable: boolean;
    is_primary: boolean;
    is_identity: boolean;
  }>;
}

export interface NewTableUpdateResponse {
  success: boolean;
  message: string;
  data: {
    table_name: string;
    schema: string;
    columns: Array<{
      name: string;
      data_type: string;
      nullable: boolean;
      is_primary: boolean;
      is_identity: boolean;
    }>;
    updated_at: string;
    user_id: string;
  };
}

export interface NewTableDeleteRequest {
  user_id: string;
  table_name: string;
}

export interface NewTableDeleteResponse {
  success: boolean;
  message: string;
  data: {
    deleted: boolean;
    table_name: string;
    user_id: string;
  };
}

export interface DataTypesResponse {
  status: string;
  message: string;
  data: {
    numeric: string[];
    string: string[];
    date_time: string[];
    binary: string[];
    other: string[];
  };
}

// User Tables API Types - Updated to match actual API responses
export interface UserTableColumn {
  name: string;
  type: string;
  is_foreign: boolean;
  is_primary: boolean;
  max_length: number | null;
  is_required: boolean;
}

export interface UserTableSchema {
  schema: string;
  columns: UserTableColumn[];
  full_name: string;
  created_at: string;
  table_name: string;
  sample_data: any[];
  primary_keys: string[];
  relationships: any[];
  row_count_sample: number;
}

export interface UserTable {
  table_name: string;
  schema_name: string;
  table_schema: UserTableSchema;
  created_by_user: string;
  table_full_name: string;
  creation_timestamp: string;
}

export interface UserTablesResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    current_db_id: number;
    tables: UserTable[];
    business_rule: string;
    business_rule_exists: boolean;
    count: number;
    created_at: string;
    updated_at: string;
    business_rule_endpoint: string;
  };
}

export interface TableSchema {
  schema: string;
  columns: Array<{
    name: string;
    type: string;
    is_foreign: boolean;
    is_primary: boolean;
    max_length: number;
    is_required: boolean;
  }>;
  full_name: string;
  created_at: string;
  table_name: string;
  sample_data: any[];
  primary_keys: string[];
  relationships: any[];
  row_count_sample: number;
}

export interface UserTable {
  table_name: string;
  schema_name: string;
  table_schema: TableSchema;
  created_by_user: string;
  table_full_name: string;
  creation_timestamp: string;
  user_business_rule?: string;
}

export interface UserTablesResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    current_db_id: number;
    tables: UserTable[];
    business_rule: string;
    business_rule_exists: boolean;
    count: number;
    created_at: string;
    updated_at: string;
    business_rule_endpoint: string;
  };
}

export interface TablesByDbResponse {
  status: string;
  message: string;
  data: {
    db_id: number;
    db_name: string;
    tables: UserTable[];
    user_records: Array<{
      id: number;
      db_id: number;
      user_id: string;
      table_details: UserTable[];
      business_rule: string;
      created_at: string;
      updated_at: string;
    }>;
    table_count: number;
    user_count: number;
  };
}

export interface SetupTrackingTableResponse {
  status: string;
  message: string;
  data: {
    table_name: string;
  };
}

export interface UpdateBusinessRuleRequest {
  business_rule: string;
}

export interface BusinessRuleResponse {
  status: string;
  message: string;
  data: {
    user_id: string;
    db_id: number;
    db_name: string;
    business_rule: string;
    updated_at?: string;
    exists?: boolean;
  };
}

// Background Database Query Task Types
export interface BackgroundTask {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at: string;
  updated_at: string;
  user_id: string;
  model: string;
  question: string;
  error: string | null;
}

export interface BackgroundTaskResult {
  status_code: number;
  payload: {
    sql: string;
    data: Array<Record<string, any>>;
  };
}

export interface BackgroundTaskDetail extends BackgroundTask {
  result: BackgroundTaskResult | null;
}

export interface BackgroundTasksListResponse {
  status_code: number;
  tasks: BackgroundTask[];
  count: number;
  total: number;
}

export interface BackgroundTaskStatusResponse {
  status_code: number;
  task: BackgroundTaskDetail;
}
