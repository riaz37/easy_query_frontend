"use client";

import React from "react";
import { QueryToggle } from "@/components/ui/toggle";

interface UseTableToggleProps {
  useTable: boolean;
  onToggle: (useTable: boolean) => void;
  className?: string;
}

export function UseTableToggle({ 
  useTable, 
  onToggle, 
  className = "" 
}: UseTableToggleProps) {
  return (
    <div data-tour="table-toggle">
      <QueryToggle
        checked={useTable}
        onToggle={onToggle}
        label="Use Folder"
        className={className}
      />
    </div>
  );
}
