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
import { VectorDBConfig } from "@/lib/api/services/vector-db-service";

interface AssignUserConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: VectorDBConfig | null;
  users: Array<{ user_id: string; username?: string }>;
  tableNames: string[];
  loadingUsers?: boolean;
  loadingTables?: boolean;
  onSubmit: (data: {
    user_id: string;
    db_id: number;
    access_level: number;
    table_names: string[];
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function AssignUserConfigModal({
  open,
  onOpenChange,
  config,
  users,
  tableNames,
  loadingUsers = false,
  loadingTables = false,
  onSubmit,
  isSubmitting = false,
}: AssignUserConfigModalProps) {
  const [userId, setUserId] = useState<string>("");
  const [accessLevel, setAccessLevel] = useState<number>(1);

  // Reset form when dialog closes or config changes
  useEffect(() => {
    if (!open) {
      setUserId("");
      setAccessLevel(1);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!config || !userId) {
      return;
    }

    await onSubmit({
      user_id: userId,
      db_id: config.db_id,
      access_level: accessLevel,
      table_names: tableNames,
    });
  };

  const isValid = userId && config !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0 bg-transparent modal-lg" showCloseButton={false}>
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl flex items-center gap-3 font-barlow">
                    Assign Vector DB Configuration
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm font-public-sans">
                    Assign <strong>{config?.db_config?.DB_NAME}</strong> to a user.
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
                  <Label htmlFor="userId" className="text-white font-public-sans">
                    User *
                  </Label>
                  <Select
                    value={userId}
                    onValueChange={setUserId}
                    disabled={loadingUsers}
                  >
                    <SelectTrigger
                      id="userId"
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
                  <Label htmlFor="accessLevel" className="text-white font-public-sans">
                    Access Level *
                  </Label>
                  <Input
                    id="accessLevel"
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

                <div className="grid gap-2">
                  <Label className="text-white font-public-sans">Table Names</Label>
                  {loadingTables ? (
                    <div className="text-sm text-gray-400 font-public-sans py-2">
                      Loading table names...
                    </div>
                  ) : tableNames.length === 0 ? (
                    <div className="text-sm text-gray-400 font-public-sans py-2">
                      No table names available for this configuration
                    </div>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                      {tableNames.map((tableName) => (
                        <div
                          key={tableName}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5"
                        >
                          <span className="text-sm text-gray-200 font-public-sans">
                            {tableName}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-400 font-public-sans">
                    Table names will be automatically included from the configuration
                  </p>
                </div>
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
                  disabled={isSubmitting || !isValid || loadingUsers}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-barlow"
                >
                  {isSubmitting ? "Assigning..." : "Assign Configuration"}
                </Button>
              </DialogFooter>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

