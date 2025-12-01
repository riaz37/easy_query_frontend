"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface StructureHeaderProps {
  title?: string;
  description?: string;
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
  onRefresh?: () => void;
  onAdd?: () => void;
  className?: string;
}

export const StructureHeader = React.memo<StructureHeaderProps>(
  ({
    title = "Report Structure",
    description = "View and edit report structures",
    hasUnsavedChanges = false,
    isSaving = false,
    onSave,
    onRefresh,
    onAdd,
    className,
  }) => {
    return (
      <div className={className}>
        <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="modal-title-enhanced text-lg lg:text-xl flex items-center gap-2">
                  {title}
                </h2>
                <p className="text-gray-400 text-sm">
                  {description}
                </p>
              </div>
              
              <div className="flex gap-2">
                {hasUnsavedChanges && onSave && (
                  <Button
                    onClick={onSave}
                    disabled={isSaving}
                    className="modal-button-primary"
                    size="sm"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                )}


                {onAdd && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-0 text-white hover:bg-white/10 cursor-pointer"
                    style={{
                      background: "var(--components-paper-bg-paper-blur, rgba(255, 255, 255, 0.04))",
                      borderRadius: "118.8px",
                      width: "48px",
                      height: "48px",
                    }}
                    onClick={onAdd}
                    title="Add new structure"
                  >
                    <img
                      src="/user-configuration/edit.svg"
                      alt="Add Structure"
                      className="w-6 h-6"
                    />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StructureHeader.displayName = "StructureHeader";
