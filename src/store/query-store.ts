import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { queryService } from '@/lib/api/services/query-service';
import { fileService } from '@/lib/api/services/file-service';
import { BusinessRulesValidator } from '@/lib/utils/business-rules-validator';

// Query Types
export interface QueryRequest {
  id: string;
  type: 'file' | 'database';
  query: string;
  userId: string;
  timestamp: Date;
  parameters?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  queryId: string;
  data: any;
  metadata: {
    rowCount: number;
    executionTime: number;
    columns: string[];
  };
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  error?: string;
}


export interface FileQueryRequest {
  fileId: string;
  query: string;
  userId: string;
  parameters?: {
    config_id?: number; // Config ID for file queries
    table_specific?: boolean;
    tables?: string[];
    use_intent_reranker?: boolean;
    use_chunk_reranker?: boolean;
    use_dual_embeddings?: boolean;
    intent_top_k?: number;
    chunk_top_k?: number;
    chunk_source?: string;
    max_chunks_for_answer?: number;
    answer_style?: string;
  };
}

export interface DatabaseQueryRequest {
  databaseId: number;
  query: string;
  userId: string;
  parameters?: Record<string, any>;
}

export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  type: 'file' | 'database';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// Query Store Interface
interface QueryStore {
  // State
  currentQuery: QueryRequest | null;
  queryResults: QueryResult | null;
  queryLoading: boolean;
  queryError: string | null;
  
  // File Queries
  fileQueries: FileQueryRequest[];
  
  // Database Queries
  databaseQueries: DatabaseQueryRequest[];
  
  // Saved Queries
  savedQueries: SavedQuery[];
  
  // Actions
  setCurrentQuery: (query: QueryRequest | null) => void;
  setQueryResults: (results: QueryResult | null) => void;
  setQueryLoading: (loading: boolean) => void;
  setQueryError: (error: string | null) => void;
  
  // Query Execution
  executeFileQuery: (query: FileQueryRequest) => Promise<void>;
  executeDatabaseQuery: (query: DatabaseQueryRequest) => Promise<void>;
  
  // Query Management
  saveQuery: (query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  clearQueryResults: () => void;
}

export const useQueryStore = create<QueryStore>()(
  devtools(
    (set, get) => ({
      // Initial State
      currentQuery: null,
      queryResults: null,
      queryLoading: false,
      queryError: null,
      fileQueries: [],
      databaseQueries: [],
      savedQueries: [],

      // Basic Setters
      setCurrentQuery: (query) => set({ currentQuery: query }),
      setQueryResults: (results) => set({ queryResults: results }),
      setQueryLoading: (loading) => set({ queryLoading: loading }),
      setQueryError: (error) => set({ queryError: error }),

      // Query Execution - Using REAL APIs
      executeFileQuery: async (queryRequest) => {
        const { setQueryLoading, setQueryError, setQueryResults } = get();
        
        try {
          setQueryLoading(true);
          setQueryError(null);
          
          // Create query request
          const query: QueryRequest = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'file',
            query: queryRequest.query,
            userId: queryRequest.userId, // Keep for compatibility but not used in API
            timestamp: new Date(),
            parameters: queryRequest.parameters,
          };
          
          // Use authenticated FileService.searchFiles API with user_id
          const searchParams: any = {
            query: queryRequest.query,
            config_id: queryRequest.parameters?.config_id || 1, // Use config_id from parameters or default to 1
            user_id: queryRequest.userId, // Pass user_id from the request
            intent_top_k: 20,
            chunk_top_k: 40,
            max_chunks_for_answer: 40,
            use_intent_reranker: false,
            use_chunk_reranker: false,
            use_dual_embeddings: true,
            chunk_source: "reranked",
            answer_style: "detailed",
            table_specific: false,
          };

          // Add table-specific parameters if provided
          if (queryRequest.parameters) {
            if (queryRequest.parameters.table_specific !== undefined) {
              searchParams.table_specific = queryRequest.parameters.table_specific;
            }
            if (queryRequest.parameters.tables && queryRequest.parameters.tables.length > 0) {
              searchParams.tables = queryRequest.parameters.tables;
            }
          }

          const result = await fileService.searchFiles(searchParams);
          
          // Transform API response to our QueryResult format
          const queryResult: QueryResult = {
            id: query.id,
            queryId: query.id,
            data: result.data || [],
            success: result.success,
            error: result.error,
            timestamp: new Date(),
            metadata: {
              executionTime: 0, // Would come from backend
              rowCount: result.data?.length || 0,
            },
          };
          
          setQueryResults(queryResult);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'File query failed';
          console.error('File query error:', error);
          setQueryError(errorMessage);
        } finally {
          setQueryLoading(false);
        }
      },

      executeDatabaseQuery: async (queryRequest) => {
        const { setQueryLoading, setQueryError, setQueryResults } = get();
        
        try {
          setQueryLoading(true);
          setQueryError(null);
          
          // Validate query against business rules first
          try {
            // Business rules validation is now handled by context providers
            // No need to manually fetch business rules here
          } catch (error) {
            console.warn('Failed to validate against business rules:', error);
            // Continue with query execution even if business rules validation fails
          }
          
          // Create query request
          const query: QueryRequest = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'database',
            query: queryRequest.query,
            userId: queryRequest.userId, // Keep for compatibility but not used in API
            timestamp: new Date(),
            parameters: queryRequest.parameters,
          };
          
          // Use authenticated QueryService.sendDatabaseQuery API with background processing
          const result = await queryService.sendDatabaseQuery(
            queryRequest.query, 
            queryRequest.userId || 'default',
            'gemini' // Default model, can be made configurable
          );
          
          // Transform API response to our QueryResult format
          const queryResult: QueryResult = {
            id: query.id,
            queryId: query.id,
            data: result.data || [],
            success: result.success,
            error: result.error,
            timestamp: new Date(),
            metadata: {
              executionTime: 0, // Would come from backend
              rowCount: result.data?.length || 0,
            },
          };
          
          setQueryResults(queryResult);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Database query failed';
          console.error('Database query error:', error);
          setQueryError(errorMessage);
        } finally {
          setQueryLoading(false);
        }
      },

      // Query Management - Currently no backend APIs for these, so we'll store locally
      saveQuery: async (queryData) => {
        const { savedQueries } = get();
        const newQuery: SavedQuery = {
          ...queryData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set({ savedQueries: [...savedQueries, newQuery] });
        
        // TODO: When backend API is available, implement:
        // await QueryService.saveQuery(newQuery);
      },

      clearQueryResults: () => set({ queryResults: null, queryError: null }),
    }),
    {
      name: 'query-store',
    }
  )
); 