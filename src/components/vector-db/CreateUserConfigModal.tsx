"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";
import { TableNamesInput } from "./TableNamesInput";
import { VectorDBConfig } from "@/lib/api/services/vector-db-service";

interface CreateUserConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: Array<{ user_id: string; username?: string }>;
  configs: VectorDBConfig[];
  loadingUsers?: boolean;
  onSubmit: (data: {
    user_id: string;
    db_id: number;
    access_level: number;
    table_names: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateUserConfigModal({
  open,
  onOpenChange,
  users,
  configs,
  loadingUsers = false,
  onSubmit,
  isSubmitting = false,
}: CreateUserConfigModalProps) {
  const [userId, setUserId] = useState<string>("");
  const [dbId, setDbId] = useState<number | null>(null);
  const [accessLevel, setAccessLevel] = useState<number>(1);
  const [tableNames, setTableNames] = useState<string[]>([]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setUserId("");
      setDbId(null);
      setAccessLevel(1);
      setTableNames([]);
    }
  }, [open]);

  const handleAddTableName = (tableName: string) => {
    if (!tableNames.includes(tableName)) {
      setTableNames([...tableNames, tableName]);
    }
  };

  const handleRemoveTableName = (tableName: string) => {
    setTableNames(tableNames.filter((t) => t !== tableName));
  };

  const handleSubmit = async () => {
    if (!userId || !dbId) {
      return;
    }

    await onSubmit({
      user_id: userId,
      db_id: dbId,
      access_level: accessLevel,
      table_names: tableNames,
    });
  };

  const isValid = userId && dbId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                    Create User Configuration
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                    Assign a vector database configuration to a user with access level and folders.
                  </p>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="modal-close-button cursor-pointer flex-shrink-0 ml-2"
                >
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </DialogHeader>
            <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="createUserId" className="text-white font-public-sans">
                    User *
                  </Label>
                  <Select
                    value={userId}
                    onValueChange={setUserId}
                    disabled={loadingUsers}
                  >
                    <SelectTrigger
                      id="createUserId"
                      className="bg-white/5 border-white/10 text-white font-public-sans"
                    >
                      <SelectValue
                        placeholder={loadingUsers ? "Loading users..." : "Select a user"}
                      />
                    </SelectTrigger>
                    <SelectContent className="modal-select-content-enhanced">
                      {users.map((user) => (
                        <SelectItem
                          key={user.user_id}
                          value={user.user_id}
                          className="dropdown-item text-white"
                        >
                          {user.username || user.user_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="createDbId" className="text-white font-public-sans">
                    Database *
                  </Label>
                  <Select
                    value={dbId?.toString() || ""}
                    onValueChange={(value) => setDbId(parseInt(value) || null)}
                  >
                    <SelectTrigger
                      id="createDbId"
                      className="bg-white/5 border-white/10 text-white font-public-sans"
                    >
                      <SelectValue placeholder="Select a database" />
                    </SelectTrigger>
                    <SelectContent className="modal-select-content-enhanced">
                      {configs.map((config) => (
                        <SelectItem
                          key={config.db_id}
                          value={config.db_id.toString()}
                          className="dropdown-item text-white"
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {config.db_config?.DB_NAME || `DB #${config.db_id}`}
                            </span>
                            <span className="text-xs text-gray-400">(ID: {config.db_id})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="createAccessLevel" className="text-white font-public-sans">
                    Access Level *
                  </Label>
                  <Input
                    id="createAccessLevel"
                    type="number"
                    min="0"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-400 font-public-sans">
                    Access level for the user (0 = read-only, 1+ = higher access)
                  </p>
                </div>

                <TableNamesInput
                  tableNames={tableNames}
                  onAdd={handleAddTableName}
                  onRemove={handleRemoveTableName}
                  placeholder="Enter folder name"
                  description="Add folders accessible to this user. You can add more later."
                />
              </div>
              <DialogFooter className="px-0 pb-0 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-white/10 text-white hover:bg-white/5 font-barlow"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isValid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow"
                >
                  {isSubmitting ? "Creating..." : "Create Configuration"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

