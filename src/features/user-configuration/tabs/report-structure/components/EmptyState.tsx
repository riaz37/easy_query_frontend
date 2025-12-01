"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { EmptyState as StandardEmptyState } from "@/components/ui/empty-state";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState = React.memo<EmptyStateProps>(
  ({
    title = "No Report Structures Found",
    description = "Report structures will appear here once they are configured. Click the add button to create your first structure.",
    actionText,
    onAction,
    className,
  }) => {
    return (
      <div className={className}>
        <StandardEmptyState
          icon={AlertCircle}
          title={title}
          description={description}
          actionLabel={actionText}
          onAction={onAction}
          variant="card"
          size="md"
          showAction={!!actionText && !!onAction}
        />
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";
