import { useState } from "react";
import { fileService } from "../api/services/file-service";
import type { FilesSearchRequest } from "@/types/api";

/**
 * Hook for making file queries using fileService
 */
export function useFileQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  /**
   * Send a file query to the API
   */
  const sendQuery = async (params: FilesSearchRequest) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setRawResponse(null);

    try {
      const result = await fileService.searchFiles(params);
      
      if (result.success) {
        setRawResponse(result);
        // Extract answer from the response structure
        setResponse(result.data?.answer?.answer || result.data);
      } else {
        throw new Error(result.error || "Query failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process query");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    response,
    rawResponse,
    sendQuery,
    setResponse,
    clearError: () => setError(null),
  };
}
