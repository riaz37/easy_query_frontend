// Export API client
export { apiClient } from './client';
export type { ApiClient } from './client';

// Export endpoints
export { API_ENDPOINTS } from './endpoints';

// Export transformers
export {
  transformResponse,
  transformPaginatedResponse,
  transformRequest,
  transformErrorResponse,
  transformFileUploadData,
  transformQueryParams,
} from './transformers';

// Export base service components
export {
  BaseService,
  ServiceError,
} from './services/base/base-service';

export {
  ServiceRegistry,
  getServiceHealthStatus,
  ServiceMetricsCollector,
} from './services/service-registry';

export type {
  ServiceResponse,
  ServiceResult,
  ServicePaginationParams,
  ServiceFilters,
  ServicePaginatedRequest,
  ServicePaginatedResponse,
  CRUDServiceOperations,
  ServiceValidationResult,
  ServiceOperationContext,
  ServiceHealthResult,
  ServiceConfig,
  ServiceMetrics,
  ServiceErrorDetails,
  AsyncOperationStatus,
  ServiceBatchRequest,
  ServiceBatchResponse,
  ServiceErrorType,
} from './services/base';

// Export all standardized services
export {
  queryService,
  databaseService,
  vectorDBService,
  fileService,
  authService,
  excelToDBService,
  newTableService,
  userAccessService,
  databaseQueryBackgroundService,
} from './services/service-registry';

// Export service interfaces and types
export type {
  DbQueryParams,
  QueryResultData,
} from './services/query-service';

export type {
  DatabaseInfo,
} from './services/database-service';

export type {
  VectorDBConfig,
  UserTableNamesResponse,
} from './services/vector-db-service';

export type {
  LoginRequest,
  TokenResponse,
  JWTPayload,
} from './services/auth-service';

// Service class exports (for direct class access if needed)
export { default as QueryService } from './services/query-service';
export { default as DatabaseService } from './services/database-service';
export { default as VectorDBService } from './services/vector-db-service';
export { default as FileService } from './services/file-service';
export { default as AuthService } from './services/auth-service';
export { default as UserAccessService } from './services/user-access-service';

// Export types
export type { ApiResponse, ApiRequestConfig, ApiError } from '@/types/api';
