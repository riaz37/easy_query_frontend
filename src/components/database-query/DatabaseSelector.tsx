"use client";

import React, { useEffect } from "react";
import { useDatabases } from "@/lib/hooks/use-databases";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Database } from "lucide-react";

interface DatabaseSelectorProps {
  value?: number | null;
  onValueChange?: (dbId: number) => void;
}

export function DatabaseSelector({ value, onValueChange }: DatabaseSelectorProps) {
  const { databases, currentDatabase, currentDatabaseId, isLoading, refetch } = useDatabases();

  useEffect(() => {
    if (databases.length === 0 && !isLoading) {
      refetch();
    }
  }, [databases.length, isLoading, refetch]);

  const selectedDatabaseId = value ?? currentDatabaseId;
  const selectedDatabase = databases.find((db) => db.db_id === selectedDatabaseId);

  const handleValueChange = (dbIdString: string) => {
    const dbId = parseInt(dbIdString, 10);
    if (onValueChange) {
      onValueChange(dbId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database
        </Label>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Loading databases..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  if (databases.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database
        </Label>
        <Select disabled>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No databases available" />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        Database
      </Label>
      <Select
        value={selectedDatabaseId?.toString() || ""}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a database" />
        </SelectTrigger>
        <SelectContent>
          {databases.map((db) => (
            <SelectItem key={db.db_id} value={db.db_id.toString()}>
              {db.db_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


