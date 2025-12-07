"use client";

import React, { useEffect, useState } from "react";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cpu, Plus, UserPlus } from "lucide-react";
import { vectorDBService, VectorDBConfig, UserConfig } from "@/lib/api/services/vector-db-service";
import { adminService } from "@/lib/api/services/admin-service";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  CreateUserConfigModal,
  VectorDBConfigFormModal,
  VectorDBConfigFormData,
  VectorDBTabs,
  SearchBar,
  VectorDBConfigsTable,
  UserConfigurationsTable,
} from "@/components/vector-db";

export default function VectorDBManagementPage() {
  const router = useRouter();
  const { tokens, isInitialized } = useAuthContext();
  const [configs, setConfigs] = useState<VectorDBConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create/Edit State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<VectorDBConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<VectorDBConfig | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Users state (for Create User Config)
  const [users, setUsers] = useState<Array<{ user_id: string; username?: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create User Config State (in User Configurations tab)
  const [isCreateUserConfigDialogOpen, setIsCreateUserConfigDialogOpen] = useState(false);
  const [creatingUserConfig, setCreatingUserConfig] = useState(false);

  // User Configurations State
  const [activeTab, setActiveTab] = useState<"configs" | "user-configs">("configs");
  const [userConfigs, setUserConfigs] = useState<UserConfig[]>([]);
  const [loadingUserConfigs, setLoadingUserConfigs] = useState(false);
  const [userConfigSearchQuery, setUserConfigSearchQuery] = useState("");

  useEffect(() => {
    if (isInitialized && !tokens?.isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      router.push("/");
      return;
    }

    if (isInitialized && tokens?.isAdmin) {
      fetchConfigs();
      if (activeTab === "user-configs") {
        fetchUserConfigs();
      }
    }
  }, [isInitialized, tokens, router]);

  useEffect(() => {
    if (activeTab === "user-configs" && isInitialized && tokens?.isAdmin) {
      fetchUserConfigs();
    }
  }, [activeTab, isInitialized, tokens]);

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


  const handleSubmit = async (data: VectorDBConfigFormData) => {
    try {
      setSubmitting(true);

      let response;
      if (isEditMode && selectedConfig) {
        response = await vectorDBService.updateVectorDBConfig(selectedConfig.db_id, data);
      } else {
        response = await vectorDBService.createVectorDBConfig(data);
      }

      if (response.success) {
        toast.success(
          isEditMode
            ? "Vector DB config updated successfully"
            : "Vector DB config created successfully"
        );
        setIsDialogOpen(false);
        resetForm();
        // Refresh table immediately
        await fetchConfigs();
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
        // Optimistically remove from table immediately
        if (configToDelete) {
          setConfigs(prevConfigs => prevConfigs.filter(c => c.db_id !== configToDelete.db_id));
        }
        setConfigToDelete(null);
        // Refresh to ensure consistency
        await fetchConfigs();
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
    setIsEditMode(false);
    setSelectedConfig(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (config: VectorDBConfig) => {
    setIsEditMode(true);
    setSelectedConfig(config);
    setIsDialogOpen(true);
  };

  const getFormInitialData = (): Partial<VectorDBConfigFormData> | undefined => {
    if (isEditMode && selectedConfig) {
      return {
        DB_HOST: selectedConfig.db_config?.DB_HOST || "",
        DB_PORT: selectedConfig.db_config?.DB_PORT || 5432,
        DB_NAME: selectedConfig.db_config?.DB_NAME || "",
        DB_USER: selectedConfig.db_config?.DB_USER || "",
        DB_PASSWORD: "", // Don't pre-fill password
        schema: selectedConfig.db_config?.schema || "",
      };
    }
    return undefined;
  };

  const openCreateUserConfigDialog = async () => {
    setIsCreateUserConfigDialogOpen(true);
    // Fetch users if not already loaded
    if (users.length === 0) {
      await fetchUsers();
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await adminService.getAllUsers();
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };


  const fetchUserConfigs = async () => {
    try {
      setLoadingUserConfigs(true);
      const response = await vectorDBService.getAllUserConfigs();
      if (response.success && response.data) {
        setUserConfigs(response.data.configs || []);
      } else {
        setUserConfigs([]);
      }
    } catch (error) {
      console.error("Failed to fetch user configs:", error);
      toast.error("Failed to load user configurations");
    } finally {
      setLoadingUserConfigs(false);
    }
  };


  const handleCreateUserConfig = async (data: {
    user_id: string;
    db_id: number;
    access_level: number;
    table_names: string[];
  }) => {
    try {
      setCreatingUserConfig(true);
      const response = await vectorDBService.createUserConfig({
        user_id: data.user_id,
        db_id: data.db_id,
        access_level: data.access_level,
        accessible_tables: [],
        table_names: data.table_names,
      });

      if (response.success) {
        toast.success("User configuration created successfully");
        setIsCreateUserConfigDialogOpen(false);
        // Refresh user configs immediately
        await fetchUserConfigs();
      } else {
        toast.error(response.error || "Failed to create user configuration");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create user configuration");
    } finally {
      setCreatingUserConfig(false);
    }
  };

  const filteredConfigs = configs.filter(
    (config) =>
      config.db_config?.DB_NAME?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.db_id.toString().includes(searchQuery)
  );

  const filteredUserConfigs = userConfigs.filter(
    (config) =>
      config.user_id?.toLowerCase().includes(userConfigSearchQuery.toLowerCase()) ||
      config.db_config?.DB_NAME?.toLowerCase().includes(userConfigSearchQuery.toLowerCase()) ||
      config.config_id.toString().includes(userConfigSearchQuery) ||
      config.db_id.toString().includes(userConfigSearchQuery)
  );

  return (
    <PageLayout background={["frame", "gridframe"]} maxWidth="7xl" className="min-h-screen py-6">
      <PageHeader 
        title="Vector DB Management" 
        description="Manage vector database configurations and user access. Organize documents using folders."
        icon={<Cpu className="w-6 h-6 text-emerald-400" />}
        actions={
          activeTab === "configs" ? (
            <Button onClick={openCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
              <Plus className="w-4 h-4 mr-2" />
              Add Vector DB
            </Button>
          ) : (
            <Button onClick={openCreateUserConfigDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User Config
            </Button>
          )
        }
      />

      <VectorDBTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "configs" && (
        <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
          <SearchBar
            placeholder="Search configs..."
            value={searchQuery}
            onChange={setSearchQuery}
            onRefresh={fetchConfigs}
          />

          <VectorDBConfigsTable
            configs={filteredConfigs}
            loading={loading}
            onEdit={openEditDialog}
            onDelete={(config) => {
              setConfigToDelete(config);
              setIsDeleteDialogOpen(true);
            }}
          />
        </Card>
      )}

      {activeTab === "user-configs" && (
        <Card className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
          <SearchBar
            placeholder="Search user configs..."
            value={userConfigSearchQuery}
            onChange={setUserConfigSearchQuery}
            onRefresh={fetchUserConfigs}
          />

          <UserConfigurationsTable
            configs={filteredUserConfigs}
            loading={loadingUserConfigs}
          />
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <VectorDBConfigFormModal
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditMode={isEditMode}
        initialData={getFormInitialData()}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />

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

      {/* Create User Config Dialog */}
      <CreateUserConfigModal
        open={isCreateUserConfigDialogOpen}
        onOpenChange={setIsCreateUserConfigDialogOpen}
        users={users}
        configs={configs}
        loadingUsers={loadingUsers}
        onSubmit={handleCreateUserConfig}
        isSubmitting={creatingUserConfig}
      />
    </PageLayout>
  );
}
