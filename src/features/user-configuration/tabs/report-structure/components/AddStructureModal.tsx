"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface AddStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (key: string, value: string) => void;
}

export const AddStructureModal = React.memo<AddStructureModalProps>(
  ({ isOpen, onClose, onAdd }) => {
    const [structureKey, setStructureKey] = useState("");
    const [structureValue, setStructureValue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
      if (!structureKey.trim() || !structureValue.trim()) {
        return;
      }

      setIsSubmitting(true);
      try {
        await onAdd(structureKey.trim(), structureValue.trim());
        setStructureKey("");
        setStructureValue("");
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }, [structureKey, structureValue, onAdd, onClose]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    const handleClose = () => {
      if (!isSubmitting) {
        setStructureKey("");
        setStructureValue("");
        onClose();
      }
    };

    const isFormValid = structureKey.trim().length > 0 && structureValue.trim().length > 0;

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] p-0 border-0 bg-transparent"
          showCloseButton={false}
        >
          <div className="modal-enhanced">
            <div className="modal-content-enhanced flex flex-col max-h-[90vh]">
              <DialogHeader className="modal-header-enhanced flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="modal-title-enhanced">
                      Add New Structure
                    </DialogTitle>
                    <DialogDescription className="modal-description-enhanced">
                      Provide a descriptive key and the content that defines this report section.
                      Press Ctrl+Enter to save quickly.
                    </DialogDescription>
                  </div>
                  <button
                    onClick={handleClose}
                    className="modal-close-button"
                    disabled={isSubmitting}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </DialogHeader>

              <div className="modal-form-content flex-1 overflow-y-auto px-6 pb-6">
                <div className="modal-form-group">
                  <Label className="modal-label-enhanced">
                    Structure Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={structureKey}
                    onChange={(e) => setStructureKey(e.target.value)}
                    placeholder="e.g., sales_summary, user_analytics"
                    className="modal-input-enhanced"
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                  />
                  <div className="modal-form-description">
                    Use snake_case for consistency (e.g., sales_summary)
                  </div>
                </div>
                
                <div className="modal-form-group">
                  <Label className="modal-label-enhanced">
                    Structure Content <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={structureValue}
                    onChange={(e) => setStructureValue(e.target.value)}
                    className="modal-input-enhanced resize-none"
                    placeholder="Enter SQL queries, JSON configuration, or any text content for this structure..."
                    style={{
                      minHeight: "300px",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      hyphens: "auto",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                      overflow: "hidden",
                      whiteSpace: "pre-wrap",
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                  />
                  <div className="modal-form-description">
                    Supports SQL, JSON, or plain text. Use Ctrl+Enter to save.
                  </div>
                </div>
              </div>

              {/* Action Buttons - Fixed Footer */}
              <div className="flex-shrink-0 px-6 py-6">
                <div className="modal-button-group-responsive">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="modal-button-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    className="modal-button-primary"
                  >
                    {isSubmitting ? "Adding..." : "Add Structure"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

AddStructureModal.displayName = "AddStructureModal";
