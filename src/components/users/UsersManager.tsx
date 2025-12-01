"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs";
import { PageLoader, UsersPageSkeleton } from "@/components/ui/loading";
import { useUsersManager } from "./hooks/useUsersManager";
import { useUserAccess } from "@/lib/hooks/use-user-access";
import { CreateDatabaseAccessModal } from "./modals/CreateDatabaseAccessModal";
import { CreateVectorDBAccessModal } from "./modals/CreateVectorDBAccessModal";
import { useTheme } from "@/store/theme-store";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  UsersManagerHeader,
  UsersTableSection,
  UserSearchInput,
  UserStatsCards,
  UserAccessTabs,
  MSSQLUsersList,
  VectorDBUsersList,
} from "./components";
import { UserStats } from "./types";

export function UsersManager() {
  // Theme
  const theme = useTheme();
  const isDark = theme === "dark";
  
  // User access hook for delete functionality
  const { deleteUserAccess } = useUserAccess();

  // Local state for modals
  const [activeTab, setActiveTab] = useState("mssql");
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isVectorDBModalOpen, setIsVectorDBModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [editingUser, setEditingUser] = useState<string>("");
  
  // Confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string>("");
  const [deleteType, setDeleteType] = useState<"mssql" | "vector">("mssql");
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    userAccessConfigs,
    userConfigs,
    userConfigLoading,
    loadUserAccessConfigs,
    loadUserConfigs,
    extractNameFromEmail,
    availableDatabases,
    deleteUserConfig,
  } = useUsersManager();

  // Load data on component mount
  useEffect(() => {
    loadUserAccessConfigs();
    loadUserConfigs();
  }, [loadUserAccessConfigs, loadUserConfigs]);

  // Filtered data based on search term
  const filteredUserAccess = useMemo(() => {
    if (!userAccessConfigs || !Array.isArray(userAccessConfigs)) return [];
    if (!searchTerm.trim()) return userAccessConfigs;

    return userAccessConfigs.filter(
      (config) =>
        config &&
        config.user_id &&
        (config.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          extractNameFromEmail(config.user_id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
  }, [userAccessConfigs, searchTerm, extractNameFromEmail]);

  // Filter users by access type
  const mssqlUsers = useMemo(() => {
    return filteredUserAccess.filter(
      (config) =>
        config.database_access?.parent_databases?.length > 0 ||
        config.database_access?.sub_databases?.some(
          (sub: any) => sub.databases?.length > 0
        )
    );
  }, [filteredUserAccess]);

  const vectorDBUsers = useMemo(() => {
    return userConfigs.filter(
      (config) =>
        config.db_id && config.table_names && config.table_names.length > 0
    );
  }, [userConfigs]);

  // Calculate stats
  const stats: UserStats = useMemo(
    () => ({
      totalUsers: filteredUserAccess.length,
      mssqlUsers: mssqlUsers.length,
      vectorDBUsers: vectorDBUsers.length,
      fullAccessUsers: filteredUserAccess.filter(
        (config) =>
          (config.database_access?.parent_databases?.length > 0 ||
            config.database_access?.sub_databases?.some(
              (sub: any) => sub.databases?.length > 0
            )) &&
          config.access_level >= 2
      ).length,
    }),
    [filteredUserAccess, mssqlUsers, vectorDBUsers]
  );

  // Handle modal operations
  const handleCreateMSSQLAccess = () => {
    setSelectedUser("");
    setEditingUser("");
    setIsDatabaseModalOpen(true);
  };

  const handleCreateVectorDBAccess = () => {
    setSelectedUser("");
    setEditingUser("");
    setIsVectorDBModalOpen(true);
  };

  const handleEditUser = (userId: string, type: "mssql" | "vector") => {
    setSelectedUser(userId);
    setEditingUser(userId);
    if (type === "mssql") {
      setIsDatabaseModalOpen(true);
    } else {
      setIsVectorDBModalOpen(true);
    }
  };

  const handleDeleteUser = (userId: string, type: "mssql" | "vector" = "mssql") => {
    setUserToDelete(userId);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      let success = false;
      
      if (deleteType === "mssql") {
        success = await deleteUserAccess(userToDelete);
        if (success) {
          toast.success(`Successfully deleted MSSQL access for ${userToDelete}`);
          loadUserAccessConfigs();
        }
      } else {
        success = await deleteUserConfig(userToDelete);
        if (success) {
          toast.success(`Successfully deleted Vector DB access for ${userToDelete}`);
          loadUserConfigs();
        }
      }
      
      if (success) {
        setIsDeleteDialogOpen(false);
        setUserToDelete("");
        setDeleteType("mssql");
      } else {
        toast.error(`Failed to delete ${deleteType} access for ${userToDelete}`);
      }
    } catch (error) {
      console.error(`Delete ${deleteType} access error:`, error);
      toast.error(`Failed to delete ${deleteType} access for ${userToDelete}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete("");
    setDeleteType("mssql");
    setIsDeleting(false);
  };

  const handleModalSuccess = () => {
    loadUserAccessConfigs();
    loadUserConfigs();
    setIsDatabaseModalOpen(false);
    setIsVectorDBModalOpen(false);
    setSelectedUser("");
    setEditingUser("");
  };

  const handleModalClose = () => {
    setIsDatabaseModalOpen(false);
    setIsVectorDBModalOpen(false);
    setSelectedUser("");
    setEditingUser("");
  };

  // Helper functions
  const getDatabaseName = (dbId: number) => {
    const database = availableDatabases?.find((db) => db.db_id === dbId);
    return database ? database.db_name : `DB ${dbId}`;
  };

  const formatTableNames = (tableNames: string[]) => {
    if (!tableNames || tableNames.length === 0) return "No tables";
    if (tableNames.length <= 3) return tableNames.join(", ");
    return `${tableNames.slice(0, 3).join(", ")} +${
      tableNames.length - 3
    } more`;
  };

  const getAccessLevelBadge = (config: any) => {
    const hasMSSQL =
      config.database_access?.parent_databases?.length > 0 ||
      config.database_access?.sub_databases?.some(
        (sub: any) => sub.databases?.length > 0
      );
    const hasVectorDB = config.access_level >= 2;

    if (hasMSSQL && hasVectorDB) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-400/30 shadow-lg shadow-emerald-500/25">
          Full Access
        </Badge>
      );
    } else if (hasMSSQL) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-400/30 shadow-lg shadow-emerald-500/25">
          MSSQL Access
        </Badge>
      );
    } else if (hasVectorDB) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-emerald-400/30 shadow-lg shadow-emerald-500/25">
          Vector DB Access
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-gray-400/30">
          No Access
        </Badge>
      );
    }
  };

  const getDatabaseCount = (config: any) => {
    const parentCount = config.database_access?.parent_databases?.length || 0;
    const subCount =
      config.database_access?.sub_databases?.reduce(
        (total: number, sub: any) => total + (sub.databases?.length || 0),
        0
      ) || 0;
    return parentCount + subCount;
  };

  if (userConfigLoading || !activeTab) {
    return (
      <UsersPageSkeleton
        size="lg"
        activeTab={activeTab}
        showTabs={true}
        showSearch={true}
        showActions={true}
        showPagination={true}
        rowCount={5}
      />
    );
  }

  return (
    <div>
      {/* Combined Table Section with Header and Data Table */}
      {activeTab === "mssql" ? (
        <UsersTableSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateMSSQLAccess={handleCreateMSSQLAccess}
          onCreateVectorDBAccess={handleCreateVectorDBAccess}
          isDark={isDark}
          users={mssqlUsers}
          onEditUser={(userId) => handleEditUser(userId, "mssql")}
          onDeleteUser={handleDeleteUser}
          extractNameFromEmail={extractNameFromEmail}
          getAccessLevelBadge={getAccessLevelBadge}
          getDatabaseCount={getDatabaseCount}
          type="mssql"
          isLoading={userConfigLoading}
        />
      ) : (
        <UsersTableSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreateMSSQLAccess={handleCreateMSSQLAccess}
          onCreateVectorDBAccess={handleCreateVectorDBAccess}
          isDark={isDark}
          users={vectorDBUsers}
          onEditUser={(userId) => handleEditUser(userId, "vector")}
          onDeleteUser={(userId) => handleDeleteUser(userId, "vector")}
          extractNameFromEmail={extractNameFromEmail}
          getAccessLevelBadge={getAccessLevelBadge}
          getDatabaseName={getDatabaseName}
          formatTableNames={formatTableNames}
          type="vector"
          isLoading={userConfigLoading}
        />
      )}

      {/* Modals */}
      <CreateDatabaseAccessModal
        isOpen={isDatabaseModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        selectedUser={selectedUser}
        editingUser={editingUser}
      />

      <CreateVectorDBAccessModal
        isOpen={isVectorDBModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        selectedUser={selectedUser}
        editingUser={editingUser}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType === "mssql" ? "MSSQL" : "Vector DB"} Access`}
        message={`Are you sure you want to delete ${deleteType === "mssql" ? "MSSQL database" : "Vector database"} access for ${userToDelete}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
}
