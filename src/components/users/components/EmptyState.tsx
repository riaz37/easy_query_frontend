"use client";

import React from "react";
import { Plus } from "lucide-react";
import { EmptyState as StandardEmptyState } from "@/components/ui/empty-state";
import { EmptyStateProps as UserEmptyStateProps } from "../types";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  isDark
}: UserEmptyStateProps) {
  return (
    <StandardEmptyState
      icon={icon || Plus}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      variant="default"
      size="md"
      showAction={true}
    />
  );
}
