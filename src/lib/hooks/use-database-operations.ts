import { useState } from "react";
import { ServiceRegistry } from "../api";
import type { DbQueryParams } from "../api";
import { useToast } from "./use-toast";

/**
 * Hook for managing database operations
 * All operations use JWT authentication - user ID is extracted from token on backend
 */
export function useDatabaseOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbResponse, setDbResponse] = useState<any>(null);
  const { success, error: showError } = useToast();

  /**
   * Send a database query using background processing
   */
  const sendQuery = async (params: DbQueryParams) => {
    setLoading(true);
    setError(null);

    try {
      // Get user ID from auth context or params
      const userId = params.userId || 'default';
      
      console.log("Database operations - sendQuery called with:", { params, userId }); // Debug log
      
      // Use the new background query system
      const response = await ServiceRegistry.query.sendDatabaseQuery(
        params.question, 
        userId, 
        params.model || 'gemini',
        params.db_id,
        {
          table_agent_mode: params.table_agent_mode,
          use_column_agent: params.use_column_agent,
          background: params.background
        }
      );
      setDbResponse(response);
      return response;
    } catch (e: any) {
      const errorMessage = e.message || "Query execution failed";
      setError(errorMessage);
      showError(errorMessage);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    loading,
    error,
    dbResponse,

    // Actions
    sendQuery,

    // Utilities
    clearError: () => setError(null),
  };
}
