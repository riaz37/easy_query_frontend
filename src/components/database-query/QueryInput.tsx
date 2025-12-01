"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play } from "lucide-react";
import { Spinner } from "@/components/ui/loading";

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  isExecuting: boolean;
  onExecute: () => void;
  disabled?: boolean;
}

export function QueryInput({
  query,
  setQuery,
  isExecuting,
  onExecute,
  disabled = false,
}: QueryInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!disabled && !isExecuting && query.trim()) {
        onExecute();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">SQL Query</label>
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your SQL query here... (Ctrl+Enter to execute)"
          disabled={disabled || isExecuting}
          className="min-h-[200px] font-mono text-sm"
        />
      </div>
      <div className="flex justify-end">
        <Button
          onClick={onExecute}
          disabled={disabled || isExecuting || !query.trim()}
          className="min-w-[120px]"
        >
          {isExecuting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Executing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Execute
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


