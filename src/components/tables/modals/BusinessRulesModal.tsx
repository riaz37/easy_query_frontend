"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { safeString, safeTrim, isNonEmptyString } from "@/utils/stringUtils";

interface BusinessRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessRule: unknown; // Allow any type since we handle conversion safely
  setBusinessRule: (rule: string) => void;
  contentLoading: boolean; // loading the existing business rule into the modal
  saving?: boolean; // saving action state
  onSubmit: () => void;
  error?: string | null;
  success?: string | null;
}

export function BusinessRulesModal({
  open,
  onOpenChange,
  businessRule,
  setBusinessRule,
  contentLoading,
  saving = false,
  onSubmit,
  error,
  success,
}: BusinessRulesModalProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const handleSubmit = () => {
    setLocalError(null);
    setLocalSuccess(null);

    if (!isNonEmptyString(businessRule)) {
      setLocalError("Business rule cannot be empty");
      return;
    }

    onSubmit();
  };

  const handleSuccess = () => {
    setLocalSuccess("Business rule updated successfully!");
    setTimeout(() => {
      setLocalSuccess(null);
      onOpenChange(false);
    }, 2000);
  };

  const handleError = (error: string) => {
    setLocalError(error);
  };

  // Call the parent's onSubmit and handle success/error
  React.useEffect(() => {
    if (localSuccess) {
      handleSuccess();
    }
  }, [localSuccess]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 border-0 bg-transparent modal-lg"
        showCloseButton={false}
      >
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-xl font-semibold">
                    Business Rules Management
                  </DialogTitle>
               
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="modal-close-button cursor-pointer flex-shrink-0 ml-4"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </DialogHeader>

            <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
              {/* Success Alert */}
              {(success || localSuccess) && (
                <Alert className="mb-4 border-green-200 bg-green-800/20 text-green-300">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success || localSuccess}</AlertDescription>
                </Alert>
              )}

              {/* Error Alert */}
              {(error || localError) && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error || localError}</AlertDescription>
                </Alert>
              )}

              {/* Business Rule Input */}
              <div className="modal-form-group">
                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4" />
                      <p className="text-slate-400">Loading business rules...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Textarea
                      className="modal-input-enhanced min-h-[300px] resize-none"
                      value={safeString(businessRule)}
                      onChange={(e) => setBusinessRule(e.target.value)}
                      placeholder="Enter your business rules here..."
                    />
                    <p className="modal-form-description">
                      Define clear, actionable business rules that will be enforced across your database tables.
                    </p>
                  </>
                )}
              </div>

              {/* Submit Button - Only show when not loading content */}
              {!contentLoading && (
                <div className="modal-button-group-responsive mt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={saving || !isNonEmptyString(businessRule)}
                    className="modal-button-primary cursor-pointer min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>Save</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}