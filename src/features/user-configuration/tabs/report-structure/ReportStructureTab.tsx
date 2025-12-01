"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useUserContext } from "@/lib/hooks/use-user-context";
import { useDatabaseContext } from "@/components/providers/DatabaseContextProvider";
import { ReportStructure, UpdateReportStructureRequest } from "@/types/reports";
import { ReportStructureSkeleton } from "@/components/ui/loading";
import { toast } from "sonner";
import {
  StructureItem,
  AddStructureModal,
  EmptyState,
  ErrorState,
  StructureHeader,
  type EditableStructure,
} from "./components";

interface ReportStructureTabProps {
  className?: string;
  reportStructure?: string;
  loading?: boolean;
  reportStructureError?: string | null;
  onRefresh?: () => void;
}


export const ReportStructureTab = React.memo<ReportStructureTabProps>(
  ({
    className,
    reportStructure: reportStructureString = "",
    loading = false,
    reportStructureError = null,
    onRefresh,
  }) => {
    const { user } = useUserContext();
    const { currentDatabaseId } = useDatabaseContext();

    const [editableStructures, setEditableStructures] = useState<
      EditableStructure[]
    >([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Initialize editable structures from loaded structure
    useEffect(() => {
      if (reportStructureString) {
        try {
          const parsedStructure = JSON.parse(reportStructureString);
          const structures = Object.entries(parsedStructure).map(
            ([key, value]) => ({
              key,
              value: String(value),
              isEditing: false,
              originalValue: String(value),
            })
          );
          setEditableStructures(structures);
        } catch (error) {
          console.error("Failed to parse report structure:", error);
          setEditableStructures([]);
        }
      } else {
        setEditableStructures([]);
      }
    }, [reportStructureString, loading, reportStructureError]);

    const startEditing = useCallback((index: number) => {
      setEditableStructures((prev) =>
        prev.map((structure, i) =>
          i === index
            ? { ...structure, isEditing: true, originalValue: structure.value }
            : structure
        )
      );
    }, []);

    const cancelEditing = useCallback((index: number) => {
      setEditableStructures((prev) =>
        prev.map((structure, i) =>
          i === index && structure.originalValue !== undefined
            ? {
                ...structure,
                value: structure.originalValue,
                isEditing: false,
                originalValue: undefined,
              }
            : structure
        )
      );
    }, []);

    const updateStructure = useCallback(
      (index: number, field: "key" | "value", value: string) => {
        setEditableStructures((prev) =>
          prev.map((structure, i) =>
            i === index ? { ...structure, [field]: value } : structure
          )
        );
      },
      []
    );



    const addNewStructure = useCallback((key: string, value: string) => {
      // Check if key already exists
      if (editableStructures.some((s) => s.key === key)) {
        toast.error("A structure with this key already exists");
        return;
      }

      const newStructure: EditableStructure = {
        key,
        value,
        isEditing: false,
        originalValue: undefined,
      };

      setEditableStructures((prev) => [...prev, newStructure]);
      toast.success("New structure added");
    }, [editableStructures]);

    const saveAllChanges = useCallback(async () => {
      if (!user?.user_id) {
        setError("User not authenticated");
        return;
      }

      if (!currentDatabaseId) {
        setError("No database selected");
        toast.error("Please select a database first");
        return;
      }

      setSaving(true);
      setError(null);

      try {
        // Convert editable structures back to ReportStructure format
        const structureObject: ReportStructure = {};
        editableStructures.forEach((structure) => {
          structureObject[structure.key] = structure.value;
        });

        // Update the report structure using the correct database endpoint
        const structureString = JSON.stringify(structureObject, null, 2);
        const { ServiceRegistry } = await import("@/lib/api");
        
        const request: UpdateReportStructureRequest = {
          report_structure: structureString
        };
        
        await ServiceRegistry.reports.updateUserReportStructure(currentDatabaseId, request);

        // Clear editing state for all structures after successful save
        setEditableStructures((prev) =>
          prev.map((structure) => ({
            ...structure,
            isEditing: false,
            originalValue: undefined,
          }))
        );

        toast.success("Report structure updated successfully");

        // Refresh the data
        if (onRefresh) {
          onRefresh();
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save changes";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Failed to save report structure:", err);
      } finally {
        setSaving(false);
      }
    }, [user?.user_id, currentDatabaseId, editableStructures, onRefresh]);

    const hasUnsavedChanges = useCallback(() => {
      return editableStructures.some(
        (structure) =>
          structure.isEditing ||
          (structure.originalValue &&
            structure.value !== structure.originalValue)
      );
    }, [editableStructures]);

    const resetToOriginal = useCallback(() => {
      if (reportStructureString) {
        try {
          const parsedStructure = JSON.parse(reportStructureString);
          const structures = Object.entries(parsedStructure).map(
            ([key, value]) => ({
              key,
              value: String(value),
              isEditing: false,
              originalValue: String(value),
            })
          );
          setEditableStructures(structures);
          toast.info("Changes reset to original");
        } catch (error) {
          console.error("Failed to parse report structure for reset:", error);
          setEditableStructures([]);
        }
      }
    }, [reportStructureString]);

    if (loading) {
      return <ReportStructureSkeleton />;
    }

    if (reportStructureError) {
      return (
        <ErrorState
          error={reportStructureError}
          onRetry={onRefresh}
          className={className}
        />
      );
    }

    return (
      <div className={className}>
        <StructureHeader
          hasUnsavedChanges={hasUnsavedChanges()}
          isSaving={saving}
          onSave={saveAllChanges}
          onRefresh={onRefresh}
          onAdd={() => setIsAddModalOpen(true)}
        />

        {/* Report Structures List */}
        <div className="space-y-6 mt-6">
          {editableStructures.length === 0 ? (
            <EmptyState
              actionText="Click the add button to create your first structure"
              onAction={() => setIsAddModalOpen(true)}
            />
          ) : (
            editableStructures.map((structure, index) => (
              <StructureItem
                key={index}
                structure={structure}
                index={index}
                onUpdate={updateStructure}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
              />
            ))
          )}
        </div>

        {/* Add New Structure Modal */}
        <AddStructureModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={addNewStructure}
        />
      </div>
    );
  }
);

ReportStructureTab.displayName = "ReportStructureTab";
