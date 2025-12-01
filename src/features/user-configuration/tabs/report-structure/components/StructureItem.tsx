"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface EditableStructure {
  key: string;
  value: string;
  isEditing?: boolean;
  originalValue?: string;
}

interface StructureItemProps {
  structure: EditableStructure;
  index: number;
  onUpdate: (index: number, field: "key" | "value", value: string) => void;
  onStartEditing: (index: number) => void;
  onCancelEditing: (index: number) => void;
}

export const StructureItem = React.memo<StructureItemProps>(
  ({
    structure,
    index,
    onUpdate,
    onStartEditing,
    onCancelEditing,
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
          onCancelEditing(index);
        }
      },
      [index, onCancelEditing]
    );

    return (
      <div
        className="query-content-gradient rounded-[32px] p-4 lg:p-6"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="space-y-4">
          {/* Structure Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {structure.isEditing ? (
                  <Input
                    value={structure.key}
                    onChange={(e) => onUpdate(index, "key", e.target.value)}
                    className="modal-input-enhanced text-lg font-semibold"
                    placeholder="Structure name"
                    onKeyDown={handleKeyPress}
                  />
                ) : (
                  structure.key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                )}
              </h3>
              <p className="text-gray-400 text-sm">
                {structure.isEditing ? "Edit structure details" : "View and edit structure"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {structure.isEditing ? (
                <Button
                  onClick={() => onCancelEditing(index)}
                  className="modal-button-secondary"
                  size="sm"
                >
                  Cancel
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStartEditing(index)}
                    className="border-0 text-white hover:bg-white/10 cursor-pointer transition-opacity"
                    style={{
                      background: "var(--components-paper-bg-paper-blur, rgba(255, 255, 255, 0.04))",
                      borderRadius: "118.8px",
                      width: "40px",
                      height: "40px",
                      opacity: isHovered ? 1 : 0.7,
                    }}
                    title="Edit structure"
                  >
                    <img
                      src="/user-configuration/reportedit.svg"
                      alt="Edit"
                      className="w-5 h-5"
                    />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Structure Content */}
          <div className="space-y-3">
            <div
              className={`query-content-gradient rounded-[16px] overflow-hidden transition-all duration-300 ${
                structure.isEditing
                  ? "ring-1 ring-gray-400/30 ring-offset-1 ring-offset-transparent"
                  : ""
              }`}
            >
              {structure.isEditing ? (
                <Textarea
                  value={structure.value}
                  onChange={(e) => onUpdate(index, "value", e.target.value)}
                  className="min-h-[200px] max-h-[600px] resize-y border-0 bg-transparent focus:ring-0 focus:ring-offset-0 rounded-[16px] w-full overflow-hidden"
                  placeholder="Enter structure content (SQL, JSON, or text)"
                  style={{
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    hyphens: "auto",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    overflowX: "hidden",
                    whiteSpace: "pre-wrap",
                  }}
                  onKeyDown={handleKeyPress}
                />
              ) : structure.value ? (
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-white whitespace-pre-wrap text-sm font-mono">
                    {structure.value}
                  </pre>
                </div>
              ) : (
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <p className="text-gray-400">
                    No content configured for this structure.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StructureItem.displayName = "StructureItem";
