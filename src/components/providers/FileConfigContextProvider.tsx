"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from 'react';
import { useAuthContext } from './AuthContextProvider';
import { ServiceRegistry } from '@/lib/api';
import { STORAGE_KEYS, saveToUserStorage, loadFromUserStorage, clearEasyQueryStorage, storage } from '@/lib/utils/storage';

// Types for file config context
export interface FileConfig {
  config_id: number;
  config_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FileConfigContextData {
  // Current config state
  currentConfig: FileConfig | null;
  currentConfigId: number | null;
  currentConfigName: string;

  // Available configs
  availableConfigs: FileConfig[];
  userConfigs: FileConfig[];

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentConfig: (configId: number, configName?: string) => void;
  loadConfigsFromAccess: (configIds: number[]) => void;
  clearCurrentConfig: () => void;
  refreshConfigs: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed values
  hasCurrentConfig: boolean;
  configCount: number;
  activeConfigCount: number;
}

const FileConfigContext = createContext<FileConfigContextData | undefined>(undefined);

export { FileConfigContext };

export function useFileConfigContext() {
  const context = useContext(FileConfigContext);
  if (!context) {
    throw new Error('useFileConfigContext must be used within a FileConfigContextProvider');
  }
  return context;
}

interface FileConfigContextProviderProps {
  children: ReactNode;
}

export function FileConfigContextProvider({ children }: FileConfigContextProviderProps) {
  const { user } = useAuthContext();

  // State
  const [currentConfig, setCurrentConfigState] = useState<FileConfig | null>(null);
  const [currentConfigId, setCurrentConfigId] = useState<number | null>(null);
  const [currentConfigName, setCurrentConfigName] = useState<string>('');
  const [availableConfigs, setAvailableConfigs] = useState<FileConfig[]>([]);
  const [userConfigs, setUserConfigs] = useState<FileConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized computed values
  const hasCurrentConfig = useMemo(() => !!currentConfigId, [currentConfigId]);
  const configCount = useMemo(() => availableConfigs.length, [availableConfigs]);
  const activeConfigCount = useMemo(() =>
    availableConfigs.filter(config => config.is_active).length,
    [availableConfigs]
  );

  // Load configuration from localStorage on mount
  useEffect(() => {
    if (user?.user_id) {
      loadConfigurationFromStorage();
      refreshConfigs();
    }
  }, [user?.user_id]);

  // Load configuration from localStorage
  const loadConfigurationFromStorage = useCallback(() => {
    try {
      // Load current config
      const storedCurrentConfig = loadFromUserStorage(STORAGE_KEYS.CURRENT_FILE_CONFIG, user?.user_id || '');
      if (storedCurrentConfig) {
        setCurrentConfigState(storedCurrentConfig);
        setCurrentConfigId(storedCurrentConfig.config_id);
        setCurrentConfigName(storedCurrentConfig.config_name || `Config ${storedCurrentConfig.config_id}`);
      }

      // Load available configs
      const storedAvailableConfigs = loadFromUserStorage(STORAGE_KEYS.AVAILABLE_FILE_CONFIGS, user?.user_id || '');
      if (storedAvailableConfigs) {
        setAvailableConfigs(storedAvailableConfigs);
        setUserConfigs(storedAvailableConfigs);
      }
    } catch (error) {
      console.error('Error loading file config from storage:', error);
      // Clear corrupted storage
      if (user?.user_id) {
        clearEasyQueryStorage(user.user_id);
      }
    }
  }, [user?.user_id]);

  // Refresh configs from API using getUserDBAccess endpoint
  const refreshConfigs = useCallback(async () => {
    if (!user?.user_id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use getUserDBAccess which returns both db_ids and config_ids
      const response = await ServiceRegistry.userAccess.getUserDBAccess(user.user_id, {
        config_id: true
      });

      if (response.success && response.data) {
        const configIds = response.data.config_ids || [];

        // If we have config_configs from the API with full details, use those
        let configsToSave: FileConfig[] = [];

        if (response.data.config_configs && response.data.config_configs.length > 0) {
          // Use config_configs if available
          configsToSave = response.data.config_configs.map((config: any) => ({
            config_id: config.config_id || config.id,
            config_name: config.db_config?.DB_NAME || config.config_name || config.name || `Config ${config.config_id || config.id}`,
            is_active: config.is_active !== false,
            created_at: config.created_at || new Date().toISOString(),
            updated_at: config.updated_at || new Date().toISOString(),
          }));
        } else if (configIds.length > 0) {
          // Fetch full config details for each config_id to get DB_NAME
          const configPromises = configIds.map(async (configId: number) => {
            try {
              const configResponse = await ServiceRegistry.vectorDB.getConfigById(configId);
              if (configResponse.success && configResponse.data?.data) {
                const configData = configResponse.data.data;
                return {
                  config_id: configData.config_id || configId,
                  config_name: configData.db_config?.DB_NAME || `Config ${configId}`,
                  is_active: configData.is_active !== false,
                  created_at: configData.created_at || new Date().toISOString(),
                  updated_at: configData.updated_at || new Date().toISOString(),
                };
              }
            } catch (err) {
              console.warn(`Failed to fetch config ${configId}:`, err);
            }
            // Fallback if fetch fails
            return {
              config_id: configId,
              config_name: `Config ${configId}`,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });

          configsToSave = await Promise.all(configPromises);
        }

        // Update state
        setAvailableConfigs(configsToSave);
        setUserConfigs(configsToSave);

        // Save to localStorage
        saveToUserStorage(STORAGE_KEYS.AVAILABLE_FILE_CONFIGS, user.user_id, configsToSave);

        // If no current config is set and we have configs, set the first one
        if (!currentConfigId && configsToSave.length > 0) {
          const firstConfig = configsToSave[0];
          setCurrentConfig(firstConfig.config_id, firstConfig.config_name);
        }
      } else {
        setError(response.error || 'Failed to load accessible configs');
      }
    } catch (err: any) {
      console.error('Error refreshing configs:', err);
      setError(err.message || 'Failed to refresh configs');
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, currentConfigId]);

  // Load configs from access response
  const loadConfigsFromAccess = useCallback((configIds: number[]) => {
    const configs: FileConfig[] = configIds.map(id => ({
      config_id: id,
      config_name: `Config ${id}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    setAvailableConfigs(configs);
    setUserConfigs(configs);

    // Save to localStorage
    if (user?.user_id) {
      saveToUserStorage(STORAGE_KEYS.AVAILABLE_FILE_CONFIGS, user.user_id, configs);
    }
  }, [user?.user_id]);

  // Set current config
  const setCurrentConfig = useCallback((configId: number, configName?: string) => {
    // Find the config
    const config = availableConfigs.find(c => c.config_id === configId);

    if (config) {
      const configToSave = {
        ...config,
        config_name: configName || config.config_name || `Config ${configId}`
      };
      setCurrentConfigState(configToSave);
      setCurrentConfigId(configId);
      setCurrentConfigName(configToSave.config_name || `Config ${configId}`);

      // Save to localStorage
      if (user?.user_id) {
        saveToUserStorage(STORAGE_KEYS.CURRENT_FILE_CONFIG, user.user_id, configToSave);
      }
    } else {
      // Config not found in available configs yet, create a basic config
      const basicConfig: FileConfig = {
        config_id: configId,
        config_name: configName || `Config ${configId}`,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCurrentConfigState(basicConfig);
      setCurrentConfigId(configId);
      setCurrentConfigName(configName || `Config ${configId}`);

      // Save to localStorage
      if (user?.user_id) {
        saveToUserStorage(STORAGE_KEYS.CURRENT_FILE_CONFIG, user.user_id, basicConfig);
      }
    }
  }, [availableConfigs, user?.user_id]);

  // Clear current config
  const clearCurrentConfig = useCallback(() => {
    setCurrentConfigState(null);
    setCurrentConfigId(null);
    setCurrentConfigName('');

    // Remove from localStorage
    if (user?.user_id) {
      const key = `${STORAGE_KEYS.CURRENT_FILE_CONFIG}_${user.user_id}`;
      storage.remove(key);
    }
  }, [user?.user_id]);

  // Set loading state
  const setLoadingState = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Set error state
  const setErrorState = useCallback((error: string | null) => {
    setError(error);
  }, []);

  // Memoized context value
  const contextValue = useMemo<FileConfigContextData>(() => ({
    currentConfig,
    currentConfigId,
    currentConfigName,
    availableConfigs,
    userConfigs,
    isLoading,
    error,
    setCurrentConfig,
    loadConfigsFromAccess,
    clearCurrentConfig,
    refreshConfigs,
    setLoading: setLoadingState,
    setError: setErrorState,
    hasCurrentConfig,
    configCount,
    activeConfigCount,
  }), [
    currentConfig,
    currentConfigId,
    currentConfigName,
    availableConfigs,
    userConfigs,
    isLoading,
    error,
    setCurrentConfig,
    loadConfigsFromAccess,
    clearCurrentConfig,
    refreshConfigs,
    setLoadingState,
    setErrorState,
    hasCurrentConfig,
    configCount,
    activeConfigCount,
  ]);

  return (
    <FileConfigContext.Provider value={contextValue}>
      {children}
    </FileConfigContext.Provider>
  );
}
