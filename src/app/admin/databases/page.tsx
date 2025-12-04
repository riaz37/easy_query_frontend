"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Database, 
  Search, 
  Plus, 
  MoreVertical, 
  RefreshCw,
  Trash2,
  Edit,
  Play
} from "lucide-react";
import { adminService } from "@/lib/api/services/admin-service";
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
import { Textarea } from "@/components/ui/textarea";

// Define Database type
interface DatabaseConfig {
  id: number;
  db_name: string;
  db_url?: string;
  business_rule?: string;
  created_at?: string;
  updated_at?: string;
}

export default function DatabaseManagementPage() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [databases, setDatabases] = useState<DatabaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create/Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDb, setCurrentDb] = useState<Partial<DatabaseConfig>>({});
  const [dbFile, setDbFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dbToDelete, setDbToDelete] = useState<DatabaseConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchDatabases();
    }
  }, [isInitialized, tokens, router]);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllDatabases();
      if (response.success && Array.isArray(response.data)) {
        setDatabases(response.data);
      } else {
        setDatabases([]);
      }
    } catch (error) {
      console.error("Failed to fetch databases:", error);
      toast.error("Failed to load databases");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentDb.db_name) {
      toast.error("Database name is required");
      return;
    }

    try {
      setSubmitting(true);
      
      const config = {
        db_name: currentDb.db_name,
        db_url: currentDb.db_url,
        business_rule: currentDb.business_rule,
        file: dbFile || undefined
      };

      let response;
      if (isEditMode && currentDb.id) {
        response = await adminService.updateDatabase(currentDb.id, config);
      } else {
        response = await adminService.createDatabase(config as any);
      }
      
      if (response.success) {
        toast.success(isEditMode ? "Database updated successfully" : "Database created successfully");
        setIsDialogOpen(false);
        resetForm();
        fetchDatabases();
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
    if (!dbToDelete) return;

    try {
      setDeleting(true);
      const response = await adminService.deleteDatabase(dbToDelete.id);
      
      if (response.success) {
        toast.success("Database deleted successfully");
        setIsDeleteDialogOpen(false);
        setDbToDelete(null);
        fetchDatabases();
      } else {
        toast.error(response.error || "Failed to delete database");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete database");
    } finally {
      setDeleting(false);
    }
  };

  const handleLearnSync = async (dbId: number) => {
    try {
      toast.info("Triggering Learn Sync...");
      const response = await adminService.triggerDatabaseLearnSync(dbId);
      if (response.success) {
        toast.success("Learn Sync triggered successfully");
      } else {
        toast.error(response.error || "Failed to trigger Learn Sync");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger Learn Sync");
    }
  };

  const resetForm = () => {
    setCurrentDb({});
    setDbFile(null);
    setIsEditMode(false);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (db: DatabaseConfig) => {
    setCurrentDb(db);
    setDbFile(null);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const filteredDatabases = databases.filter(db => 
    db.db_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: ColumnDef<DatabaseConfig>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="text-gray-400">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "db_name",
      header: "Database Name",
      cell: ({ row }) => <div className="font-medium text-white">{row.getValue("db_name")}</div>,
    },
    {
      accessorKey: "db_url",
      header: "Connection URL",
      cell: ({ row }) => {
        const url = row.getValue("db_url") as string;
        return <div className="text-gray-400 truncate max-w-[200px]" title={url}>{url || '-'}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div className="text-gray-400">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const db = row.original;
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
                onClick={() => handleLearnSync(db.id)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                <Play className="mr-2 h-4 w-4" />
                Trigger Learn Sync
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openEditDialog(db)}
                className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Configuration
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => {
                  setDbToDelete(db);
                  setIsDeleteDialogOpen(true);
                }}
                className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Database
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
        title="Database Management" 
        description="Configure MSSQL databases and learning"
        icon={<Database className="w-6 h-6 text-emerald-400" />}
        actions={
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Database
          </Button>
        }
      />

      <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search databases..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchDatabases} className="ml-2 border-white/10 text-gray-400 hover:text-white hover:bg-white/5">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredDatabases} 
          loading={loading}
        />
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Database" : "Add New Database"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure connection details for the MSSQL database.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dbName">Database Name *</Label>
              <Input
                id="dbName"
                value={currentDb.db_name || ""}
                onChange={(e) => setCurrentDb({ ...currentDb, db_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g. SalesDB"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dbUrl">Connection URL</Label>
              <Input
                id="dbUrl"
                value={currentDb.db_url || ""}
                onChange={(e) => setCurrentDb({ ...currentDb, db_url: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="mssql://user:pass@host:port/db"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="businessRule">Business Rules</Label>
              <Textarea
                id="businessRule"
                value={currentDb.business_rule || ""}
                onChange={(e) => setCurrentDb({ ...currentDb, business_rule: e.target.value })}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder="Describe business rules or context for this database..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dbFile">Configuration File (Optional)</Label>
              <Input
                id="dbFile"
                type="file"
                onChange={(e) => setDbFile(e.target.files?.[0] || null)}
                className="bg-white/5 border-white/10 text-white cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? "Saving..." : (isEditMode ? "Update Database" : "Create Database")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#0f172a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Database</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete <strong>{dbToDelete?.db_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? "Deleting..." : "Delete Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
