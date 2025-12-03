"use client";

import React from "react";
import { DatabaseQueryHeader } from "./DatabaseQueryHeader";
import { QueryForm } from "@/components/shared/QueryForm";

interface DatabaseQueryCardProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onExecuteClick: (model?: string) => void;
  hasDatabase: boolean;
  userId?: string;
  className?: string;
  stopTypewriter?: boolean;
}

export function DatabaseQueryCard({
  query,
  setQuery,
  isExecuting,
  onExecuteClick,
  hasDatabase,
  className = "",
  stopTypewriter = false,
}: DatabaseQueryCardProps) {
  return (
    <div
      className={`px-2 py-2 flex flex-col h-full flex-1 query-card-gradient ${className}`}
    >
      <DatabaseQueryHeader />
      
      <div className="relative z-10">
        <QueryForm
          query={query}
          setQuery={setQuery}
          isExecuting={isExecuting}
          onExecuteClick={onExecuteClick}
          placeholder=""
          placeholderType="database"
          buttonText="Ask"
          showClearButton={true}
          disabled={!hasDatabase}
          enableTypewriter={true}
          stopTypewriter={stopTypewriter}
          showModelSelector={true}
        />
      </div>
    </div>
  );
}
