"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Database, CheckCircle, AlertCircle, X } from "lucide-react";
import { useUserAccess } from "@/lib/hooks/use-user-access";
import { useDatabaseContext } from "@/components/providers/DatabaseContextProvider";
import { useAuthContext } from "@/components/providers/AuthContextProvider";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import { ServiceRegistry } from "@/lib/api";
import { toast } from "sonner";

interface CreateDatabaseAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedUser?: string;
  editingUser?: string;
}

export function CreateDatabaseAccessModal({
  isOpen,
  onClose,
  onSuccess,
  selectedUser = "",
  editingUser = "",
}: CreateDatabaseAccessModalProps) {
  const { user } = useAuthContext();
  const theme = useTheme();

  // Form state
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedDatabases, setSelectedDatabases] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Hooks
  const { availableDatabases } = useDatabaseContext();

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      resetForm();
    }
  }, [isOpen]);

  // Update userId when selectedUser or editingUser prop changes
  useEffect(() => {
    if (editingUser) {
      setSelectedUserId(editingUser);
      // Load existing access for editing user
      loadUserAccess(editingUser);
    } else if (selectedUser) {
      setSelectedUserId(selectedUser);
    } else if (user?.user_id) {
      setSelectedUserId(user.user_id);
    }
  }, [selectedUser, editingUser, user?.user_id]);

  const loadUserAccess = async (userId: string) => {
    try {
      setLoading(true);
      const response = await ServiceRegistry.userAccess.getRBACUserAccess(userId);
      if (response.success && response.data?.db_ids) {
        setSelectedDatabases(response.data.db_ids);
      }
    } catch (error) {
      console.error("Error loading user access:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle database selection (multi-select)
  const handleDatabaseToggle = (dbId: number) => {
    setSelectedDatabases((prev) => {
      if (prev.includes(dbId)) {
        return prev.filter((id) => id !== dbId);
      } else {
        return [...prev, dbId];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedUserId) {
      toast.error("User ID is required");
      return;
    }

    if (selectedDatabases.length === 0) {
      toast.error("Please select at least one database");
      return;
    }

    try {
      setLoading(true);
      
      if (editingUser) {
        // For editing, grant access to selected databases
        const response = await ServiceRegistry.admin.grantAccess(
          selectedUserId,
          selectedDatabases
        );
        
        if (response.success) {
          toast.success("Database access updated successfully");
          onSuccess();
          handleClose();
        } else {
          toast.error("Failed to update database access");
        }
      } else {
        // For creating, grant access to selected databases
        const response = await ServiceRegistry.admin.grantAccess(
          selectedUserId,
          selectedDatabases
        );
        
        if (response.success) {
          toast.success("Database access created successfully");
          onSuccess();
          handleClose();
        } else {
          toast.error("Failed to create database access");
        }
      }
    } catch (error) {
      console.error("Error with user access:", error);
      toast.error(
        `Failed to ${editingUser ? "update" : "create"} database access: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedDatabase("");
    setSelectedUserId("");
    setSelectedDatabases([]);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0 border-0 bg-transparent"
        showCloseButton={false}
      >
        <div className="modal-enhanced">
          <div className="modal-content-enhanced flex flex-col max-h-[90vh]">
            <DialogHeader className="modal-header-enhanced flex-shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="modal-title-enhanced">
                    {editingUser
                      ? "Edit Database Access"
                      : "Create Database Access"}
                  </DialogTitle>
                  <p className="modal-description-enhanced">
                    {editingUser
                      ? "Update user access to MSSQL databases"
                      : "Grant user access to MSSQL databases for data operations"}
                  </p>
                </div>
                <button onClick={handleClose} className="modal-close-button">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="modal-form-content flex-1 overflow-y-auto px-6 pb-6">
              {/* User ID Input */}
              <div className="modal-form-group">
                <Label className="modal-label-enhanced">
                  User ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter user ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="modal-input-enhanced"
                  disabled={!!editingUser} // Disable when editing
                />
                {editingUser && (
                  <div className="modal-form-description">
                    User ID cannot be changed when editing
                  </div>
                )}
              </div>

              {/* Database Selection - Multi-select */}
              <div className="modal-form-group">
                <Label className="modal-label-enhanced">
                  Databases <span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {availableDatabases.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No databases available
                    </div>
                  ) : (
                    availableDatabases.map((db) => (
                      <div
                        key={db.db_id}
                        className="flex items-center space-x-2 p-2 hover:bg-white/5 rounded"
                      >
                        <Checkbox
                          id={`db-${db.db_id}`}
                          checked={selectedDatabases.includes(db.db_id)}
                          onCheckedChange={() => handleDatabaseToggle(db.db_id)}
                        />
                        <Label
                          htmlFor={`db-${db.db_id}`}
                          className="flex-1 cursor-pointer flex items-center gap-2"
                        >
                          <Database className="h-4 w-4 text-blue-400" />
                          <span>{db.db_name || `Database ${db.db_id}`}</span>
                          {db.db_url && (
                            <span className="text-xs text-muted-foreground">
                              ({db.db_url})
                            </span>
                          )}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <div className="modal-form-description">
                  Select one or more databases to grant access to. User will have full access to selected databases.
                </div>
                {selectedDatabases.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedDatabases.map((dbId) => {
                      const db = availableDatabases.find((d) => d.db_id === dbId);
                      return (
                        <div
                          key={dbId}
                          className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm"
                        >
                          <CheckCircle className="h-3 w-3" />
                          {db?.db_name || `DB ${dbId}`}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Fixed Footer */}
            <div className="flex-shrink-0 px-6 py-6">
              <div className="modal-button-group-responsive">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="modal-button-secondary"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    !selectedUserId ||
                    selectedDatabases.length === 0
                  }
                  className="modal-button-primary"
                >
                  {loading
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                    ? "Update Access"
                    : "Create Access"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
