import { useState, useCallback } from "react";
import { ServiceRegistry } from "../api";
import type {
  NewTableCreateRequest,
  NewTableCreateResponse,
  NewTableGetRequest,
  NewTableGetResponse,
  NewTableUpdateRequest,
  NewTableUpdateResponse,
  NewTableDeleteRequest,
  NewTableDeleteResponse,
} from "@/types/api";

/**
 * Hook for New Table operations using standardized ServiceRegistry
 */
export function useNewTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createResult, setCreateResult] = useState<NewTableCreateResponse | null>(null);
  const [dataTypes, setDataTypes] = useState<string[]>([]);

  /**
   * Create a new table
   */
  const createTable = useCallback(async (request: NewTableCreateRequest) => {
    setLoading(true);
    setError(null);
    setCreateResult(null);

    try {
      const result = await ServiceRegistry.newTable.createTable(request);

      if (result.success && result.data) {
        setCreateResult(result.data);
        return result.data;
      } else {
        throw new Error(result.error || "Failed to create table");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to create table";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get table information
   */
  const getTable = useCallback(async (request: NewTableGetRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.getTable(request);

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || "Failed to get table");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get table";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a table
   */
  const updateTable = useCallback(async (request: NewTableUpdateRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.updateTable(request);

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || "Failed to update table");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update table";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a table
   */
  const deleteTable = useCallback(async (request: NewTableDeleteRequest) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.deleteTable(request);

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || "Failed to delete table");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to delete table";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get supported data types
   */
  const getDataTypes = useCallback(async () => {
    if (dataTypes.length > 0) {
      return dataTypes;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.getDataTypes();

      if (result.success && result.data?.data_types) {
        setDataTypes(result.data.data_types);
        return result.data.data_types;
      } else {
        throw new Error(result.error || "Failed to get data types");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get data types";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [dataTypes]);

  /**
   * Get user tables and business rule
   * Requires db_id as the API returns tables and business rule for a specific database
   */
  const getUserTables = useCallback(async (userId: string, dbId: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.getUserTables(userId, dbId);

      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.error || "Failed to get user tables");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get user tables";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get supported column types
   */
  const getSupportedColumnTypes = useCallback(() => {
    return ServiceRegistry.newTable.getSupportedColumnTypes();
  }, []);

  /**
   * Generate table creation SQL
   */
  const generateCreateTableSQL = useCallback((
    tableName: string,
    columns: Array<{
      name: string;
      type: string;
      nullable?: boolean;
      default?: string;
      primary_key?: boolean;
    }>
  ) => {
    return ServiceRegistry.newTable.generateCreateTableSQL(tableName, columns);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update user business rule
   * Requires db_id as the API needs it to update the business rule for a specific database
   */
  const updateUserBusinessRule = useCallback(async (userId: string, dbId: number, businessRule: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await ServiceRegistry.newTable.updateUserBusinessRule(userId, dbId, businessRule);

      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || "Failed to update business rule");
      }
    } catch (err: any) {
      const errorMessage = err.message || "Failed to update business rule";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user business rule
   * Note: Business rule is included in getUserTables response, but this helper extracts it
   * Requires db_id to fetch from the correct endpoint
   */
  const getUserBusinessRule = useCallback(async (userId: string, dbId: number) => {
    setLoading(true);
    setError(null);

    try {
      // Business rule is included in getUserTables response
      const result = await ServiceRegistry.newTable.getUserTables(userId, dbId);

      if (result.success && result.data) {
        // Extract business rule from the response
        // API response structure: { business_rule: string, business_rule_exists: boolean, ... }
        const businessRule = result.data.business_rule || result.data.user_business_rule || "";
        
        // Log for debugging
        console.log("Business rule response:", {
          hasData: !!result.data,
          businessRule: businessRule,
          businessRuleExists: result.data.business_rule_exists,
          fullData: result.data
        });
        
        return businessRule || "";
      } else {
        throw new Error(result.error || "Failed to get business rule");
      }
    } catch (err: any) {
      console.error("Error fetching business rule:", err);
      const errorMessage = err.message || "Failed to get business rule";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setError(null);
    setCreateResult(null);
  }, []);

  return {
    loading,
    error,
    createResult,
    dataTypes,
    createTable,
    getTable,
    updateTable,
    deleteTable,
    getDataTypes,
    getUserTables,
    getSupportedColumnTypes,
    generateCreateTableSQL,
    updateUserBusinessRule,
    getUserBusinessRule,
    clearError,
    clear,
  };
}

