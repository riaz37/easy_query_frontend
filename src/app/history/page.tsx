"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Database } from "lucide-react";
import { ReportResults } from "@/types/reports";
import { generateAndDownloadPDF } from "@/lib/utils/smart-pdf-generator";
import { 
  PaginatedReportList, 
  DatabaseQueryTaskList,
  FileQueryTaskList
} from "@/components/ai-reports";
import { AuthenticatedRoute } from "@/components/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";

type TabType = "reports" | "database-query" | "file-query";

function HistoryPageContent() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>("reports");

  const handleViewReport = (taskId: string, results: ReportResults) => {
    router.push(`/history/report/${taskId}`);
  };

  const handleDownloadReport = async (taskId: string, results: ReportResults) => {
    try {
      await generateAndDownloadPDF(
        results,
        `AI_Report_${taskId.substring(0, 8)}_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };


  return (
    <AppLayout 
      title="History" 
      description="View and manage your completed AI-generated reports and database query results"
    >

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="users-tabs">
          <button
            onClick={() => setActiveTab("reports")}
            className={cn("users-tab", activeTab === "reports" && "active")}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("database-query")}
            className={cn("users-tab", activeTab === "database-query" && "active")}
          >
            Database Queries
          </button>
          <button
            onClick={() => setActiveTab("file-query")}
            className={cn("users-tab", activeTab === "file-query" && "active")}
          >
            File Queries
          </button>
        </div>

        {activeTab === "reports" ? (
          <PaginatedReportList
            onViewReport={handleViewReport}
            onDownloadReport={handleDownloadReport}
          />
        ) : activeTab === "database-query" ? (
          <DatabaseQueryTaskList
            onViewTask={() => {}} // Not used anymore since we navigate directly
          />
        ) : (
          <FileQueryTaskList
            onViewTask={() => {}} // Not used anymore since we navigate directly
          />
        )}
      </div>
    </AppLayout>
  );
}

export default function HistoryPage() {
  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to view your query history and reports."
    >
      <HistoryPageContent />
    </AuthenticatedRoute>
  );
}