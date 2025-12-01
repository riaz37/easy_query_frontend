import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '@/components/providers/AuthContextProvider';
import { ServiceRegistry } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';

export interface DatabaseConfig {
  db_id: number;
  db_name: string;
  db_url: string;
  db_type: string;
  business_rule?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to fetch and manage user's accessible databases
 * Fetches on-demand, uses URL params for current selection
 */
export function useDatabases() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch databases (only when needed)
  const fetchDatabases = useCallback(async () => {
    if (!user?.user_id) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await ServiceRegistry.userAccess.getUserDBAccess(user.user_id, {
        db_id: true,
        db_name: true,
        db_url: true,
        config_id: true,
        business_rule: false,
        table_info: false,
        db_schema: false,
        dbPath: false,
        report_structure: false,
        db_config: false,
        access_level: false,
        accessible_tables: false,
        table_names: false,
        is_latest: false,
        created_at: false,
        updated_at: false,
      });

      if (!response.success || !response.data) {
        setDatabases([]);
        return;
      }

      const responseData = response.data.data || response.data;
      
      // The API returns access_details array with db_config objects
      const accessDetails = responseData.access_details || [];
      const dbConfigs = responseData.db_configs || [];
      const dbIds = responseData.db_ids || [];

      // Try to extract databases from access_details first (most complete)
      if (accessDetails.length > 0) {
        const databasesList = accessDetails
          .map((detail: any) => {
            const config = detail.db_config || detail;
            if (!config || !config.db_id) return null;
            
            return {
              db_id: config.db_id,
              db_name: config.db_name || `Database ${config.db_id}`,
              db_url: config.db_url || '',
              db_type: config.db_type || 'mssql',
              business_rule: config.business_rule || '',
              is_active: config.is_active !== false,
              created_at: config.created_at || new Date().toISOString(),
              updated_at: config.updated_at || new Date().toISOString(),
            };
          })
          .filter((db: any) => db !== null);
        
        if (databasesList.length > 0) {
          setDatabases(databasesList);
          return;
        }
      }

      // Fallback to db_configs array
      if (dbConfigs.length > 0) {
        setDatabases(dbConfigs.map((config: any) => ({
          db_id: config.db_id || config.id,
          db_name: config.db_name || config.name || `Database ${config.db_id || config.id}`,
          db_url: config.db_url || config.url || '',
          db_type: config.db_type || 'mssql',
          business_rule: config.business_rule || '',
          is_active: config.is_active !== false,
          created_at: config.created_at || new Date().toISOString(),
          updated_at: config.updated_at || new Date().toISOString(),
        })));
      } else if (dbIds.length > 0) {
        // If only IDs, return basic configs (shouldn't happen with db_name=true)
        setDatabases(dbIds.map((id: number) => ({
          db_id: id,
          db_name: `Database ${id}`,
          db_url: '',
          db_type: 'mssql',
          business_rule: '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })));
      } else {
        setDatabases([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch databases');
      setDatabases([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id]);

  // Get current database from URL params
  const currentDatabaseId = useMemo(() => {
    const dbId = searchParams.get('db_id');
    return dbId ? parseInt(dbId, 10) : null;
  }, [searchParams]);

  const currentDatabase = useMemo(() => {
    if (!currentDatabaseId) return null;
    return databases.find(db => db.db_id === currentDatabaseId) || null;
  }, [databases, currentDatabaseId]);

  // Set current database (updates URL)
  const setCurrentDatabase = useCallback((dbId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('db_id', dbId.toString());
    window.history.pushState({}, '', `?${params.toString()}`);
  }, [searchParams]);

  return {
    databases,
    currentDatabase,
    currentDatabaseId,
    isLoading,
    error: error?.message || null,
    setCurrentDatabase,
    refetch: fetchDatabases,
  };
}

