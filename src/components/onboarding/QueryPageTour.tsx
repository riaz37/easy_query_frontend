"use client";

import React, { useState, useEffect, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step, Styles } from "react-joyride";
import { X, Sparkles, Database, FileText, Upload, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage } from "@/lib/utils/storage";

interface QueryPageTourProps {
  pageType: "database" | "file";
  onComplete?: () => void;
}

const tourStyles: Styles = {
  options: {
    primaryColor: "#13f584",
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: "16px",
    padding: 0,
    background: "linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)), linear-gradient(246.02deg, rgba(19, 245, 132, 0) 91.9%, rgba(19, 245, 132, 0.2) 114.38%), linear-gradient(59.16deg, rgba(19, 245, 132, 0) 71.78%, rgba(19, 245, 132, 0.2) 124.92%)",
    backdropFilter: "blur(20px) saturate(1.2)",
    border: "1px solid rgba(19, 245, 132, 0.2)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(19, 245, 132, 0.2), 0 0 40px rgba(19, 245, 132, 0.1)",
    maxWidth: "400px",
  },
  tooltipContainer: {
    textAlign: "left",
  },
  tooltipTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#ffffff",
    marginBottom: "8px",
  },
  tooltipContent: {
    padding: "20px",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "rgba(255, 255, 255, 0.9)",
  },
  buttonNext: {
    background: "linear-gradient(135deg, #13f584 0%, #10d977 100%)",
    color: "#000000",
    fontSize: "14px",
    fontWeight: 600,
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.2s",
    boxShadow: "0 4px 12px rgba(19, 245, 132, 0.3), 0 0 8px rgba(19, 245, 132, 0.2)",
  },
  buttonBack: {
    color: "rgba(19, 245, 132, 0.8)",
    fontSize: "14px",
    marginRight: "10px",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid rgba(19, 245, 132, 0.3)",
    backgroundColor: "rgba(19, 245, 132, 0.1)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonSkip: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "14px",
    padding: "10px 20px",
    transition: "all 0.2s",
  },
  buttonClose: {
    color: "rgba(19, 245, 132, 0.8)",
    fontSize: "20px",
    top: "10px",
    right: "10px",
    transition: "all 0.2s",
  },
  spotlight: {
    borderRadius: "12px",
    mixBlendMode: "normal",
    boxShadow: "0 0 0 4px rgba(19, 245, 132, 0.3), 0 0 20px rgba(19, 245, 132, 0.2), 0 0 40px rgba(19, 245, 132, 0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",

    pointerEvents: "none",
  },
  beacon: {
    zIndex: 10001,
  },
  beaconInner: {
    backgroundColor: "#13f584",
    border: "2px solid #13f584",
    boxShadow: "0 0 10px rgba(19, 245, 132, 0.6), 0 0 20px rgba(19, 245, 132, 0.4)",
  },
  beaconOuter: {
    border: "2px solid rgba(19, 245, 132, 0.4)",
    boxShadow: "0 0 20px rgba(19, 245, 132, 0.3)",
  },
};

const databaseQuerySteps: Step[] = [
  {
    target: '[data-tour="database-selector"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Select Your Database</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Start by selecting a database from the dropdown. This will be the data source for all your queries.
        </p>
      </div>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="query-input"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Ask Your Question</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Type your question in natural language. Our AI will automatically convert it to SQL and execute it for you.
        </p>
        <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400 italic">Example: "Show me all orders from last month"</p>
        </div>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="execute-button"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Execute Query</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Click the "Ask" button to execute your query. You'll see the generated SQL and results in a beautiful overlay.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="suggestions"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Quick Suggestions</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Click on any suggestion below to quickly try example queries. These are great starting points!
        </p>
      </div>
    ),
    placement: "top",
  },
];

const fileQuerySteps: Step[] = [
  {
    target: '[data-tour="vector-db-selector"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Select Vector DB</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Choose a Vector DB configuration to enable intelligent document search. This powers the AI's ability to understand your files.
        </p>
      </div>
    ),
    placement: "bottom",
    disableBeacon: true,
  },
  {
    target: '[data-tour="upload-button"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Upload className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Upload Your Files</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Click here to upload documents (PDF, DOCX, TXT, etc.). The AI will analyze and index them for intelligent querying.
        </p>
      </div>
    ),
    placement: "left",
  },
  {
    target: '[data-tour="query-input"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Ask About Your Documents</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Type questions about your uploaded files. The AI will search through your documents and provide intelligent answers with source references.
        </p>
        <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <p className="text-xs text-slate-400 italic">Example: "What are the main points in the document?"</p>
        </div>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="table-toggle"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Table className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Connect Database Tables</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Toggle this to combine your file data with database tables for richer, more comprehensive insights.
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="suggestions"]',
    content: (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-green-400" />
          <h3 className="text-white font-semibold text-lg">Try Example Queries</h3>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Click on any suggestion to quickly try example queries. Perfect for getting started!
        </p>
      </div>
    ),
    placement: "top",
  },
];

export function QueryPageTour({ pageType, onComplete }: QueryPageTourProps) {
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  const storageKey = `tour-completed-${pageType}-query`;

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompletedTour = storage.get(storageKey);

    if (!hasCompletedTour) {
      // Small delay to ensure page is fully rendered
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  // Add CSS for green theme button hover effects
  useEffect(() => {
    if (!runTour) return;

    const style = document.createElement('style');
    style.id = 'joyride-tour-styles';
    style.textContent = `
      /* Button hover effects */
      .react-joyride__button--next:hover {
        background: linear-gradient(135deg, #10d977 0%, #0ec86a 100%) !important;
        box-shadow: 0 6px 16px rgba(19, 245, 132, 0.4), 0 0 12px rgba(19, 245, 132, 0.3) !important;
        transform: translateY(-1px);
      }
      .react-joyride__button--back:hover {
        background: rgba(19, 245, 132, 0.2) !important;
        border-color: rgba(19, 245, 132, 0.5) !important;
        color: rgba(19, 245, 132, 1) !important;
      }
      .react-joyride__close-button:hover {
        color: rgba(19, 245, 132, 1) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('joyride-tour-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, [runTour]);

  const handleTourCallback = useCallback((data: CallBackProps) => {
    const { status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      storage.set(storageKey, "true");
      setRunTour(false);
      onComplete?.();
    }
  }, [storageKey, onComplete]);

  const handleSkipTour = useCallback(() => {
    storage.set(storageKey, "true");
    setRunTour(false);
    onComplete?.();
  }, [storageKey, onComplete]);

  const steps = pageType === "database" ? databaseQuerySteps : fileQuerySteps;

  if (!runTour) {
    return null;
  }

  return (
    <>
      <Joyride
        key={tourKey}
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleTourCallback}
        styles={tourStyles}
        locale={{
          back: "Back",
          close: "Close",
          last: "Got it!",
          next: "Next",
          skip: "Skip tour",
        }}
        floaterProps={{
          disableAnimation: false,
        }}
        spotlightClicks={false}
        disableOverlayClose={false}
        disableScrolling={false}
      />

      {/* Custom Skip Button Overlay */}
      {runTour && (
        <div className="fixed top-4 right-4 z-[10002]">
          <Button
            onClick={handleSkipTour}
            variant="ghost"
            size="sm"
            className="bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-green-400 border border-slate-600/50 hover:border-green-400/50 backdrop-blur-sm transition-all"
            style={{
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Skip Tour
          </Button>
        </div>
      )}
    </>
  );
}

