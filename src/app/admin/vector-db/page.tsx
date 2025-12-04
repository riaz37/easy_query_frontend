"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Cpu, 
  Search, 
  Plus, 
  MoreVertical, 
  RefreshCw,
  Trash2,
  Table,
  Edit,
  XIcon
} from "lucide-react";
import { vectorDBService, VectorDBConfig } from "@/lib/api/services/vector-db-service";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function VectorDBManagementPage() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [configs, setConfigs] = useState<VectorDBConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create/Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<Partial<{
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    schema: string;
  }>>({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<VectorDBConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Table Management State
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<VectorDBConfig | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [newTableName, setNewTableName] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [addingTable, setAddingTable] = useState(false);

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchConfigs();
    }
  }, [isInitialized, tokens, router]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await vectorDBService.getVectorDBConfigs();
      // The API returns data in response.data array
      if (response.success && Array.isArray(response.data)) {
        setConfigs(response.data);
      } else {
        setConfigs([]);
      }
    } catch (error) {
      console.error("Failed to fetch vector configs:", error);
      toast.error("Failed to load vector configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async (configId: number) => {
    try {
      setLoadingTables(true);
      const response = await vectorDBService.getUserTableNames(configId);
      if (response.success && Array.isArray(response.data)) {
        setTables(response.data);
      } else {
        setTables([]);
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
      toast.error("Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  const openTableDialog = (config: VectorDBConfig) => {
    setSelectedConfig(config);
    setNewTableName("");
    setIsTableDialogOpen(true);
    fetchTables(config.db_id);
  };

  const handleAddTable = async () => {
    if (!selectedConfig || !newTableName.trim()) return;

    try {
      setAddingTable(true);
      const response = await vectorDBService.addUserTableName(newTableName, selectedConfig.db_id);
      
      if (response.success) {
        toast.success("Table added successfully");
        setNewTableName("");
        fetchTables(selectedConfig.db_id);
      } else {
        toast.error(response.error || "Failed to add table");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add table");
    } finally {
      setAddingTable(false);
    }
  };

  const handleDeleteTable = async (tableName: string) => {
    if (!selectedConfig) return;

    try {
      const response = await vectorDBService.deleteUserTableName(tableName, selectedConfig.db_id);
      
      if (response.success) {
        toast.success("Table removed successfully");
        fetchTables(selectedConfig.db_id);
      } else {
        toast.error(response.error || "Failed to remove table");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove table");
    }
  };

  const handleSubmit = async () => {
    if (!currentConfig.DB_NAME || !currentConfig.DB_HOST || !currentConfig.DB_USER || !currentConfig.DB_PASSWORD || !currentConfig.schema) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!currentConfig.DB_PORT || currentConfig.DB_PORT <= 0 || currentConfig.DB_PORT > 65535) {
      toast.error("Port must be a valid number between 1 and 65535");
      return;
    }

    try {
      setSubmitting(true);
      
      const config = {
        DB_HOST: currentConfig.DB_HOST!,
        DB_PORT: currentConfig.DB_PORT!,
        DB_NAME: currentConfig.DB_NAME!,
        DB_USER: currentConfig.DB_USER!,
        DB_PASSWORD: currentConfig.DB_PASSWORD!,
        schema: currentConfig.schema!,
      };

      let response;
      if (isEditMode && selectedConfig) {
        response = await vectorDBService.updateVectorDBConfig(selectedConfig.db_id, config);
      } else {
        response = await vectorDBService.createVectorDBConfig(config);
      }
      
      if (response.success) {
        toast.success(isEditMode ? "Vector DB config updated successfully" : "Vector DB config created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchConfigs();
      } else {
        toast.error(response.error || "Operation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      setDeleting(true);
      const response = await vectorDBService.deleteVectorDBConfig(configToDelete.db_id);
      
      if (response.success) {
        toast.success("Vector DB config deleted successfully");
        setIsDeleteDialogOpen(false);
        setConfigToDelete(null);
        fetchConfigs();
      } else {
        toast.error(response.error || "Failed to delete config");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete config");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setCurrentConfig({});
    setIsEditMode(false);
    setSelectedConfig(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: VectorDBConfig) => {
    setSelectedConfig(config);
    setCurrentConfig({
      DB_HOST: config.db_config?.DB_HOST || "",
      DB_PORT: config.db_config?.DB_PORT || 5432,
      DB_NAME: config.db_config?.DB_NAME || "",
      DB_USER: config.db_config?.DB_USER || "",
      DB_PASSWORD: "", // Don't pre-fill password
      schema: config.db_config?.schema || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const filteredConfigs = configs.filter(config => 
    config.db_config?.DB_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.db_id.toString().includes(searchQuery)
  );

  const columns: ColumnDef<VectorDBConfig>[] = [
    {
      accessorKey: "db_id",
      header: "Config ID",
      cell: ({ row }) => <div className="text-gray-400 font-public-sans">#{row.getValue("db_id")}</div>,
    },
    {
      accessorKey: "db_config.DB_NAME",
      header: "Database Name",
      cell: ({ row }) => <div className="font-medium text-white font-barlow">{row.original.db_config?.DB_NAME || 'Unknown'}</div>,
    },
    {
      accessorKey: "db_config.DB_HOST",
      header: "Host",
      cell: ({ row }) => <div className="text-gray-400 font-public-sans">{row.original.db_config?.DB_HOST || '-'}</div>,
    },
    {
      accessorKey: "updated_at",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as string;
        return <div className="text-gray-400 font-public-sans">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const config = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-white/5">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/10 text-white">
              <DropdownMenuLabel className="text-white font-barlow">Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => openEditDialog(config)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Configuration
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openTableDialog(config)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
              >
                <Table className="mr-2 h-4 w-4" />
                Manage Tables
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => {
                  setConfigToDelete(config);
                  setIsDeleteDialogOpen(true);
                }}
                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                Delete Config
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
      <PageHeader 
        title="Vector DB Management" 
        description="Manage vector database configurations and tables"
        icon={<Cpu className="w-6 h-6 text-emerald-400" />}
        actions={
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
            <Plus className="w-4 h-4 mr-2" />
            Add Vector DB
          </Button>
        }
      />

      <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
              placeholder="Search configs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchConfigs} className="ml-2 border-white/10 text-gray-400 hover:text-white hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredConfigs} 
          loading={loading}
        />
      </Card>

      {/* Manage Tables Dialog */}
      <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      Manage Tables
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Manage accessible tables for <strong>{selectedConfig?.db_config?.DB_NAME}</strong>.
                    </p>
                  </div>
                  <button onClick={() => setIsTableDialogOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                <div className="py-4 space-y-6">
                  {/* Add Table Form */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="tableName" className="sr-only">Table Name</Label>
                      <Input
                        id="tableName"
                        value={newTableName}
                        onChange={(e) => setNewTableName(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                        placeholder="Enter table name"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                      />
                    </div>
                    <Button onClick={handleAddTable} disabled={addingTable} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Tables List */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-400 font-public-sans">Configured Tables</Label>
                    {loadingTables ? (
                      <div className="text-center py-4 text-gray-500 font-public-sans">Loading tables...</div>
                    ) : tables.length === 0 ? (
                      <EmptyState
                        icon={Table}
                        title="No Tables Configured"
                        description="Add tables to make them accessible for this vector database configuration"
                        variant="dashed"
                        showAction={false}
                        size="sm"
                      />
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {tables.map((table) => (
                          <div key={table} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                              <Table className="w-4 h-4 text-emerald-400" />
                              <span className="text-sm text-gray-200 font-public-sans">{table}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteTable(table)}
                              className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  <Button variant="outline" onClick={() => setIsTableDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                    Close
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      {isEditMode ? "Edit Vector DB Config" : "Add New Vector DB Config"}
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Configure connection details for the vector database.
                    </p>
                  </div>
                  <button onClick={() => setIsDialogOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dbName" className="text-white font-public-sans">Database Name *</Label>
                    <Input
                      id="dbName"
                      value={currentConfig.DB_NAME || ""}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, DB_NAME: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="e.g. vector_db"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dbHost" className="text-white font-public-sans">Host *</Label>
                      <Input
                        id="dbHost"
                        value={currentConfig.DB_HOST || ""}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, DB_HOST: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                        placeholder="localhost"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dbPort" className="text-white font-public-sans">Port *</Label>
                      <Input
                        id="dbPort"
                        type="number"
                        value={currentConfig.DB_PORT || ""}
                        onChange={(e) => setCurrentConfig({ ...currentConfig, DB_PORT: parseInt(e.target.value) || 0 })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                        placeholder="5432"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbUser" className="text-white font-public-sans">Username *</Label>
                    <Input
                      id="dbUser"
                      value={currentConfig.DB_USER || ""}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, DB_USER: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="postgres"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbPassword" className="text-white font-public-sans">Password *</Label>
                    <Input
                      id="dbPassword"
                      type="password"
                      value={currentConfig.DB_PASSWORD || ""}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, DB_PASSWORD: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="********"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="schema" className="text-white font-public-sans">Schema *</Label>
                    <Input
                      id="schema"
                      value={currentConfig.schema || ""}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, schema: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="public"
                    />
                  </div>
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                    {submitting ? "Saving..." : (isEditMode ? "Update Config" : "Create Config")}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Vector DB Config"
        message={`Are you sure you want to delete ${configToDelete?.db_config?.DB_NAME}? This action cannot be undone.`}
        confirmText="Delete Config"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />
    </PageLayout>
  );
}
