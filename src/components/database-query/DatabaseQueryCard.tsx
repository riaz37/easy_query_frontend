"use client";

import React from "react";
import { DatabaseQueryHeader } from "./DatabaseQueryHeader";
import { QueryForm } from "@/components/shared/QueryForm";
import { QueryProgress } from "@/components/shared/QueryProgress";

interface DatabaseQueryCardProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onExecuteClick: (model?: string) => void;
  hasDatabase: boolean;
  userId?: string;
  className?: string;
  stopTypewriter?: boolean;
  progress?: number;
  currentStep?: string;
}

export function DatabaseQueryCard({
  query,
  setQuery,
  isExecuting,
  onExecuteClick,
  hasDatabase,
  className = "",
  stopTypewriter = false,
  ...props
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
        {isExecuting && (
          <div className="mt-4 px-2">
            <QueryProgress 
              progress={props.progress || 0} 
              currentStep={props.currentStep || "Processing..."} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
