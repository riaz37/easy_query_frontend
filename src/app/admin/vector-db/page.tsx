'use client';

import { useEffect, useState } from 'react';
import { vectorDBService } from '@/lib/api/services/vector-db-service';
import { DatabaseConfigService } from '@/lib/api/services/database-config-service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Database as DatabaseIcon, CheckCircle2, XCircle, Table } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VectorDBConfig {
  db_id: number;
  db_config: {
    schema: string;
    DB_HOST: string;
    DB_NAME: string;
    DB_PORT: number;
    DB_USER: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at: string;
}

export default function AdminVectorDBPage() {
  const [configs, setConfigs] = useState<VectorDBConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<VectorDBConfig | null>(null);
  const [deletingConfigId, setDeletingConfigId] = useState<number | null>(null);
  
  // Form states for create
  const [newDbHost, setNewDbHost] = useState('');
  const [newDbPort, setNewDbPort] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [newDbUser, setNewDbUser] = useState('');
  const [newDbPassword, setNewDbPassword] = useState('');
  const [newSchema, setNewSchema] = useState('');
  
  // Form states for edit
  const [editDbHost, setEditDbHost] = useState('');
  const [editDbPort, setEditDbPort] = useState('');
  const [editDbName, setEditDbName] = useState('');
  const [editDbUser, setEditDbUser] = useState('');
  const [editDbPassword, setEditDbPassword] = useState('');
  const [editSchema, setEditSchema] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await vectorDBService.getVectorDBConfigs();
      if (response.success && response.data) {
        setConfigs(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to load vector DB configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async () => {
    if (!newDbHost || !newDbPort || !newDbName || !newDbUser || !newDbPassword || !newSchema) {
      toast.error('All fields are required');
      return;
    }

    try {
      const validation = DatabaseConfigService.validateDatabaseConfig({
        DB_HOST: newDbHost,
        DB_PORT: parseInt(newDbPort),
        DB_NAME: newDbName,
        DB_USER: newDbUser,
        DB_PASSWORD: newDbPassword,
        schema: newSchema,
      });

      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return;
      }

      await DatabaseConfigService.createDatabaseConfig({
        db_config: {
          DB_HOST: newDbHost,
          DB_PORT: parseInt(newDbPort),
          DB_NAME: newDbName,
          DB_USER: newDbUser,
          DB_PASSWORD: newDbPassword,
          schema: newSchema,
        },
      });

      setCreateDialogOpen(false);
      resetCreateForm();
      loadConfigs();
      toast.success('Vector DB configuration created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create vector DB configuration');
    }
  };

  const handleEditConfig = (config: VectorDBConfig) => {
    setEditingConfig(config);
    setEditDbHost(config.db_config.DB_HOST);
    setEditDbPort(config.db_config.DB_PORT.toString());
    setEditDbName(config.db_config.DB_NAME);
    setEditDbUser(config.db_config.DB_USER);
    setEditDbPassword(''); // Don't pre-fill password
    setEditSchema(config.db_config.schema);
    setEditDialogOpen(true);
  };

  const handleUpdateConfig = async () => {
    if (!editingConfig || !editDbHost || !editDbPort || !editDbName || !editDbUser || !editSchema) {
      toast.error('All fields except password are required');
      return;
    }

    try {
      const dbConfig: any = {
        DB_HOST: editDbHost,
        DB_PORT: parseInt(editDbPort),
        DB_NAME: editDbName,
        DB_USER: editDbUser,
        schema: editSchema,
      };

      // Only include password if it was changed
      if (editDbPassword) {
        dbConfig.DB_PASSWORD = editDbPassword;
      } else {
        // If password not provided, we might need to get it from existing config
        // For now, we'll require it or use a placeholder
        dbConfig.DB_PASSWORD = editingConfig.db_config.DB_PASSWORD || '';
      }

      const validation = DatabaseConfigService.validateDatabaseConfig(dbConfig);
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return;
      }

      await DatabaseConfigService.updateDatabaseConfig(editingConfig.db_id, {
        db_config: dbConfig,
      });

      setEditDialogOpen(false);
      setEditingConfig(null);
      resetEditForm();
      loadConfigs();
      toast.success('Vector DB configuration updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vector DB configuration');
    }
  };

  const handleDeleteConfig = (configId: number) => {
    setDeletingConfigId(configId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingConfigId) return;

    try {
      await DatabaseConfigService.deleteDatabaseConfig(deletingConfigId);
      setDeleteDialogOpen(false);
      setDeletingConfigId(null);
      loadConfigs();
      toast.success('Vector DB configuration deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vector DB configuration');
    }
  };

  const resetCreateForm = () => {
    setNewDbHost('');
    setNewDbPort('');
    setNewDbName('');
    setNewDbUser('');
    setNewDbPassword('');
    setNewSchema('');
  };

  const resetEditForm = () => {
    setEditDbHost('');
    setEditDbPort('');
    setEditDbName('');
    setEditDbUser('');
    setEditDbPassword('');
    setEditSchema('');
  };

  const filteredConfigs = configs.filter(config =>
    config.db_config.DB_NAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.db_config.DB_HOST.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.db_id.toString().includes(searchTerm)
  );

  return (
    <AppLayout title="Vector DB Management" description="Configure and manage vector database connections">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vector DB Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure and manage vector database connections for file search
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vector DB
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Vector DB Configuration</DialogTitle>
              <DialogDescription>
                Add a new vector database connection for file search functionality.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dbHost">Database Host *</Label>
                  <Input
                    id="dbHost"
                    value={newDbHost}
                    onChange={(e) => setNewDbHost(e.target.value)}
                    placeholder="localhost"
                  />
                </div>
                <div>
                  <Label htmlFor="dbPort">Database Port *</Label>
                  <Input
                    id="dbPort"
                    type="number"
                    value={newDbPort}
                    onChange={(e) => setNewDbPort(e.target.value)}
                    placeholder="5432"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dbName">Database Name *</Label>
                <Input
                  id="dbName"
                  value={newDbName}
                  onChange={(e) => setNewDbName(e.target.value)}
                  placeholder="vectordb"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dbUser">Database User *</Label>
                  <Input
                    id="dbUser"
                    value={newDbUser}
                    onChange={(e) => setNewDbUser(e.target.value)}
                    placeholder="postgres"
                  />
                </div>
                <div>
                  <Label htmlFor="dbPassword">Database Password *</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    value={newDbPassword}
                    onChange={(e) => setNewDbPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="schema">Schema *</Label>
                <Input
                  id="schema"
                  value={newSchema}
                  onChange={(e) => setNewSchema(e.target.value)}
                  placeholder="public"
                />
              </div>
              <Button onClick={handleCreateConfig} className="w-full">
                Create Vector DB
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vector DB configs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading vector DB configs...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredConfigs.map((config) => (
            <Card key={config.db_id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="h-5 w-5 text-purple-600" />
                    <CardTitle className="truncate">{config.db_config.DB_NAME}</CardTitle>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <CardDescription>
                  <div className="flex flex-col gap-1 mt-2">
                    <span>ID: {config.db_id}</span>
                    <span className="text-xs">{config.db_config.DB_HOST}:{config.db_config.DB_PORT}</span>
                    <Badge variant="outline" className="w-fit mt-1">
                      <Table className="mr-1 h-3 w-3" />
                      Schema: {config.db_config.schema}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span className="font-mono">{config.db_config.DB_USER}</span>
                  </div>
                  {config.created_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(config.created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditConfig(config)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleDeleteConfig(config.db_id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredConfigs.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No vector DB configs found
            </div>
          )}
        </div>
      )}

      {/* Edit Config Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vector DB Configuration</DialogTitle>
            <DialogDescription>
              Update the vector database connection settings. Leave password empty to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDbHost">Database Host *</Label>
                <Input
                  id="editDbHost"
                  value={editDbHost}
                  onChange={(e) => setEditDbHost(e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div>
                <Label htmlFor="editDbPort">Database Port *</Label>
                <Input
                  id="editDbPort"
                  type="number"
                  value={editDbPort}
                  onChange={(e) => setEditDbPort(e.target.value)}
                  placeholder="5432"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editDbName">Database Name *</Label>
              <Input
                id="editDbName"
                value={editDbName}
                onChange={(e) => setEditDbName(e.target.value)}
                placeholder="vectordb"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDbUser">Database User *</Label>
                <Input
                  id="editDbUser"
                  value={editDbUser}
                  onChange={(e) => setEditDbUser(e.target.value)}
                  placeholder="postgres"
                />
              </div>
              <div>
                <Label htmlFor="editDbPassword">Database Password (leave empty to keep current)</Label>
                <Input
                  id="editDbPassword"
                  type="password"
                  value={editDbPassword}
                  onChange={(e) => setEditDbPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editSchema">Schema *</Label>
              <Input
                id="editSchema"
                value={editSchema}
                onChange={(e) => setEditSchema(e.target.value)}
                placeholder="public"
              />
            </div>
            <Button onClick={handleUpdateConfig} className="w-full">
              Update Vector DB
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vector DB Configuration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vector DB configuration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingConfigId(null);
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

