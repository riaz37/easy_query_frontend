import { useState, useCallback } from "react";
import { ServiceRegistry } from "../api";
import { toast } from "sonner";
import type {
  ExcelToDBPushDataRequest,
  ExcelToDBPushDataResponse,
  ExcelToDBGetAIMappingRequest,
  ExcelToDBGetAIMappingResponse,
} from "@/types/api";

/**
 * Hook for Excel to Database operations using standardized ServiceRegistry
 */
export function useExcelToDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMapping, setAiMapping] = useState<ExcelToDBGetAIMappingResponse | null>(null);
  const [pushResult, setPushResult] = useState<ExcelToDBPushDataResponse | null>(null);

  /**
   * Get AI-powered column mapping suggestions
   */
  const getAIMapping = useCallback(async (request: ExcelToDBGetAIMappingRequest) => {
    setLoading(true);
    setError(null);
    setAiMapping(null);

    try {
      const result = await ServiceRegistry.excelToDB.getAIMapping(request);

      if (result.success && result.data) {
        setAiMapping(result.data);
        return result.data;
      } else {
        throw new Error(result.error || "Failed to get AI mapping");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get AI mapping";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Push Excel data to database
   */
  const pushDataToDatabase = useCallback(async (request: ExcelToDBPushDataRequest) => {
    setLoading(true);
    setError(null);
    setPushResult(null);

    try {
      const result = await ServiceRegistry.excelToDB.pushDataToDatabase(request);

      if (result.success && result.data) {
        setPushResult(result.data);
        toast.success("Data pushed to database successfully!");
        return result.data;
      } else {
        throw new Error(result.error || "Failed to push data to database");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to push data to database";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate Excel file
   */
  const validateFile = useCallback(async (file: File) => {
    try {
      const result = await ServiceRegistry.excelToDB.validateExcelFile(file);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to validate file";
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Get supported file formats
   */
  const getSupportedFormats = useCallback(() => {
    return ServiceRegistry.excelToDB.getSupportedFormats();
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setError(null);
    setAiMapping(null);
    setPushResult(null);
  }, []);

  return {
    loading,
    error,
    aiMapping,
    pushResult,
    getAIMapping,
    pushDataToDatabase,
    validateFile,
    getSupportedFormats,
    clearError,
    clear,
  };
}

