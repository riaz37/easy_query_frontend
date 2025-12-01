import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import type { BusinessRulesEditorProps } from "../../../../types";

export const BusinessRulesEditor = React.memo<BusinessRulesEditorProps>(
  ({
    currentDatabaseId,
    businessRules,
    editorState,
    onContentChange,
    onEdit,
    onSave,
    onCancel,
    onReset,
  }) => {
    if (!currentDatabaseId) {
      return null;
    }

    return (
      <div>
        {/* Business Rules Content */}
        <div className="space-y-6">
          <div className="query-content-gradient rounded-[32px] p-4 lg:p-6">
            <div className="space-y-4">
              {/* Business Rules Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div>
                    <h3 className="modal-title-enhanced text-lg lg:text-xl">
                      Business Rules
                    </h3>
                    <p className="text-gray-400 text-sm">
                      View and edit business rules
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editorState.isEditing ? (
                    <>
                      <Button
                        onClick={onSave}
                        className="modal-button-primary"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={onCancel}
                        className="modal-button-secondary"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onEdit}
                        className="border-0 text-white hover:bg-white/10 cursor-pointer"
                        style={{
                          background:
                            "var(--components-paper-bg-paper-blur, rgba(255, 255, 255, 0.04))",
                          borderRadius: "118.8px",
                          width: "40px",
                          height: "40px",
                        }}
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

              {/* Business Rules Content */}
              <div className="space-y-3">
                {/* Validation Error Display */}
                {editorState.contentError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">
                      {editorState.contentError}
                    </p>
                  </div>
                )}
                
                <div className={`query-content-gradient rounded-[16px] transition-all duration-300 ${
                  editorState.isEditing ? "overflow-y-auto ring-1 ring-gray-400/30 ring-offset-1 ring-offset-transparent" : "overflow-hidden"
                } ${editorState.contentError ? "ring-1 ring-red-500/50 ring-offset-1 ring-offset-transparent" : ""}`}>
                  {editorState.isEditing ? (
                    <Textarea
                      value={editorState.editedContent}
                      onChange={(e) => onContentChange(e.target.value)}
                      className={`min-h-[200px] max-h-[600px] resize-y border-0 bg-transparent focus:ring-0 focus:ring-offset-0 rounded-[16px] w-full overflow-y-auto ${
                        editorState.contentError ? "border-red-500" : ""
                      }`}
                      placeholder="Enter SQL business rules for this database"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        hyphens: "auto",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        overflowX: "hidden",
                        whiteSpace: "pre-wrap",
                      }}
                    />
                  ) : businessRules.content ? (
                    <div className="p-4">
                      <MarkdownRenderer 
                        content={businessRules.content}
                        maxHeight="600px"
                      />
                    </div>
                  ) : (
                    <div className="p-4 max-h-[600px] overflow-y-auto">
                      <p className="text-gray-400">
                        No business rules configured for this database.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BusinessRulesEditor.displayName = "BusinessRulesEditor";
