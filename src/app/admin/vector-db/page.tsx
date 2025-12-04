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
  List
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

export default function VectorDBManagementPage() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [configs, setConfigs] = useState<VectorDBConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const filteredConfigs = configs.filter(config => 
    config.db_config?.DB_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.db_id.toString().includes(searchQuery)
  );

  const columns: ColumnDef<VectorDBConfig>[] = [
    {
      accessorKey: "db_id",
      header: "Config ID",
      cell: ({ row }) => <div className="text-gray-400">#{row.getValue("db_id")}</div>,
    },
    {
      accessorKey: "db_config.DB_NAME",
      header: "Database Name",
      cell: ({ row }) => <div className="font-medium text-white">{row.original.db_config?.DB_NAME || 'Unknown'}</div>,
    },
    {
      accessorKey: "db_config.DB_HOST",
      header: "Host",
      cell: ({ row }) => <div className="text-gray-400">{row.original.db_config?.DB_HOST || '-'}</div>,
    },
    {
      accessorKey: "updated_at",
      header: "Last Updated",
      cell: ({ row }) => {
        const date = row.getValue("updated_at") as string;
        return <div className="text-gray-400">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const config = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1f2e] border-white/10 text-white">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => openTableDialog(config)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                <Table className="mr-2 h-4 w-4" />
                Manage Tables
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
        icon={<Cpu className="w-6 h-6 text-purple-400" />}
      />

      <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search configs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
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
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Tables</DialogTitle>
            <DialogDescription className="text-gray-400">
              Manage accessible tables for <strong>{selectedConfig?.db_config?.DB_NAME}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Add Table Form */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="tableName" className="sr-only">Table Name</Label>
                <Input
                  id="tableName"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="Enter table name"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                />
              </div>
              <Button onClick={handleAddTable} disabled={addingTable} className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Tables List */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-400">Configured Tables</Label>
              {loadingTables ? (
                <div className="text-center py-4 text-gray-500">Loading tables...</div>
              ) : tables.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-lg text-gray-500">
                  No tables configured yet
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                  {tables.map((table) => (
                    <div key={table} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 group hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <Table className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-200">{table}</span>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
