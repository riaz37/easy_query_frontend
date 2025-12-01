"use client";

import React, { useState } from "react";
import { AuthenticatedRoute } from "@/components/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConfigSelector, QueryInput, QueryResults, FileUpload } from "@/components/file-query";
import { fileService } from "@/lib/api/services/file-service";
import { toast } from "sonner";
import { useAuthContext, useFileConfigContext } from "@/components/providers";

export default function FileQueryPage() {
  const { user } = useAuthContext();
  const { currentConfigId } = useFileConfigContext();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (!currentConfigId) {
      toast.error("Please select a file config");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setAnswer(null);

    try {
      const response = await fileService.searchFiles({
        query: query.trim(),
        config_id: currentConfigId,
        user_id: user?.user_id,
        answer_style: "detailed",
      });

      if (response.success && response.data) {
        // Extract answer from response
        const answerData = response.data.answer || response.data.result?.answer;
        if (answerData) {
          const answerText =
            typeof answerData === "string"
              ? answerData
              : answerData.answer || JSON.stringify(answerData, null, 2);
          setAnswer(answerText);
          toast.success("Query executed successfully");
        } else {
          setError("No answer returned from query");
          toast.error("No answer returned");
        }
      } else {
        const errorMessage = response.error || "Query execution failed";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AuthenticatedRoute
      authRequiredMessage="Please log in to use the file query feature."
    >
      <AppLayout title="File Query" description="Query your uploaded files with AI">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">File Query</h1>
            <p className="text-muted-foreground">
              Ask questions about your uploaded files using natural language
            </p>
          </div>

          <ConfigSelector />

          <FileUpload />

          <QueryInput
            query={query}
            setQuery={setQuery}
            isExecuting={isExecuting}
            onExecute={handleExecute}
            disabled={!currentConfigId}
          />

          <QueryResults
            answer={answer}
            error={error}
            isLoading={isExecuting}
          />
        </div>
      </AppLayout>
    </AuthenticatedRoute>
  );
}


