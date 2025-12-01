'use client';

import { useEffect, useState } from 'react';
import { ServiceRegistry } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Database as DatabaseIcon, CheckCircle2, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Database {
  db_id: number;
  db_name: string;
  db_url?: string;
  business_rule?: string;
}

export default function AdminDatabasesPage() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState<Database | null>(null);
  const [deletingDatabaseId, setDeletingDatabaseId] = useState<number | null>(null);
  const [newDbName, setNewDbName] = useState('');
  const [newDbUrl, setNewDbUrl] = useState('');
  const [newBusinessRule, setNewBusinessRule] = useState('');
  const [editDbName, setEditDbName] = useState('');
  const [editDbUrl, setEditDbUrl] = useState('');
  const [editBusinessRule, setEditBusinessRule] = useState('');
  const [syncingDbId, setSyncingDbId] = useState<number | null>(null);
  const [learnSyncTasks, setLearnSyncTasks] = useState<Record<number, {
    taskId: string;
    status: string;
    progress: number;
    currentStep: number;
    totalSteps: number;
    stepName: string;
    message?: string;
  }>>({});

  useEffect(() => {
    loadDatabases();
  }, []);

  // Poll learn-sync task status
  useEffect(() => {
    const activeTasks = Object.entries(learnSyncTasks).filter(
      ([_, task]) => {
        const status = task.status?.toLowerCase();
        return status === 'queued' || 
               status === 'processing' || 
               status === 'running' || 
               status === 'pending';
      }
    );

    if (activeTasks.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const [dbIdStr, task] of activeTasks) {
        const dbId = parseInt(dbIdStr);
        try {
          const response = await ServiceRegistry.admin.getDbQueryUpdateTaskStatus(task.taskId);
          if (response.success && response.data) {
            const taskData = response.data;
            // Use status directly, no cancel check needed
            const status = taskData.status || 'processing';
            const progress = taskData.progress_percentage ?? 0;
            const currentStep = taskData.current_step ?? 0;
            const totalSteps = taskData.total_steps ?? 3;
            const stepName = taskData.step_name || taskData.message || 'Processing...';

            setLearnSyncTasks(prev => {
              const prevStatus = prev[dbId]?.status;
              const db = databases.find(d => d.db_id === dbId);
              
              // If task is completed or failed, show notification (only once)
              const normalizedStatus = status?.toLowerCase();
              const normalizedPrevStatus = prevStatus?.toLowerCase();
              
              if ((normalizedStatus === 'completed' || normalizedStatus === 'success') && 
                  normalizedPrevStatus !== 'completed' && normalizedPrevStatus !== 'success') {
                toast.success(`Learning sync completed for database ${db?.db_name || dbId}`);
              } else if ((normalizedStatus === 'failed' || normalizedStatus === 'error') && 
                         normalizedPrevStatus !== 'failed' && normalizedPrevStatus !== 'error') {
                toast.error(`Learning sync failed for database ${db?.db_name || dbId}: ${taskData.error || 'Unknown error'}`);
              }

              return {
                ...prev,
                [dbId]: {
                  ...prev[dbId],
                  status,
                  progress,
                  currentStep,
                  totalSteps,
                  stepName,
                  message: taskData.message,
                },
              };
            });
          }
        } catch (error) {
          console.error(`Failed to poll task status for db ${dbId}:`, error);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [learnSyncTasks, databases]);

  const loadDatabases = async () => {
    try {
      setLoading(true);
      const response = await ServiceRegistry.admin.getAllDatabases();
      if (response.success) {
        // The API returns {configs: [...], count: N} after the interceptor extracts the data portion
        if (response.data && response.data.configs && Array.isArray(response.data.configs)) {
          setDatabases(response.data.configs);
        } else if (Array.isArray(response.data)) {
          // Fallback: if response.data is directly an array
          setDatabases(response.data);
        } else {
          setDatabases([]);
        }
      }
    } catch (error) {
      console.error('Failed to load databases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName) {
      toast.error('Database name is required');
      return;
    }

    try {
      const response = await ServiceRegistry.admin.createDatabase({
        db_name: newDbName,
        db_url: newDbUrl || undefined,
        business_rule: newBusinessRule || undefined,
      });
      if (response.success) {
        setCreateDialogOpen(false);
        setNewDbName('');
        setNewDbUrl('');
        setNewBusinessRule('');
        loadDatabases();
        
        // Try to extract db_id from response and trigger learn-sync
        const dbId = response.data?.db_id || response.data?.data?.db_id || response.data?.id;
        if (dbId && typeof dbId === 'number') {
          // Trigger learn-sync in background
          handleTriggerLearnSync(dbId, false).catch(() => {
            // Silently fail - user can manually trigger later
          });
        }
        
        toast.success('Database creation started. Learning sync will be initiated automatically if database ID is available.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create database');
    }
  };

  const handleEditDatabase = (db: Database) => {
    setEditingDatabase(db);
    setEditDbName(db.db_name);
    setEditDbUrl(db.db_url || '');
    setEditBusinessRule(db.business_rule || '');
    setEditDialogOpen(true);
  };

  const handleUpdateDatabase = async () => {
    if (!editingDatabase || !editDbName) {
      toast.error('Database name is required');
      return;
    }

    try {
      const response = await ServiceRegistry.admin.updateDatabase(editingDatabase.db_id, {
        db_name: editDbName,
        db_url: editDbUrl || undefined,
        business_rule: editBusinessRule || undefined,
      });
      if (response.success) {
        setEditDialogOpen(false);
        setEditingDatabase(null);
        setEditDbName('');
        setEditDbUrl('');
        setEditBusinessRule('');
        loadDatabases();
        toast.success('Database updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update database');
    }
  };

  const handleDeleteDatabase = (dbId: number) => {
    setDeletingDatabaseId(dbId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDatabaseId) return;

    try {
      const response = await ServiceRegistry.admin.deleteDatabase(deletingDatabaseId);
      if (response.success) {
        setDeleteDialogOpen(false);
        setDeletingDatabaseId(null);
        loadDatabases();
        toast.success('Database deleted successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete database');
    }
  };

  const handleTriggerLearnSync = async (dbId: number, showAlert: boolean = true) => {
    try {
      setSyncingDbId(dbId);
      const response = await ServiceRegistry.admin.triggerDatabaseLearnSync(dbId);
      if (response.success) {
        const taskId = response.data?.task_id;
        if (taskId) {
          // Store task info for polling
          setLearnSyncTasks(prev => ({
            ...prev,
            [dbId]: {
              taskId,
              status: 'queued',
              progress: 0,
              currentStep: 0,
              totalSteps: 3,
              stepName: 'Queued',
            },
          }));

          if (showAlert) {
            toast.success(`Learning sync started. Task ID: ${taskId}`);
          }
        } else {
          if (showAlert) {
            toast.success('Learning sync started successfully');
          }
        }
      }
    } catch (error: any) {
      if (showAlert) {
        toast.error(error.message || 'Failed to trigger learning sync');
      }
      throw error;
    } finally {
      setSyncingDbId(null);
    }
  };

  const filteredDatabases = databases.filter(db =>
    db.db_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    db.db_id.toString().includes(searchTerm)
  );

  return (
    <AppLayout title="Database Management" description="Configure and manage database connections">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Database Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage database connections
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Database
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Database Configuration</DialogTitle>
              <DialogDescription>
                Add a new database connection. This will start a background task to configure the database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="dbName">Database Name *</Label>
                <Input
                  id="dbName"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="Enter database name"
                />
              </div>
              <div>
                <Label htmlFor="dbUrl">Database URL</Label>
                <Input
                  id="dbUrl"
                  value={newDbUrl}
                  onChange={(e) => setNewDbUrl(e.target.value)}
                  placeholder="mssql://server:port/database"
                />
              </div>
              <div>
                <Label htmlFor="businessRule">Business Rules</Label>
                <Textarea
                  id="businessRule"
                  value={newBusinessRule}
                  onChange={(e) => setNewBusinessRule(e.target.value)}
                  placeholder="Enter business rules (optional)"
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateDatabase} className="w-full">
                Create Database
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search databases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading databases...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDatabases.map((db) => (
            <Card key={db.db_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle>{db.db_name}</CardTitle>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <CardDescription>ID: {db.db_id}</CardDescription>
              </CardHeader>
              <CardContent>
                {db.db_url && (
                  <p className="text-sm text-muted-foreground truncate">
                    {db.db_url}
                  </p>
                )}
                
                {/* Learn Sync Progress */}
                {learnSyncTasks[db.db_id] && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {(learnSyncTasks[db.db_id].status === 'queued' || 
                          learnSyncTasks[db.db_id].status === 'processing' || 
                          learnSyncTasks[db.db_id].status === 'running' ||
                          learnSyncTasks[db.db_id].status === 'pending') && (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        )}
                        {(learnSyncTasks[db.db_id].status === 'completed' || 
                          learnSyncTasks[db.db_id].status === 'success') && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {(learnSyncTasks[db.db_id].status === 'failed' || 
                          learnSyncTasks[db.db_id].status === 'error') && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">Learning Sync</span>
                      </div>
                      <Badge variant={
                        learnSyncTasks[db.db_id].status === 'completed' || learnSyncTasks[db.db_id].status === 'success' 
                          ? 'default' 
                          : learnSyncTasks[db.db_id].status === 'failed' || learnSyncTasks[db.db_id].status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }>
                        {learnSyncTasks[db.db_id].status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {learnSyncTasks[db.db_id].stepName}
                    </p>
                    <Progress 
                      value={learnSyncTasks[db.db_id].progress} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Step {learnSyncTasks[db.db_id].currentStep} of {learnSyncTasks[db.db_id].totalSteps}</span>
                      <span>{learnSyncTasks[db.db_id].progress}%</span>
                    </div>
                    {(learnSyncTasks[db.db_id].status === 'completed' || learnSyncTasks[db.db_id].status === 'success') && (
                      <button
                        onClick={() => {
                          setLearnSyncTasks(prev => {
                            const newTasks = { ...prev };
                            delete newTasks[db.db_id];
                            return newTasks;
                          });
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground mt-2"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditDatabase(db)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTriggerLearnSync(db.db_id)}
                    disabled={syncingDbId === db.db_id}
                    title="Trigger learning sync for this database"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncingDbId === db.db_id ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDeleteDatabase(db.db_id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredDatabases.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No databases found
            </div>
          )}
        </div>
      )}

      {/* Edit Database Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Database Configuration</DialogTitle>
            <DialogDescription>
              Update the database connection settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editDbName">Database Name *</Label>
              <Input
                id="editDbName"
                value={editDbName}
                onChange={(e) => setEditDbName(e.target.value)}
                placeholder="Enter database name"
              />
            </div>
            <div>
              <Label htmlFor="editDbUrl">Database URL</Label>
              <Input
                id="editDbUrl"
                value={editDbUrl}
                onChange={(e) => setEditDbUrl(e.target.value)}
                placeholder="mssql://server:port/database"
              />
            </div>
            <div>
              <Label htmlFor="editBusinessRule">Business Rules</Label>
              <Textarea
                id="editBusinessRule"
                value={editBusinessRule}
                onChange={(e) => setEditBusinessRule(e.target.value)}
                placeholder="Enter business rules (optional)"
                rows={4}
              />
            </div>
            <Button onClick={handleUpdateDatabase} className="w-full">
              Update Database
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this database configuration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingDatabaseId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppLayout>
  );
}

