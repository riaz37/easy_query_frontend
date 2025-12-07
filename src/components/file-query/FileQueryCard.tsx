"use client";

import React from "react";
import { FileQueryHeader } from "./FileQueryHeader";
import { QueryForm } from "@/components/shared/QueryForm";
import { QueryProgress } from "@/components/shared/QueryProgress";

interface FileQueryCardProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onUploadClick: () => void;
  onExecuteClick: () => void;
  className?: string;
  stopTypewriter?: boolean;
  progress?: number;
  currentStep?: string;
  vectorDBSelector?: React.ReactNode;
  disabled?: boolean;
}

export function FileQueryCard({
  query,
  setQuery,
  isExecuting,
  onUploadClick,
  onExecuteClick,
  className = "",
  stopTypewriter = false,
  vectorDBSelector,
  disabled = false,
  ...props
}: FileQueryCardProps) {
  return (
    <div
      className={`px-2 py-2 flex flex-col h-full flex-1 query-card-gradient ${className}`}
    >
      <FileQueryHeader />
      <QueryForm
        query={query}
        setQuery={setQuery}
        isExecuting={isExecuting}
        onExecuteClick={onExecuteClick}
        onUploadClick={onUploadClick}
        placeholder=""
        placeholderType="file"
        buttonText="Ask"
        showUploadButton={true}
        showClearButton={false}
        enableTypewriter={true}
        stopTypewriter={stopTypewriter}
        databaseSelector={vectorDBSelector}
        disabled={disabled}
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
  );
}
