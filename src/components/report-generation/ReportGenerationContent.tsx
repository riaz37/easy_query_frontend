"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers";
import { toast } from "sonner";
import {
  Database,
  BarChart3,
  User,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QueryHistoryPanel } from "@/components/database-query/QueryHistoryPanel";
import { QueryResultOverlay } from "@/components/ui/query-result-overlay";
import { PageLayout } from "@/components/layout/PageLayout";
import { DatabaseQueryPageHeader } from "@/components/database-query/components";
import { QuickSuggestions } from "@/components/file-query/QuickSuggestions";
import { ReportGenerationCard } from "./ReportGenerationCard";
import { DatabaseSelector } from "@/components/selectors";
import { QueryPageTour } from "@/components/onboarding/QueryPageTour";

export function ReportGenerationContent() {
  const router = useRouter();
  const { user } = useAuthContext();
  
  // Demo mode - no actual API calls
  const [loading, setLoading] = useState(false);

  // Database selection state
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<number | null>(null);
  const [selectedDatabaseName, setSelectedDatabaseName] = useState<string>("");

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

    // Validate that a database is selected
    if (!selectedDatabaseId) {
      toast.error("Please select a database first");
      return;
    }

    if (!user?.user_id) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    // Demo mode - simulate API call
    try {
      setLoading(true);
      setCurrentQuery(query);
      setQueryInput(query);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response data for demo - annual report format
      const mockReportData = {
        title: "Annual Performance Report 2024",
        period: "January 2024 - December 2024",
        generatedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        query: query,
      };
      
      toast.success("Report generated successfully!");
      
      // Store mock result in sessionStorage for the results page
      const queryResult = {
        query: query,
        userId: user.user_id,
        timestamp: new Date().toISOString(),
        result: {
          data: mockReportData,
          model_used: model || 'gemini',
          report_type: 'annual'
        }
      };
      sessionStorage.setItem("reportGenerationResult", JSON.stringify(queryResult));
      
      // Show result overlay
      setCompletedQuery(query);
      setShowResultOverlay(true);
      setLoading(false);
    } catch (error) {
      console.error("Query failed:", error);
      toast.error("Failed to execute query. Please try again.");
      setLoading(false);
    }
  }, [user?.user_id, selectedDatabaseId]);

  const handleViewResults = useCallback(() => {
    setShowResultOverlay(false);
    router.push('/report-generation-results');
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
      background={[]}
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
          userid={user?.user_id || ""}
        />
      </div>

      {/* Database Selection Instruction */}
      {!selectedDatabaseId && !loading && !showResultOverlay && (
        <div className="px-4 sm:px-6 lg:px-32 mb-6">
          <Alert className="bg-slate-800/50 border border-green-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <AlertDescription className="text-white">
                  <span className="font-semibold text-green-400">Please select a database</span>{" "}
                  from the dropdown above to start querying. This will be the data source for all your queries.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Main Content - Full Width */}
      <div className="px-4 sm:px-6 lg:px-32 mb-16 max-sm:mb-12 sm:mb-16">
        <div className="space-y-6 max-sm:space-y-4 sm:space-y-6">
          <ReportGenerationCard
            query={queryInput}
            setQuery={setQueryInput}
            isExecuting={loading}
            onExecuteClick={(model) => handleQuerySubmit(queryInput, model)}
            hasDatabase={!!selectedDatabaseId}
            userId={user?.user_id}
            stopTypewriter={stopTypewriter}
            progress={queryProgress}
            currentStep={processingSteps[Math.min(Math.floor((queryProgress / 100) * processingSteps.length), processingSteps.length - 1)] || "Processing..."}
            databaseSelector={
              <DatabaseSelector
                selectedDatabaseId={selectedDatabaseId}
                onDatabaseSelect={(dbId, dbName) => {
                  setSelectedDatabaseId(dbId);
                  setSelectedDatabaseName(dbName);
                  toast.success(`Selected Database: ${dbName}`);
                }}
              />
            }
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

      {/* Onboarding Tour */}
      {!showResultOverlay && !loading && (
        <QueryPageTour pageType="database" />
      )}
      </div>
    </PageLayout>
  );
}
