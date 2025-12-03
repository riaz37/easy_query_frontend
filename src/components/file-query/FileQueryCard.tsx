"use client";

import React from "react";
import { FileQueryHeader } from "./FileQueryHeader";
import { QueryForm } from "@/components/shared/QueryForm";

interface FileQueryCardProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onUploadClick: () => void;
  onExecuteClick: () => void;
  className?: string;
  stopTypewriter?: boolean;
}

export function FileQueryCard({
  query,
  setQuery,
  isExecuting,
  onUploadClick,
  onExecuteClick,
  className = "",
  stopTypewriter = false,
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
      />
    </div>
  );
}
