import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useAuthContext } from '@/components/providers/AuthContextProvider';
import { useDatabaseContext } from '@/components/providers/DatabaseContextProvider';
import { ServiceRegistry } from '@/lib/api';
import type { DatabaseInfo } from '../types';

export const useUserConfiguration = () => {
  const { user, isAuthenticated } = useAuthContext();
  const {
    currentDatabaseId,
    currentDatabaseName,
    setCurrentDatabase,
    loadDatabasesFromConfig,
    setLoading: setDatabaseLoading,
    setError: setDatabaseError,
    availableDatabases,
  } = useDatabaseContext();

  // Business rules state
  const [businessRules, setBusinessRules] = useState<string>('');
  const [businessRulesLoading, setBusinessRulesLoading] = useState(false);
  const [businessRulesError, setBusinessRulesError] = useState<string | null>(null);

  // Report structure state
  const [reportStructure, setReportStructure] = useState<string>('');
  const [reportStructureLoading, setReportStructureLoading] = useState(false);
  const [reportStructureError, setReportStructureError] = useState<string | null>(null);

  // State
  const [loading, setLoading] = useState(false);
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const hasLoadedRef = useRef(false);

  // Load user configuration
  const loadUserConfiguration = useCallback(async () => {
    // Check if we already have configuration loaded from storage
    if (
      currentDatabaseId &&
      availableDatabases &&
      availableDatabases.length > 0
    ) {
      return;
    }

    setLoading(true);
    setDatabaseLoading(true);
    setBusinessRulesLoading(true);
    setReportStructureLoading(true);
    setDatabaseError(null);
    setBusinessRulesError(null);
    setReportStructureError(null);

    try {
      // Load accessible databases
      const databasesResponse =
        await ServiceRegistry.database.getAllDatabases();

      if (databasesResponse.success) {
        const dbList = databasesResponse.data.map((db) => ({
          db_id: db.id,
          db_name: db.name,
          db_url: db.url,
          db_type: db.type,
          is_current: db.id === currentDatabaseId,
          business_rule: db.metadata?.businessRule || '',
        }));

        // Update local state
        setDatabases(dbList);

        // Update database context provider
        const dbConfigs = dbList.map((db) => ({
          db_id: db.db_id,
          db_name: db.db_name,
          db_url: db.db_url,
          db_type: db.db_type,
          business_rule: db.business_rule,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        loadDatabasesFromConfig(dbConfigs);

        // Get current database from backend
        const currentDBInfo =
          await ServiceRegistry.userCurrentDB.getUserCurrentDB(user?.user_id);
        if (
          currentDBInfo.success &&
          currentDBInfo.data &&
          currentDBInfo.data.db_id
        ) {
          // Update the current database in context
          setCurrentDatabase(
            currentDBInfo.data.db_id,
            currentDBInfo.data.db_name || 'Unknown',
          );

          // Update local state to mark the current database
          setDatabases((prev) =>
            prev.map((db) => ({
              ...db,
              is_current: db.db_id === currentDBInfo.data.db_id,
            })),
          );

          // Get business rules and report structure for the current database
          try {
            const businessRulesResponse = 
              await ServiceRegistry.database.getDatabaseBusinessRulesAndReportStructure(
                currentDBInfo.data.db_id
              );
            
            if (businessRulesResponse.success && businessRulesResponse.data) {
              setBusinessRules(businessRulesResponse.data.businessRule || '');
              setReportStructure(businessRulesResponse.data.reportStructure || '');
            } else {
              setBusinessRules('');
              setReportStructure('');
            }
          } catch (error) {
            console.warn('Failed to load business rules and report structure:', error);
            setBusinessRules('');
            setReportStructure('');
          }
        } else {
          // No current database set
          setBusinessRules('');
          setReportStructure('');
        }
      } else {
        throw new Error(databasesResponse.error || 'Failed to load databases');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load configuration';
      setDatabaseError(errorMessage);
      setBusinessRulesError(errorMessage);
      setReportStructureError(errorMessage);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
      setDatabaseLoading(false);
      setBusinessRulesLoading(false);
      setReportStructureLoading(false);
    }
  }, [
    user?.user_id,
    setCurrentDatabase,
    loadDatabasesFromConfig,
    setDatabaseLoading,
    currentDatabaseId,
    availableDatabases,
  ]);

  // Load user configuration on mount
  useEffect(() => {
    if (isAuthenticated && !loading && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserConfiguration();
    }
  }, [isAuthenticated, loadUserConfiguration, loading]);

  // Reset loaded flag when user changes
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user?.user_id]);

  // Clear report structure when user changes
  useEffect(() => {
    if (user?.user_id) {
      setReportStructure('');
      setReportStructureError(null);
    }
  }, [user?.user_id]);

  // Clear report structure when database changes
  const clearReportStructureOnDatabaseChange = useCallback(() => {
    console.log('Clearing report structure due to database change');
    setReportStructure('');
    setReportStructureError(null);
  }, []);

  // Manual refresh function (separate from automatic loading)
  const handleManualRefresh = useCallback(async () => {
    hasLoadedRef.current = false;
    // Force reload by clearing storage check
    setLoading(true);
    setDatabaseLoading(true);
    setBusinessRulesLoading(true);
    await loadUserConfiguration();
  }, [loadUserConfiguration]);

  // Handle database selection
  const handleDatabaseChange = useCallback(
    async (databaseId: number) => {
      try {
        setDatabaseLoading(true);
        setDatabaseError(null);

        const selectedDB = databases.find((db) => db.db_id === databaseId);
        if (selectedDB) {
          // Set the current database in backend
          const response = await ServiceRegistry.userCurrentDB.setUserCurrentDB(
            {
              db_id: databaseId,
            },
            user?.user_id,
          );

          if (response.success) {
            // Clear business rules and report structure first to ensure fresh data
            setBusinessRules('');
            setBusinessRulesError(null);
            clearReportStructureOnDatabaseChange();
            
            // Update database context provider
            setCurrentDatabase(databaseId, selectedDB.db_name);

            // Update local state
            setDatabases((prev) =>
              prev.map((db) => ({
                ...db,
                is_current: db.db_id === databaseId,
              })),
            );

            // Get business rules and report structure for the newly selected database
            try {
              const businessRulesResponse = 
                await ServiceRegistry.database.getDatabaseBusinessRulesAndReportStructure(
                  databaseId
                );
              
              if (businessRulesResponse.success && businessRulesResponse.data) {
                setBusinessRules(businessRulesResponse.data.businessRule || '');
                setReportStructure(businessRulesResponse.data.reportStructure || '');
              } else {
                setBusinessRules('');
                setReportStructure('');
              }
            } catch (error) {
              console.warn('Failed to load business rules and report structure for new database:', error);
              setBusinessRules('');
              setReportStructure('');
            }

            toast.success(`Switched to database: ${selectedDB.db_name}`);
          } else {
            throw new Error(response.error || 'Failed to set current database');
          }
        } else {
          throw new Error('Selected database not found');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to switch database';
        setDatabaseError(errorMessage);
        toast.error('Failed to switch database');
      } finally {
        setDatabaseLoading(false);
      }
    },
    [
      databases,
      user?.user_id,
      setCurrentDatabase,
      setDatabaseLoading,
      setDatabaseError,
    ],
  );

  // Handle business rules refresh
  const handleBusinessRulesRefresh = useCallback(async () => {
    try {
      if (currentDatabaseId) {
        setBusinessRulesLoading(true);
        setBusinessRulesError(null);

        const businessRulesResponse = 
          await ServiceRegistry.database.getDatabaseBusinessRulesAndReportStructure(
            currentDatabaseId
          );
        
        if (businessRulesResponse.success && businessRulesResponse.data) {
          setBusinessRules(businessRulesResponse.data.businessRule || '');
          toast.success('Business rules refreshed successfully');
        } else {
          setBusinessRules('');
          toast.success('Business rules refreshed (no rules found)');
        }
      } else {
        toast.error('No database selected');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to refresh business rules';
      setBusinessRulesError(errorMessage);
      toast.error('Failed to refresh business rules');
    } finally {
      setBusinessRulesLoading(false);
    }
  }, [currentDatabaseId]);

  // Handle report structure refresh
  const handleReportStructureRefresh = useCallback(async () => {
    try {
      if (currentDatabaseId) {
        setReportStructureLoading(true);
        setReportStructureError(null);

        const businessRulesResponse = 
          await ServiceRegistry.database.getDatabaseBusinessRulesAndReportStructure(
            currentDatabaseId
          );
        
        if (businessRulesResponse.success && businessRulesResponse.data) {
          setReportStructure(businessRulesResponse.data.reportStructure);
          toast.success('Report structure refreshed successfully');
        } else {
          setReportStructure('');
          toast.success('Report structure refreshed (no structure found)');
        }
      } else {
        toast.error('No database selected');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to refresh report structure';
      setReportStructureError(errorMessage);
      toast.error('Failed to refresh report structure');
    } finally {
      setReportStructureLoading(false);
    }
  }, [currentDatabaseId]);

  // Computed values
  const hasBusinessRules = useMemo(() => !!businessRules.trim(), [businessRules]);
  const businessRulesCount = useMemo(() => {
    if (!businessRules.trim()) return 0;
    return businessRules.split('\n').filter(line => line.trim().length > 0).length;
  }, [businessRules]);

  // Business rules helpers
  const loadBusinessRulesFromConfig = useCallback((rules: string) => {
    setBusinessRules(rules || '');
    setBusinessRulesError(null);
  }, []);

  const updateBusinessRules = useCallback((rules: string) => {
    setBusinessRules(rules || '');
    setBusinessRulesError(null);
  }, []);

  const clearBusinessRulesOnDatabaseChange = useCallback(() => {
    setBusinessRules('');
    setBusinessRulesError(null);
  }, []);

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    loading,
    databases,
    user,
    isAuthenticated,
    currentDatabaseId,
    currentDatabaseName,
    businessRules,
    businessRulesLoading,
    businessRulesError,
    hasBusinessRules,
    businessRulesCount,
    reportStructure,
    reportStructureLoading,
    reportStructureError,
    
    // Actions
    loadUserConfiguration,
    handleManualRefresh,
    handleDatabaseChange,
    handleBusinessRulesRefresh,
    handleReportStructureRefresh,
    loadBusinessRulesFromConfig,
    updateBusinessRules,
    clearBusinessRulesOnDatabaseChange,
    clearReportStructureOnDatabaseChange,
    setBusinessRulesLoading,
    setBusinessRulesError,
  }), [
    loading,
    databases,
    user,
    isAuthenticated,
    currentDatabaseId,
    currentDatabaseName,
    businessRules,
    businessRulesLoading,
    businessRulesError,
    hasBusinessRules,
    businessRulesCount,
    reportStructure,
    reportStructureLoading,
    reportStructureError,
    loadUserConfiguration,
    handleManualRefresh,
    handleDatabaseChange,
    handleBusinessRulesRefresh,
    handleReportStructureRefresh,
    loadBusinessRulesFromConfig,
    updateBusinessRules,
    clearBusinessRulesOnDatabaseChange,
    clearReportStructureOnDatabaseChange,
  ]);
};
