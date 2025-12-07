"use client";

import React from "react";
import { TableSelector } from "./TableSelector";

interface TableSectionProps {
  selectedTable: string | null;
  onTableSelect: (tableName: string) => void;
  configId: number | null;
  className?: string;
}

export function TableSection({
  selectedTable,
  onTableSelect,
  configId,
  className = "",
}: TableSectionProps) {
  return (
    <div
      className={`p-6 flex flex-col h-full flex-1 query-card-gradient ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-white font-semibold text-xl">Table</h3>
      </div>
      <div className="space-y-4">
        <TableSelector
          configId={configId}
          onTableSelect={onTableSelect}
        />
      </div>
    </div>
  );
}
