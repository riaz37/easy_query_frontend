"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useQueryStore } from "@/store/query-store";
import {
  useAuthContext,
  useDatabaseContext,
} from "@/components/providers";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  CheckCircle,
  File,
  History,
  AlertCircle,
  X,
  Database,
  Brain,
} from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { FileUpload, FileResults } from "@/components/file-query";
import {
  FileQueryCard,
  FileQueryPageHeader,
  QuickSuggestions,
  TableSection,
  UseTableToggle,
} from "@/components/file-query";
import { EnhancedFileUploadModal } from "@/components/file-query/EnhancedFileUploadModal";
import { PageLayout, PageHeader } from "@/components/layout/PageLayout";
import { ContentWrapper } from "@/components/layout/ContentWrapper";
import { copyToClipboard } from "@/lib/utils";
import { AuthenticatedRoute } from "@/components/auth";
import { VectorDBSelector } from "@/components/selectors";
import { fileService } from "@/lib/api/services/file-service";
import { QueryPageTour } from "@/components/onboarding/QueryPageTour";
import type {
  UploadedFile,
  FileQueryResult,
  QueryOptions,
} from "@/components/file-query";

function FileQueryPageContent() {
  // Query state
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<FileQueryResult[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [structuredResponse, setStructuredResponse] = useState<any>(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Vector DB config selection state
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [selectedConfigName, setSelectedConfigName] = useState<string>("");

  // Table selection state
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [useTable, setUseTable] = useState(false); // Track table usage from FileUpload - disabled by default

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Typewriter control state
  const [stopTypewriter, setStopTypewriter] = useState(false);

  // Progress state
  const [queryProgress, setQueryProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);

  const defaultProcessingSteps = useMemo(() => [
    "Analyzing your query...",
    "Searching documents...",
    "Reranking results...",
    "Generating answer...",
  ], []);

  // Simulate progress when executing
  useEffect(() => {
    if (isExecuting) {
      setQueryProgress(0);
      setProcessingSteps(defaultProcessingSteps);
      
      const interval = setInterval(() => {
        setQueryProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 10;
        });
      }, 800);

      return () => clearInterval(interval);
    } else {
      setQueryProgress(0);
      setProcessingSteps([]);
    }
  }, [isExecuting, defaultProcessingSteps]);

  // Store and context
  const { fileQueryHistory, loadQueryHistory, saveQuery } = useQueryStore();

  const { user, isLoading: userLoading, isAuthenticated } = useAuthContext();
  const { currentDatabaseId, currentDatabaseName } = useDatabaseContext();

  // Handle file upload status changes
  const handleUploadStatusChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
  }, []);

  // Handle files uploaded (get file IDs for querying)
  const handleFilesUploaded = useCallback((fileIds: string[]) => {
    console.log("Files uploaded with IDs:", fileIds);
    // These IDs can be used when querying specific files
  }, []);

  // Helper function to poll background file search status
  const pollBackgroundFileSearch = useCallback(
    async (taskId: string, maxAttempts = 60, pollInterval = 2000) => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const statusResponse = await fileService.pollBackgroundFileSearch(taskId);

          if (statusResponse.success && statusResponse.data) {
            return statusResponse;
          } else {
            throw new Error(statusResponse.error || "Failed to get file search status");
          }
        } catch (error) {
          if (attempt === maxAttempts - 1) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      }

      throw new Error("File search timeout: Maximum polling attempts reached");
    },
    []
  );

  // Handle query selection from suggestions
  const handleQuerySelect = useCallback((selectedQuery: string) => {
    setQuery(selectedQuery);
    setStopTypewriter(true);
  }, []);

  // Handle table usage change from FileUpload
  const handleTableUsageChange = useCallback((useTable: boolean) => {
    console.log("FileQueryPage: handleTableUsageChange called with:", useTable);
    setUseTable(useTable);
    // Clear selected table if tables are disabled
    if (!useTable) {
      setSelectedTable(null);
      toast.info("Table selection cleared - tables are disabled");
    }
  }, []);

  // Execute file query
  const handleQuerySubmit = useCallback(
    async (queryText: string, options: QueryOptions) => {
      if (!queryText.trim()) {
        toast.error("Please enter a query");
        return;
      }

      if (!isAuthenticated) {
        toast.error("Please log in to execute queries");
        return;
      }

      // Validate that a Vector DB config is selected
      if (!selectedConfigId) {
        toast.error("Please select a Vector DB configuration first");
        return;
      }

      setIsExecuting(true);
      setQueryError(null);
      setQueryResults([]);
      setQuery(queryText);

      try {
        // Get file IDs from completed uploads
        const completedFileIds = uploadedFiles
          .filter((file) => file.status === "completed")
          .map((file) => file.id);

        // Use the selected config_id for the query
        const searchRequest = {
          query: queryText,
          config_id: selectedConfigId, // Use selected Vector DB config
          user_id: user?.user_id,
          table_specific: !!selectedTable,
          tables: selectedTable ? [selectedTable] : [],
          answer_style: options?.answerStyle || "detailed",
          use_intent_reranker: false,
          use_chunk_reranker: false,
          use_dual_embeddings: true,
          intent_top_k: 20,
          chunk_top_k: 40,
          max_chunks_for_answer: 40,
          file_ids: completedFileIds.length > 0 ? completedFileIds : undefined,
        };

        // Execute file search synchronously
        const searchResponse = await fileService.searchFiles(searchRequest);

        if (!searchResponse.success || !searchResponse.data) {
          throw new Error(
            searchResponse.error || "Failed to execute file search"
          );
        }

        const searchData = searchResponse.data;
        console.log("File search response:", searchData);

        // Extract results from the response
        const answer = searchData.answer;
        const sources = answer.sources || [];

        // Create structured response data
        const structuredResponseData: {
          query: string;
          results: Array<{ filename: string; similarity?: number }>;
          answer: string;
          total_results: number;
        } = {
          query: searchData.query || queryText,
          results: sources.map((source: any, index: number) => ({
            filename: source.file_name || source.filename || `Document ${index + 1}`,
            similarity: source.similarity,
          })),
          answer: answer.answer || "",
          total_results: answer.sources_used || sources.length || 0,
        };

        // Set the structured response for the component
        setStructuredResponse(structuredResponseData);

        // Results are now only handled through structuredResponse
        setQueryResults([]);

        // Save to history
        if (user?.user_id && structuredResponseData) {
          saveQuery({
            id: Math.random().toString(36).substr(2, 9),
            type: "file",
            query: structuredResponseData.query,
            userId: user.user_id,
            timestamp: new Date(),
            results: [],
            metadata: {
              structuredResponse: structuredResponseData,
              resultCount: structuredResponseData.total_results || 0,
              fileIds: completedFileIds,
            },
          });
        }

        const totalResults = structuredResponseData.total_results || 0;
        toast.success(
          `Query executed successfully! Found ${totalResults} source document${totalResults !== 1 ? 's' : ''}.`
        );
      } catch (error) {
        console.error("File query execution error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setQueryError(errorMessage);
        toast.error(`Query failed: ${errorMessage}`);
      } finally {
        setIsExecuting(false);
      }
    },
    [
      isAuthenticated,
      user?.user_id,
      selectedConfigId,
      uploadedFiles,
      saveQuery,
      selectedTable,
      useTable,
    ]
  );

  // Handle query save
  const handleQuerySave = useCallback(
    (queryText: string) => {
      if (!queryText.trim() || !user?.user_id) {
        toast.error("Cannot save empty query or user not authenticated");
        return;
      }

      try {
        saveQuery({
          id: Date.now().toString(),
          type: "file",
          query: queryText.trim(),
          userId: user.user_id,
          timestamp: new Date(),
        });
        toast.success("Query saved successfully!");
      } catch (error) {
        console.error("Failed to save query:", error);
        toast.error("Failed to save query");
      }
    },
    [user?.user_id, saveQuery]
  );

  // Handle query clear
  const handleQueryClear = useCallback(() => {
    setQuery("");
    setQueryResults([]);
    setQueryError(null);
    setStructuredResponse(null);
    setSelectedTable(null); // Also clear selected table
  }, []);

  // Handle loading query from history
  const handleHistorySelect = useCallback((historyItem: any) => {
    setQuery(historyItem.query);
    setQueryResults([]);
    
    // Restore structured response from history metadata if available
    if (historyItem.metadata?.structuredResponse) {
      setStructuredResponse(historyItem.metadata.structuredResponse);
    } else {
      setStructuredResponse(null);
    }
    
    // Note: Table selection would need to be stored in history metadata to restore it
    toast.success("Query loaded from history");
  }, []);

  return (
    <PageLayout
      background={["frame", "gridframe"]}
      maxWidth="7xl"
      className="file-query-page min-h-screen flex flex-col justify-center py-6"
    >
      <div className="mt-2">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            .file-query-page textarea {
              background: var(--components-paper-bg-paper-blur, rgba(255, 255, 255, 0.04)) !important;
            }
          `,
          }}
        />

        {/* Page Header - Only show when no query results */}
        {!structuredResponse && !queryError && (
          <div className="px-4 sm:px-6 lg:px-32 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-4xl font-bold mb-2 block"
                  style={{
                    background:
                      "radial-gradient(70.83% 118.23% at 55.46% 50%, #0DAC5C 0%, #FFFFFF 84.18%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                    display: "block",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  Hi there, {user?.user_id || ""}
                </h1>
                <p
                  className="text-xl block"
                  style={{
                    background:
                      "radial-gradient(70.83% 118.23% at 55.46% 50%, #0DAC5C 0%, #FFFFFF 84.18%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                    display: "block",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  What would you like to know?
                </p>
              </div>
              {/* <Button
                variant="outline"
                className="text-white flex items-center gap-2"
                style={{
                  background:
                    "var(--components-button-Fill, rgba(255, 255, 255, 0.12))",
                  border: "1px solid var(--primary-16, rgba(19, 245, 132, 0.16))",
                  height: "48px",
                  minWidth: "64px",
                  borderRadius: "99px",
                }}
                onClick={() => {
                  // Handle history button click
                  console.log("History clicked");
                }}
              >
                <Image
                  src="/file-query/history.svg"
                  alt="History"
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                <span className="hidden sm:inline">History</span>
              </Button> */}
            </div>
          </div>
        )}

        {/* Query Results - Now at the top */}
        {structuredResponse && (
          <div className="px-4 sm:px-6 lg:px-32 mb-12">
            <div className="query-content-gradient">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-white font-semibold text-lg">
                    Query: "{structuredResponse?.query || ''}"
                  </h3>
                </div>

                {/* Fixed Top Separator */}
                <div
                  className="w-full border-bottom mb-4"
                  style={{
                    borderBottom:
                      "1px solid var(--white-4, rgba(255, 255, 255, 0.04))",
                  }}
                ></div>

                {/* Scrollable Content Area */}
                <div className="max-h-[300px] overflow-y-auto">
                  <FileResults
                    results={queryResults}
                    query={structuredResponse?.query || ''}
                    isLoading={isExecuting}
                    searchResponse={structuredResponse}
                  />
                </div>

                {/* Fixed Bottom Separator */}
                <div
                  className="w-full border-bottom mt-4"
                  style={{
                    borderBottom:
                      "1px solid var(--white-4, rgba(255, 255, 255, 0.04))",
                  }}
                ></div>

                {/* Copy Button - After Separator */}
                <div className="flex justify-start mt-4">
                  <button
                    onClick={async () => {
                      try {
                        if (!structuredResponse || !structuredResponse.answer) {
                          toast.error("No results to copy");
                          return;
                        }

                        let allResultsText = structuredResponse.answer;

                        // Add source information if available
                        if (
                          structuredResponse.results &&
                          structuredResponse.results.length > 0
                        ) {
                          allResultsText += "\n\n--- Source Documents ---\n";
                          structuredResponse.results.forEach(
                            (result: any, index: number) => {
                              allResultsText += `${index + 1}. ${result.filename}\n`;
                            }
                          );
                        }

                        const ok = await copyToClipboard(allResultsText);
                        if (ok) {
                          toast.success("Results copied to clipboard!");
                        } else {
                          toast.error("Failed to copy to clipboard");
                        }
                      } catch (error) {
                        console.error("Failed to copy to clipboard:", error);
                        toast.error("Failed to copy to clipboard");
                      }
                    }}
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                    title="Copy all results to clipboard"
                  >
                    <Image
                      src="/file-query/copy.svg"
                      alt="Copy"
                      width={16}
                      height={16}
                      className="w-4 h-4"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query Error - Also at the top */}
        {queryError && (
          <div className="px-4 sm:px-6 lg:px-32 mb-12">
            <div className="query-content-gradient max-h-[200px] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-red-400 font-semibold text-lg">
                    Query Error
                  </h3>
                </div>
                <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                  <p className="text-red-300">{queryError}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vector DB Config Selection Instruction */}
        {!selectedConfigId && !isExecuting && !structuredResponse && !queryError && (
          <div className="px-4 sm:px-6 lg:px-32 mb-6">
            <Alert className="bg-slate-800/50 border border-green-400/30 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <AlertDescription className="text-white">
                    <span className="font-semibold text-green-400">Please select a Vector DB configuration</span>{" "}
                    from the dropdown above to start querying. This will be the data source for all your file queries.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </div>
        )}

        {/* Table Toggle - Above Query Form */}
        <div className="px-4 sm:px-6 lg:px-32 mb-8">
          <UseTableToggle useTable={useTable} onToggle={setUseTable} />
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 lg:px-32 mb-16">
          <div
            className={`flex flex-col ${useTable ? "lg:flex-row" : ""} mb-12 ${
              useTable ? "lg:gap-4" : ""
            } ${useTable ? "lg:items-start" : ""} w-full max-w-full`}
          >
            {/* Left Column - File Query */}
            <div className={`${useTable ? "lg:flex-1" : "w-full"}`}>
              <FileQueryCard
                query={query}
                setQuery={setQuery}
                isExecuting={isExecuting}
                onUploadClick={() => setIsUploadModalOpen(true)}
                onExecuteClick={() =>
                  handleQuerySubmit(query, { answerStyle: "detailed" })
                }
                stopTypewriter={stopTypewriter}
                progress={queryProgress}
                currentStep={processingSteps[Math.min(Math.floor((queryProgress / 100) * processingSteps.length), processingSteps.length - 1)] || "Processing..."}
                disabled={!selectedConfigId}
                vectorDBSelector={
                  <VectorDBSelector
                    selectedConfigId={selectedConfigId}
                    onConfigSelect={(configId, configName) => {
                      setSelectedConfigId(configId);
                      setSelectedConfigName(configName);
                      toast.success(`Selected Vector DB: ${configName}`);
                    }}
                  />
                }
              />
            </div>

            {/* Right Column - Connect Table */}
            {useTable && (
              <div
                className={`${
                  useTable ? "lg:w-80 lg:flex-shrink-0" : "w-full"
                } ${useTable ? "mt-4 lg:mt-0" : ""} flex`}
              >
                <TableSection
                  selectedTable={selectedTable}
                  onTableSelect={(tableName) => {
                    setSelectedTable(tableName);
                    toast.success(`Selected table: ${tableName}`);
                  }}
                  configId={selectedConfigId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Quick Suggestions Section - Only show when no query results */}
        {!structuredResponse && !queryError && (
          <div className="px-4 sm:px-6 lg:px-32 mb-8">
            <QuickSuggestions onQuerySelect={handleQuerySelect} />
          </div>
        )}

        {/* Enhanced File Upload Modal */}
        <EnhancedFileUploadModal
          open={isUploadModalOpen}
          onOpenChange={setIsUploadModalOpen}
          onFilesUploaded={handleFilesUploaded}
          onUploadStatusChange={handleUploadStatusChange}
          disabled={!isAuthenticated}
          configId={selectedConfigId}
        />

        {/* Onboarding Tour */}
        {!structuredResponse && !queryError && !isExecuting && (
          <QueryPageTour pageType="file" />
        )}
      </div>
    </PageLayout>
  );
}

export default function FileQueryPage() {
  return (
    <AuthenticatedRoute authRequiredMessage="Please log in to use the file query feature.">
      <FileQueryPageContent />
    </AuthenticatedRoute>
  );
}
