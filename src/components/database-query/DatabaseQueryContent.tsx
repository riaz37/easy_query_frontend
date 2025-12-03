"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext, useDatabaseContext } from "@/components/providers";
import { useDatabaseOperations } from "@/lib/hooks/use-database-operations";
import { useTaskCreator } from "@/components/task-manager";
import { toast } from "sonner";
import {
  Database,
  BarChart3,
  User,
} from "lucide-react";
import { QueryHistoryPanel } from "@/components/database-query/QueryHistoryPanel";
import { QueryResultOverlay } from "@/components/ui/query-result-overlay";
import { PageLayout } from "@/components/layout/PageLayout";
import { DatabaseQueryPageHeader } from "@/components/database-query/components";
import { QuickSuggestions } from "@/components/file-query/QuickSuggestions";
import { DatabaseQueryCard } from "@/components/database-query/DatabaseQueryCard";

export function DatabaseQueryContent() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { currentDatabase, hasCurrentDatabase } = useDatabaseContext();
  const {
    loading,
    error,
    sendQuery,
  } = useDatabaseOperations();
  const { createQueryTask, executeTask } = useTaskCreator();

  // State
  const [showHistory, setShowHistory] = useState(false);
  const [showResultOverlay, setShowResultOverlay] = useState(false);
  const [completedQuery, setCompletedQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [queryProgress, setQueryProgress] = useState(0);
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [stopTypewriter, setStopTypewriter] = useState(false);

  // Memoize the processing steps to prevent recreation
  const defaultProcessingSteps = useMemo(() => [
    "Analyzing your query...",
    "Connecting to database...",
    "Generating SQL...",
    "Executing query...",
    "Processing results...",
    "Formatting data...",
    "Preparing response..."
  ], []);

  // Voice agent event handlers
  useEffect(() => {
    const handleVoiceAgentShowMessage = (event: CustomEvent) => {
      console.log('🎤 Voice agent show message event:', event.detail)
      if (event.detail.type === 'info') {
        toast.info(event.detail.message)
      }
    }

    // Add event listeners
    window.addEventListener('voice-agent-show-message', handleVoiceAgentShowMessage as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener('voice-agent-show-message', handleVoiceAgentShowMessage as EventListener)
    }
  }, [])

  // Simulate progress when loading
  useEffect(() => {
    if (loading) {
      setQueryProgress(0);
      setProcessingSteps(defaultProcessingSteps);
      
      const interval = setInterval(() => {
        setQueryProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
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
  }, [loading, defaultProcessingSteps]);

  // Note: Query history loading can be added when history service is available

  // ESC key handler for closing overlays/panels
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showResultOverlay) {
          setShowResultOverlay(false);
        } else if (showHistory) {
          setShowHistory(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showResultOverlay, showHistory]);

  const handleQuerySubmit = useCallback(async (query: string, model?: string) => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (!hasCurrentDatabase) {
      toast.error("Please select a database first");
      return;
    }

    if (!user?.user_id) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    // Create a background task for query execution
    const taskId = createQueryTask(
      `Query: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`,
      `Executing database query: "${query}"`,
      {
        user_id: user.user_id,
        query: query,
        database_id: currentDatabase?.db_id,
      }
    );

    // Execute the task in background
    executeTask(
      taskId,
      async () => {
        try {
          setCurrentQuery(query);
          setQueryInput(query);
          console.log("Sending database query with user ID:", user.user_id);

          const response = await sendQuery({
            userId: user.user_id,
            question: query,
            db_id: currentDatabase?.db_id,
            model: model || 'gemini',
            table_agent_mode: 'hybrid',
          });

          console.log("Query response:", response);
          toast.success("Query submitted successfully!");
          
          // Store query result in sessionStorage for the results page
          const queryResult = {
            query: query,
            userId: user.user_id,
            timestamp: new Date().toISOString(),
            result: {
              data: response.data?.data || [],
              model_used: response.data?.model_used || 'gemini',
              sql: response.data?.sql || ''
            }
          };
          sessionStorage.setItem("databaseQueryResult", JSON.stringify(queryResult));
          
          // Show result overlay
          setCompletedQuery(query);
          setShowResultOverlay(true);
          
          return response;
        } catch (error) {
          console.error("Query failed:", error);
          toast.error("Failed to execute query. Please try again.");
          throw error;
        }
      }
    ).catch((error) => {
      console.error("Failed to execute query:", error);
    });
  }, [user?.user_id, hasCurrentDatabase, currentDatabase?.db_id, sendQuery, createQueryTask, executeTask]);

  const handleViewResults = useCallback(() => {
    setShowResultOverlay(false);
    router.push('/database-query-results');
  }, [router]);

  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => {
      // Close result overlay when opening history
      if (!prev) {
        setShowResultOverlay(false);
      }
      return !prev;
    });
  }, []);

  // Close history panel handler
  const handleCloseHistory = useCallback(() => {
    setShowHistory(false);
  }, []);

  // Close result overlay handler
  const handleCloseResultOverlay = useCallback(() => {
    setShowResultOverlay(false);
    setCompletedQuery("");
  }, []);

  // Query selection handler
  const handleQuerySelect = useCallback((query: string) => {
    setQueryInput(query);
    setStopTypewriter(true);
    setShowHistory(false); // Close panel after selecting a query
  }, []);

  return (
    <PageLayout
      background={["frame", "gridframe"]}
      maxWidth="7xl"
      className="database-query-page min-h-screen flex flex-col justify-center py-6
                 max-sm:py-4
                 sm:py-6"
    >
      <div className="mt-2 max-sm:mt-1 sm:mt-2">
      
      {/* Welcome Header */}
      <div className="px-4 sm:px-6 lg:px-32">
        <DatabaseQueryPageHeader
          onHistoryClick={handleToggleHistory}
          username={user?.username || ""}
        />
      </div>

      {/* Main Content - Full Width */}
      <div className="px-4 sm:px-6 lg:px-32 mb-16 max-sm:mb-12 sm:mb-16">
        <div className="space-y-6 max-sm:space-y-4 sm:space-y-6">
          <DatabaseQueryCard
            query={queryInput}
            setQuery={setQueryInput}
            isExecuting={loading}
            onExecuteClick={(model) => handleQuerySubmit(queryInput, model)}
            hasDatabase={hasCurrentDatabase}
            userId={user?.user_id}
            stopTypewriter={stopTypewriter}
          />
        </div>
      </div>

      {/* Quick Suggestions Section */}
      <div className="px-4 sm:px-6 lg:px-32 mb-8">
        <QuickSuggestions
          title="Database Query Suggestions"
          suggestions={[
            { 
              text: "Attendance of May", 
              query: "Attendance of May",
              icon: <User className="h-4 w-4 text-green-400" />
            },
            { 
              text: "What are the top performing products?", 
              query: "What are the top performing products?",
              icon: <BarChart3 className="h-4 w-4 text-green-400" />
            },
            { 
              text: "Find orders with total amount greater than $1000", 
              query: "Find orders with total amount greater than $1000",
              icon: <Database className="h-4 w-4 text-green-400" />
            },
            { 
              text: "Show me revenue trends over time", 
              query: "Show me revenue trends over time",
              icon: <BarChart3 className="h-4 w-4 text-green-400" />
            },
          ]}
          onQuerySelect={handleQuerySelect}
        />
      </div>

      {/* Query History Panel */}
      {showHistory && (
        <QueryHistoryPanel
          history={[]}
          loading={false}
          onClose={handleCloseHistory}
          onQuerySelect={handleQuerySelect}
        />
      )}

      {/* Query Result Overlay */}
      <QueryResultOverlay
        isVisible={showResultOverlay}
        onViewResults={handleViewResults}
        onClose={handleCloseResultOverlay}
        queryText={completedQuery}
        queryMode="query"
      />
      </div>
    </PageLayout>
  );
}