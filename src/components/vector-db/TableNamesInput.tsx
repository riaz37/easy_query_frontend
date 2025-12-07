"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, XIcon } from "lucide-react";

interface TableNamesInputProps {
  tableNames: string[];
  onAdd: (tableName: string) => void;
  onRemove: (tableName: string) => void;
  placeholder?: string;
  description?: string;
}

export function TableNamesInput({
  tableNames,
  onAdd,
  onRemove,
  placeholder = "Enter folder name",
  description,
}: TableNamesInputProps) {
  const [newTableName, setNewTableName] = React.useState("");

  const handleAdd = () => {
    if (newTableName.trim() && !tableNames.includes(newTableName.trim())) {
      onAdd(newTableName.trim());
      setNewTableName("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="grid gap-2">
      <Label className="text-white font-public-sans">Folder Names</Label>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-public-sans"
            placeholder={placeholder}
          />
        </div>
        <Button
          onClick={handleAdd}
          disabled={!newTableName.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tableNames.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tableNames.map((tableName, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10"
            >
              <span className="text-sm text-gray-200 font-public-sans">{tableName}</span>
              <button
                onClick={() => onRemove(tableName)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                type="button"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {description && (
        <p className="text-xs text-gray-400 font-public-sans">{description}</p>
      )}
    </div>
  );
}

