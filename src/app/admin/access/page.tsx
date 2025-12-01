'use client';

import { useEffect, useState } from 'react';
import { ServiceRegistry } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, CheckCircle2, XCircle, Plus, Database, Box } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface UserAccess {
  db_ids: number[];
  config_ids: number[];
}

export default function AdminAccessPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [databases, setDatabases] = useState<any[]>([]);
  const [vectorDBConfigs, setVectorDBConfigs] = useState<any[]>([]);
  const [userAccess, setUserAccess] = useState<Record<string, UserAccess>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedDatabases, setSelectedDatabases] = useState<number[]>([]);
  const [selectedVectorDBConfigs, setSelectedVectorDBConfigs] = useState<number[]>([]);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersResponse, databasesResponse, vectorDBResponse] = await Promise.all([
        ServiceRegistry.admin.getAllUsers(),
        ServiceRegistry.admin.getAllDatabases(),
        ServiceRegistry.vectorDB.getVectorDBConfigs(),
      ]);

      if (usersResponse.success) {
        setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
        
        // Load access for each user (both db_ids and config_ids)
        const accessMap: Record<string, UserAccess> = {};
        for (const user of usersResponse.data.slice(0, 20)) { // Limit to first 20 for performance
          try {
            const accessResponse = await ServiceRegistry.admin.getUserAccess(user.user_id || user.id);
            if (accessResponse.success) {
              accessMap[user.user_id || user.id] = {
                db_ids: accessResponse.data?.db_ids || [],
                config_ids: accessResponse.data?.config_ids || [],
              };
            }
          } catch {
            // Skip if can't load access
            accessMap[user.user_id || user.id] = {
              db_ids: [],
              config_ids: [],
            };
          }
        }
        setUserAccess(accessMap);
      }

      if (databasesResponse.success) {
        // The API returns {configs: [...], count: N} after the interceptor extracts the data portion
        if (databasesResponse.data && databasesResponse.data.configs && Array.isArray(databasesResponse.data.configs)) {
          setDatabases(databasesResponse.data.configs);
        } else if (Array.isArray(databasesResponse.data)) {
          // Fallback: if response.data is directly an array
          setDatabases(databasesResponse.data);
        } else {
          setDatabases([]);
        }
      }

      if (vectorDBResponse.success) {
        setVectorDBConfigs(Array.isArray(vectorDBResponse.data) ? vectorDBResponse.data : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkGrant = async () => {
    if (!selectedUser || (selectedDatabases.length === 0 && selectedVectorDBConfigs.length === 0)) {
      toast.error('Please select a user and at least one database or vector DB config');
      return;
    }

    try {
      const response = await ServiceRegistry.admin.grantAccess(
        selectedUser,
        selectedDatabases.length > 0 ? selectedDatabases : undefined,
        selectedVectorDBConfigs.length > 0 ? selectedVectorDBConfigs : undefined
      );
      if (response.success) {
        setGrantDialogOpen(false);
        setSelectedUser('');
        setSelectedDatabases([]);
        setSelectedVectorDBConfigs([]);
        loadData();
        toast.success('Access granted successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to grant access');
    }
  };

  const handleRevokeAccess = async (
    userId: string,
    dbIds?: number[],
    configIds?: number[]
  ) => {
    const dbCount = dbIds?.length || 0;
    const configCount = configIds?.length || 0;
    const totalCount = dbCount + configCount;
    
    if (totalCount === 0) {
      toast.error('No access to revoke');
      return;
    }

    const message = `Revoke access to ${dbCount > 0 ? `${dbCount} database(s)` : ''}${dbCount > 0 && configCount > 0 ? ' and ' : ''}${configCount > 0 ? `${configCount} vector DB config(s)` : ''} for user ${userId}?`;
    
    if (!confirm(message)) {
      return;
    }

    try {
      const response = await ServiceRegistry.admin.revokeAccess(
        userId,
        dbIds && dbIds.length > 0 ? dbIds : undefined,
        configIds && configIds.length > 0 ? configIds : undefined
      );
      if (response.success) {
        loadData();
        toast.success('Access revoked successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to revoke access');
    }
  };

  return (
    <AppLayout title="Access Management" description="Manage user-database access permissions">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Access Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user-database access permissions
          </p>
        </div>
        <Dialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Grant Access
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Grant Access</DialogTitle>
              <DialogDescription>
                Select a user and databases/vector DB configs to grant access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.user_id || user.id} value={user.user_id || user.id}>
                        {user.user_id || user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  MSSQL Databases
                </Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {databases.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No databases available
                    </div>
                  ) : (
                    databases.map((db) => (
                      <div key={db.db_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`db-${db.db_id}`}
                          checked={selectedDatabases.includes(db.db_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedDatabases([...selectedDatabases, db.db_id]);
                            } else {
                              setSelectedDatabases(selectedDatabases.filter(id => id !== db.db_id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`db-${db.db_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {db.db_name || `Database ${db.db_id}`}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  Vector DB Configs
                </Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {vectorDBConfigs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No vector DB configs available
                    </div>
                  ) : (
                    vectorDBConfigs.map((config) => (
                      <div key={config.db_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`config-${config.db_id}`}
                          checked={selectedVectorDBConfigs.includes(config.db_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedVectorDBConfigs([...selectedVectorDBConfigs, config.db_id]);
                            } else {
                              setSelectedVectorDBConfigs(selectedVectorDBConfigs.filter(id => id !== config.db_id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`config-${config.db_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {config.db_config?.DB_NAME || `Vector DB Config ${config.db_id}`}
                          {config.db_config?.DB_HOST && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({config.db_config.DB_HOST}:{config.db_config.DB_PORT})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <Button 
                onClick={handleBulkGrant} 
                className="w-full"
                disabled={selectedDatabases.length === 0 && selectedVectorDBConfigs.length === 0}
              >
                Grant Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading access data...</div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => {
            const userId = user.user_id || user.id;
            const access = userAccess[userId] || { db_ids: [], config_ids: [] };
            const userDatabases = databases.filter(db => access.db_ids.includes(db.db_id));
            const userVectorDBConfigs = vectorDBConfigs.filter(config => access.config_ids.includes(config.db_id));
            const totalAccess = userDatabases.length + userVectorDBConfigs.length;

            return (
              <Card key={userId}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {userId}
                        <Shield className="h-4 w-4 text-blue-600" />
                      </CardTitle>
                      <CardDescription>
                        Access to {userDatabases.length} database(s) and {userVectorDBConfigs.length} vector DB config(s)
                      </CardDescription>
                    </div>
                    {totalAccess > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeAccess(userId, access.db_ids, access.config_ids)}
                      >
                        Revoke All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userDatabases.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        <Label className="text-sm font-semibold">MSSQL Databases</Label>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {userDatabases.map((db) => (
                          <div
                            key={db.db_id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="text-sm">{db.db_name || `Database ${db.db_id}`}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeAccess(userId, [db.db_id])}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userVectorDBConfigs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Box className="h-4 w-4 text-purple-500" />
                        <Label className="text-sm font-semibold">Vector DB Configs</Label>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        {userVectorDBConfigs.map((config) => (
                          <div
                            key={config.db_id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <span className="text-sm">
                              {config.db_config?.DB_NAME || `Vector DB Config ${config.db_id}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeAccess(userId, undefined, [config.db_id])}
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {totalAccess === 0 && (
                    <p className="text-sm text-muted-foreground">No access granted</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
    </AppLayout>
  );
}

