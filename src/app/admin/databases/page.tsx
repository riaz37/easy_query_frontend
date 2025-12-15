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
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  XIcon,
  ArrowLeft
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
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

// Define Database type - matches API response structure
interface DatabaseConfig {
  db_id: number;
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

  // Sync Progress State
  const [isSyncProgressOpen, setIsSyncProgressOpen] = useState(false);
  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'pending' | 'running' | 'success' | 'failed'>('pending');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncDbName, setSyncDbName] = useState<string>("");
  const [syncStep, setSyncStep] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

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
      // The API returns data in response.data.configs array
      if (response.success && response.data?.configs && Array.isArray(response.data.configs)) {
        setDatabases(response.data.configs);
      } else if (response.success && Array.isArray(response.data)) {
        // Fallback: if configs doesn't exist, try direct array
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
      if (isEditMode && currentDb.db_id) {
        response = await adminService.updateDatabase(currentDb.db_id, config);

        if (response.success) {
          toast.success("Database updated successfully");
          setIsDialogOpen(false);
          resetForm();
          fetchDatabases();
        } else {
          toast.error(response.error || "Operation failed");
        }
      } else {
        // Creating new database
        response = await adminService.createDatabase(config as any);

        if (response.success) {
          toast.success("Database created successfully");
          setIsDialogOpen(false);
          resetForm();

          // Get db_id from response to trigger learn sync
          const dbId = response.data?.db_id || response.data?.data?.db_id || response.data?.id;

          if (dbId && typeof dbId === 'number') {
            // Set up sync progress dialog
            setSyncDbName(config.db_name);
            setSyncTaskId(null);
            setSyncProgress(0);
            setSyncStatus('pending');
            setSyncError(null);
            setSyncStep(null);
            setSyncMessage(null);
            setIsSyncProgressOpen(true);

            // Trigger learn sync and show progress
            try {
              const syncResponse = await adminService.triggerDatabaseLearnSync(dbId);

              if (syncResponse.success && syncResponse.data?.task_id) {
                setSyncTaskId(syncResponse.data.task_id);
                setSyncStatus('running');
                // Polling will start automatically via useEffect
              } else {
                setSyncStatus('failed');
                setSyncError(syncResponse.error || "Failed to trigger Learn Sync");
                toast.error(syncResponse.error || "Failed to trigger Learn Sync");
              }
            } catch (syncError: any) {
              setSyncStatus('failed');
              setSyncError(syncError.message || "Failed to trigger Learn Sync");
              toast.error(syncError.message || "Failed to trigger Learn Sync");
            }
          } else {
            // If no db_id, just refresh the list
            fetchDatabases();
          }
        } else {
          toast.error(response.error || "Operation failed");
        }
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
      const response = await adminService.deleteDatabase(dbToDelete.db_id);

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
      const db = databases.find(d => d.db_id === dbId);
      setSyncDbName(db?.db_name || `Database #${dbId}`);
      setSyncTaskId(null);
      setSyncProgress(0);
      setSyncStatus('pending');
      setSyncError(null);
      setSyncStep(null);
      setSyncMessage(null);
      setIsSyncProgressOpen(true);

      toast.info("Triggering Learn Sync...");
      const response = await adminService.triggerDatabaseLearnSync(dbId);

      if (response.success && response.data?.task_id) {
        setSyncTaskId(response.data.task_id);
        setSyncStatus('running');
        // Start polling for progress
        // Polling will start automatically via useEffect due to syncTaskId change
      } else {
        setSyncStatus('failed');
        setSyncError(response.error || "Failed to trigger Learn Sync");
        toast.error(response.error || "Failed to trigger Learn Sync");
      }
    } catch (error: any) {
      setSyncStatus('failed');
      setSyncError(error.message || "Failed to trigger Learn Sync");
      toast.error(error.message || "Failed to trigger Learn Sync");
    }
  };

  // Poll sync progress when taskId is set
  useEffect(() => {
    if (!syncTaskId || syncStatus === 'success' || syncStatus === 'failed') return;

    const pollInterval = 2000; // Poll every 2 seconds
    let pollTimer: NodeJS.Timeout;
    let isCancelled = false;

    const poll = async () => {
      if (isCancelled) return;

      try {
        const response = await adminService.getDbQueryUpdateTaskStatus(syncTaskId);

        if (isCancelled) return;

        if (response.success && response.data) {
          const taskData = response.data;
          const status = taskData.status === 'completed' ? 'success' :
            taskData.status === 'failed' ? 'failed' :
              taskData.status === 'running' ? 'running' : 'pending';

          setSyncStatus(status);

          // Extract progress percentage - API uses progress_percentage
          const progressValue = taskData.progress_percentage ||
            taskData.progress ||
            taskData.percentage ||
            0;
          setSyncProgress(typeof progressValue === 'number' ? progressValue : parseFloat(progressValue) || 0);

          // Extract step information - API provides step_name, current_step, and total_steps
          let stepInfo = null;
          if (taskData.step_name) {
            // Format: "Step X/Y: Step Name" or just "Step Name"
            if (taskData.current_step && taskData.total_steps) {
              stepInfo = `Step ${taskData.current_step}/${taskData.total_steps}: ${taskData.step_name}`;
            } else {
              stepInfo = taskData.step_name;
            }
          } else if (taskData.current_step && taskData.total_steps) {
            stepInfo = `Step ${taskData.current_step}/${taskData.total_steps}`;
          } else if (taskData.message) {
            // Fallback to message if no step_name
            stepInfo = taskData.message;
          }

          setSyncStep(stepInfo);
          setSyncMessage(taskData.message || null);

          if (status === 'success') {
            toast.success("Learn Sync completed successfully");
            // Close dialog after 2 seconds
            setTimeout(() => {
              setIsSyncProgressOpen(false);
              fetchDatabases(); // Refresh database list
            }, 2000);
            return;
          } else if (status === 'failed') {
            setSyncError(taskData.error || taskData.error_message || "Sync failed");
            toast.error(taskData.error || taskData.error_message || "Learn Sync failed");
            return;
          }

          // Continue polling if still pending or running
          if (status === 'pending' || status === 'running') {
            pollTimer = setTimeout(poll, pollInterval);
          }
        }
      } catch (error: any) {
        if (isCancelled) return;
        console.error('Error polling sync progress:', error);
        setSyncStatus('failed');
        setSyncError(error.message || "Failed to check sync status");
        toast.error("Failed to check sync status");
      }
    };

    // Start polling
    poll();

    // Cleanup function
    return () => {
      isCancelled = true;
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [syncTaskId, syncStatus]);

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
      accessorKey: "db_id",
      header: "ID",
      cell: ({ row }) => <div className="text-gray-400 font-public-sans">#{row.getValue("db_id")}</div>,
    },
    {
      accessorKey: "db_name",
      header: "Database Name",
      cell: ({ row }) => <div className="font-medium text-white font-barlow">{row.getValue("db_name")}</div>,
    },
    {
      accessorKey: "db_url",
      header: "Connection URL",
      cell: ({ row }) => {
        const url = row.getValue("db_url") as string;
        return <div className="text-gray-400 truncate max-w-[200px] font-public-sans" title={url}>{url || '-'}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return <div className="text-gray-400 font-public-sans">{date ? new Date(date).toLocaleDateString() : '-'}</div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const db = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 data-[state=open]:bg-white/10 data-[state=open]:text-white hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-[#0F1219]/95 backdrop-blur-xl border-white/10 text-white shadow-2xl z-50"
            >
              <DropdownMenuLabel className="font-barlow text-gray-400 text-xs font-normal uppercase tracking-wider">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleLearnSync(db.db_id)}
                className="cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-400 my-1 py-2.5 font-public-sans transition-colors"
              >
                <Play className="mr-2 h-4 w-4" />
                Trigger Learn Sync
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openEditDialog(db)}
                className="cursor-pointer focus:bg-white/10 focus:text-white my-1 py-2.5 font-public-sans transition-colors"
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
                className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 my-1 py-2.5 font-public-sans transition-colors"
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
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin")}
          className="text-white hover:text-green-400 hover:bg-white/5"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin Dashboard
        </Button>
      </div>
      <PageHeader
        title="Database Management"
        description="Configure MSSQL databases and learning"
        icon={<Database className="w-6 h-6 text-emerald-400" />}
        actions={
          <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
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
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
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
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      {isEditMode ? "Edit Database" : "Add New Database"}
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Configure connection details for the MSSQL database.
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
                      value={currentDb.db_name || ""}
                      onChange={(e) => setCurrentDb({ ...currentDb, db_name: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="e.g. SalesDB"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbUrl" className="text-white font-public-sans">Connection URL</Label>
                    <Input
                      id="dbUrl"
                      value={currentDb.db_url || ""}
                      onChange={(e) => setCurrentDb({ ...currentDb, db_url: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                      placeholder="mssql://user:pass@host:port/db"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="businessRule" className="text-white font-public-sans">Business Rules</Label>
                    <Textarea
                      id="businessRule"
                      value={currentDb.business_rule || ""}
                      onChange={(e) => setCurrentDb({ ...currentDb, business_rule: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans min-h-[100px]"
                      placeholder="Describe business rules or context for this database..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dbFile" className="text-white font-public-sans">Configuration File (Optional)</Label>
                    <Input
                      id="dbFile"
                      type="file"
                      onChange={(e) => setDbFile(e.target.files?.[0] || null)}
                      className="bg-white/5 border-white/10 text-white cursor-pointer font-public-sans"
                    />
                  </div>
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5 font-barlow">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
                    {submitting ? "Saving..." : (isEditMode ? "Update Database" : "Create Database")}
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
        title="Delete Database"
        message={`Are you sure you want to delete ${dbToDelete?.db_name}? This action cannot be undone.`}
        confirmText="Delete Database"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleting}
      />

      {/* Sync Progress Dialog */}
      <Dialog open={isSyncProgressOpen} onOpenChange={setIsSyncProgressOpen}>
        <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
          <div className="modal-enhanced">
            <div className="modal-content-enhanced">
              <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                      Learn Sync Progress
                    </DialogTitle>
                    <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                      Syncing database: <strong className="text-white">{syncDbName}</strong>
                    </p>
                  </div>
                  <button onClick={() => setIsSyncProgressOpen(false)} className="modal-close-button cursor-pointer flex-shrink-0 ml-2">
                    <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </DialogHeader>
              <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
                <div className="space-y-4 py-4">
                  {/* Status Icon and Text */}
                  <div className="flex items-center gap-3">
                    {syncStatus === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                    {syncStatus === 'running' && <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />}
                    {syncStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {syncStatus === 'failed' && <XCircle className="w-5 h-5 text-red-400" />}
                    <span className={`font-medium font-public-sans ${syncStatus === 'pending' ? 'text-gray-400' :
                      syncStatus === 'running' ? 'text-emerald-400' :
                        syncStatus === 'success' ? 'text-emerald-400' :
                          'text-red-400'
                      }`}>
                      {syncStatus === 'pending' && 'Queued'}
                      {syncStatus === 'running' && 'Processing...'}
                      {syncStatus === 'success' && 'Completed'}
                      {syncStatus === 'failed' && 'Failed'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400 font-public-sans">
                      <span>Progress</span>
                      <span>{Math.round(syncProgress)}%</span>
                    </div>
                    <Progress value={syncProgress} className="h-2" />
                  </div>

                  {/* Current Step */}
                  {syncStep && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-white font-medium font-public-sans mb-1">Current Step:</p>
                      <p className="text-sm text-gray-300 font-public-sans">{syncStep}</p>
                    </div>
                  )}

                  {/* Status Message - Show if different from step */}
                  {syncMessage && syncMessage !== syncStep && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-gray-300 font-public-sans">{syncMessage}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {syncError && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400 font-public-sans">{syncError}</p>
                    </div>
                  )}

                  {/* Task ID (for debugging) */}
                  {syncTaskId && (
                    <div className="text-xs text-gray-500 font-public-sans">
                      Task ID: {syncTaskId}
                    </div>
                  )}
                </div>
                <DialogFooter className="px-0 pb-0 pt-4">
                  {syncStatus === 'success' || syncStatus === 'failed' ? (
                    <Button
                      onClick={() => setIsSyncProgressOpen(false)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow"
                    >
                      Close
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsSyncProgressOpen(false)}
                      className="border-white/10 text-white hover:bg-white/5 font-barlow"
                      disabled={syncStatus === 'running'}
                    >
                      {syncStatus === 'running' ? 'Sync in progress...' : 'Close'}
                    </Button>
                  )}
                </DialogFooter>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
