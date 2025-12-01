const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://176.9.16.194:8200";

/**
 * API endpoint definitions
 * All endpoints use JWT authentication - user ID is extracted from token on backend
 */
export const API_ENDPOINTS = {
  // Excel to Database endpoints
  EXCEL_TO_DB_HEALTH: `${baseUrl}/excel-to-db/health`,
  EXCEL_TO_DB_PUSH_DATA: `${baseUrl}/excel-to-db/push-data`,
  EXCEL_TO_DB_GET_AI_MAPPING: `${baseUrl}/excel-to-db/get-ai-mapping`,

  // New Table Management endpoints
  NEW_TABLE_CREATE: `${baseUrl}/new-table/create`,
  NEW_TABLE_GET_DATA_TYPES: `${baseUrl}/new-table/data-types`,
  NEW_TABLE_GET_USER_TABLES: (userId: string) => `${baseUrl}/new-table/user-tables/${encodeURIComponent(userId)}`,
  NEW_TABLE_UPDATE_BUSINESS_RULE: (userId: string) => `${baseUrl}/new-table/user-business-rule/${encodeURIComponent(userId)}`,
  NEW_TABLE_GET_BUSINESS_RULE: (userId: string) => `${baseUrl}/new-table/user-business-rule/${encodeURIComponent(userId)}`,
  NEW_TABLE_GET_TABLES_BY_DB: (dbId: number) => `${baseUrl}/new-table/tables/${dbId}`,
  NEW_TABLE_SETUP_TRACKING_TABLE: `${baseUrl}/new-table/setup-tracking-table`,
  NEW_TABLE_HEALTH: `${baseUrl}/new-table/health`,

  // RBAC (Authentication & Authorization) endpoints
  RBAC_LOGIN: `${baseUrl}/rbac/login`,
  RBAC_REFRESH: `${baseUrl}/rbac/refresh`,
  RBAC_ME: `${baseUrl}/rbac/me`,
  RBAC_CHANGE_PASSWORD: `${baseUrl}/rbac/change-password`,
  RBAC_ADMIN_CHANGE_PASSWORD: `${baseUrl}/rbac/admin-change-password`,
  RBAC_CREATE_USER: `${baseUrl}/rbac/create-user`,
  RBAC_GET_ALL_USERS: `${baseUrl}/rbac/all-users`,
  RBAC_SET_ROLE: `${baseUrl}/rbac/set-role`,
  RBAC_GET_USER_ROLE: (userId: string) => `${baseUrl}/rbac/user-role/${encodeURIComponent(userId)}`,
  RBAC_SETUP: `${baseUrl}/rbac/setup`,
  RBAC_CHECK_ACCESS: `${baseUrl}/rbac/check-access`,
  RBAC_GRANT_ACCESS: `${baseUrl}/rbac/grant-access`,
  RBAC_REVOKE_ACCESS: `${baseUrl}/rbac/revoke-access`,
  RBAC_GET_USER_ACCESS: (userId: string) => `${baseUrl}/rbac/user-access/${encodeURIComponent(userId)}`,
  RBAC_GET_USER_DB_ACCESS: (userId: string) => `${baseUrl}/rbac/user-db-access/${encodeURIComponent(userId)}`,

  // MSSQL Agent endpoints
  MSSQL_QUERY: `${baseUrl}/mssql/query`,
  MSSQL_QUERY_BACKGROUND_STATUS: (taskId: string) => `${baseUrl}/mssql/query/background/${taskId}/status`,
  MSSQL_CONVERSATION_HISTORY: (dbId: number) => `${baseUrl}/mssql/conversation-history/${dbId}`,
  MSSQL_CLEAR_HISTORY: (dbId: number) => `${baseUrl}/mssql/clear-history/${dbId}`,
  MSSQL_GET_QUERY_HISTORY_BY_DB: (dbId: number) => `${baseUrl}/mssql/mssql/history/db/${dbId}`,
  MSSQL_GET_USER_QUERY_HISTORY: (userId: string) => `${baseUrl}/mssql/mssql/history/${encodeURIComponent(userId)}`,
  MSSQL_CLEAR_USER_QUERY_HISTORY: (userId: string) => `${baseUrl}/mssql/mssql/history/${encodeURIComponent(userId)}`,
  MSSQL_GET_USER_QUERY_HISTORY_BY_DB: (userId: string, dbId: number) => `${baseUrl}/mssql/mssql/history/${encodeURIComponent(userId)}/db/${dbId}`,
  MSSQL_CLEAR_USER_QUERY_HISTORY_BY_DB: (userId: string, dbId: number) => `${baseUrl}/mssql/mssql/history/${encodeURIComponent(userId)}/db/${dbId}`,

  // MSSQL Configuration endpoints
  MSSQL_CONFIG_CREATE: `${baseUrl}/mssql-config/mssql-config`,
  MSSQL_CONFIG_GET_ALL: `${baseUrl}/mssql-config/mssql-config`,
  MSSQL_CONFIG_GET: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}`,
  MSSQL_CONFIG_UPDATE: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}`,
  MSSQL_CONFIG_DELETE: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}`,
  MSSQL_CONFIG_GET_USER_DATABASES: (userId: string) => `${baseUrl}/mssql-config/mssql-config/user/${encodeURIComponent(userId)}/databases`,
  MSSQL_CONFIG_GENERATE_TABLE_INFO: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}/generate-table-info`,
  MSSQL_CONFIG_GENERATE_MATCHED_TABLES: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}/generate-matched-tables`,
  MSSQL_CONFIG_UPDATE_REPORT_STRUCTURE: (dbId: number) => `${baseUrl}/mssql-config/mssql-config/${dbId}/report-structure`,
  MSSQL_CONFIG_GET_TASK_STATUS: (taskId: string) => `${baseUrl}/mssql-config/mssql-config/tasks/${taskId}`,
  MSSQL_CONFIG_SETUP: `${baseUrl}/mssql-config/setup`,
  MSSQL_CONFIG_MIGRATE: `${baseUrl}/mssql-config/migrate`,
  MSSQL_CONFIG_HEALTH: `${baseUrl}/mssql-config/health`,
  MSSQL_CONFIG_DATABASE_STATUS: `${baseUrl}/mssql-config/database-status`,

  // Cache Management endpoints
  CACHE_CLEAR_ALL: `${baseUrl}/mssql-config/cache/all`,
  CACHE_CLEAR_USER: (userId: string) => `${baseUrl}/mssql-config/cache/user/${encodeURIComponent(userId)}`,
  CACHE_GET_STATS: `${baseUrl}/mssql-config/cache/stats`,

  // File Management System endpoints
  FILES_SEARCH_SYNC: `${baseUrl}/files/search`,
  FILES_SEARCH_BACKGROUND_CANCEL: (taskId: string) => `${baseUrl}/files/search/background/${taskId}/cancel`,
  FILES_SEARCH_BACKGROUND_DELETE: (taskId: string) => `${baseUrl}/files/search/background/${taskId}`,
  FILES_SEARCH_BACKGROUND_CONFIG_TASKS: (configId: number) => `${baseUrl}/files/search/background/config/${configId}/tasks`,
  FILES_SEARCH_HISTORY: (configId: number) => `${baseUrl}/files/search/history/${configId}`,
  FILES_SMART_FILE_SYSTEM_BACKEND: `${baseUrl}/files/smart_file_system_backend`,
  FILES_SMART_FILE_SYSTEM: `${baseUrl}/files/smart_file_system`,
  FILES_GET_USER_PROCESSING_HISTORY: (userId: string) => `${baseUrl}/files/files/history/${encodeURIComponent(userId)}`,
  FILES_CLEAR_USER_PROCESSING_HISTORY: (userId: string) => `${baseUrl}/files/files/history/${encodeURIComponent(userId)}`,
  FILES_GET_USER_SEARCH_HISTORY_BY_CONFIG: (userId: string, configId: number) => `${baseUrl}/files/files/history/${encodeURIComponent(userId)}/config/${configId}`,
  FILES_CLEAR_USER_SEARCH_HISTORY_BY_CONFIG: (userId: string, configId: number) => `${baseUrl}/files/files/history/${encodeURIComponent(userId)}/config/${configId}`,
  FILES_GET_SEARCH_HISTORY_BY_CONFIG: (configId: number) => `${baseUrl}/files/files/history/config/${configId}`,
  FILES_BUNDLE_TASK_STATUS: (bundleId: string) => `${baseUrl}/files/bundle_task_status/${bundleId}`,

  // Report Generation endpoints
  REPORT_RECREATE_DATABASE: `${baseUrl}/report/recreate-database`,
  REPORT_TEST_IMAGE_URLS: `${baseUrl}/report/test-image-urls`,
  REPORT_TEST_URL_CONVERSION: `${baseUrl}/report/test-url-conversion`,

  // FMS Database Config endpoints
  FMS_DB_CONFIG_GET_ALL: `${baseUrl}/fms-db-config/database-config`,
  FMS_DB_CONFIG_CREATE: `${baseUrl}/fms-db-config/database-config`,
  FMS_DB_CONFIG_GET: (dbId: number) => `${baseUrl}/fms-db-config/database-config/${dbId}`,
  FMS_DB_CONFIG_UPDATE: (dbId: number) => `${baseUrl}/fms-db-config/database-config/${dbId}`,
  FMS_DB_CONFIG_DELETE: (dbId: number) => `${baseUrl}/fms-db-config/database-config/${dbId}`,
  FMS_DB_CONFIG_GET_CONFIG: (configId: number) => `${baseUrl}/fms-db-config/config/${configId}`,
  FMS_DB_CONFIG_DELETE_CONFIG: (configId: number) => `${baseUrl}/fms-db-config/config/${configId}`,
  FMS_DB_CONFIG_GET_TABLE_NAMES: (configId: number) => `${baseUrl}/fms-db-config/config/${configId}/table-names`,
  FMS_DB_CONFIG_APPEND_TABLE_NAME: (configId: number) => `${baseUrl}/fms-db-config/config/${configId}/table-names`,
  FMS_DB_CONFIG_DELETE_TABLE_NAME: (configId: number, tableName: string) => `${baseUrl}/fms-db-config/config/${configId}/table-names/${encodeURIComponent(tableName)}`,
  FMS_DB_CONFIG_GET_ALL_TABLE_NAMES_BY_DB: (dbId: number) => `${baseUrl}/fms-db-config/database/${dbId}/table-names`,
  FMS_DB_CONFIG_GET_ALL_USER_CONFIGS: `${baseUrl}/fms-db-config/user-config`,
  FMS_DB_CONFIG_SET_USER_CONFIG: `${baseUrl}/fms-db-config/user-config`,
  FMS_DB_CONFIG_UPDATE_USER_CONFIG: (configId: number) => `${baseUrl}/fms-db-config/user-config/${configId}`,
  FMS_DB_CONFIG_GET_ALL_CONFIGS_FOR_USER: (configId: number) => `${baseUrl}/fms-db-config/user-config/${configId}/all`,
  FMS_DB_CONFIG_SET_USER_CONFIG_ENDPOINT: `${baseUrl}/fms-db-config/set-user-config`,
  FMS_DB_CONFIG_SETUP: `${baseUrl}/fms-db-config/setup`,
  FMS_DB_CONFIG_SETUP_FORCE: `${baseUrl}/fms-db-config/setup/force`,
  FMS_DB_CONFIG_HEALTH: `${baseUrl}/fms-db-config/health`,

  // DB Query Update endpoints
  DB_QUERY_UPDATE_COMBINED_LEARN_SYNC: (dbId: number) => `${baseUrl}/db-query-update/combined/learn-sync/${dbId}`,
  DB_QUERY_UPDATE_GET_TASK: (taskId: string) => `${baseUrl}/db-query-update/learn/tasks/${taskId}`,
  DB_QUERY_UPDATE_CANCEL_TASK: (taskId: string) => `${baseUrl}/db-query-update/learn/tasks/${taskId}/cancel`,
};

/**
 * Helper function to build endpoint URL with query parameters
 */
export function buildEndpointWithQueryParams(
  endpoint: string,
  params: Record<string, any>,
): string {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();

  if (!queryString) {
    return endpoint;
  }

  return `${endpoint}?${queryString}`;
}

/**
 * Helper function to build endpoint URL with path parameters
 */
export function buildEndpointWithPathParams(
  endpointTemplate: string,
  params: Record<string, string | number>,
): string {
  let endpoint = endpointTemplate;

  Object.entries(params).forEach(([key, value]) => {
    endpoint = endpoint.replace(`:${key}`, String(value));
  });

  return endpoint;
}
