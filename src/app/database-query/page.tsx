"use client";

import React, { useState } from "react";
import { AuthenticatedRoute } from "@/components/auth";
import { AppLayout } from "@/components/layout/AppLayout";
import { DatabaseSelector, QueryInput, QueryResults } from "@/components/database-query";
import { ServiceRegistry } from "@/lib/api";
import { toast } from "sonner";
import { useAuthContext } from "@/components/providers";

export default function DatabaseQueryPage() {
  const { user } = useAuthContext();
  const [query, setQuery] = useState("");
  const [selectedDbId, setSelectedDbId] = useState<number | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    if (!selectedDbId) {
      toast.error("Please select a database");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResults(null);

    try {
      const response = await ServiceRegistry.query.query({
        question: query,
        db_id: selectedDbId,
        userId: user?.user_id,
      });

      if (response.success && response.data) {
        const data = response.data.results || response.data.data || [];
        setResults(Array.isArray(data) ? data : [data]);
        toast.success("Query executed successfully");
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
      authRequiredMessage="Please log in to access database query features."
    >
      <AppLayout title="Database Query" description="Execute SQL queries on your databases">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Database Query</h1>
            <p className="text-muted-foreground">
              Execute SQL queries on your selected database
            </p>
          </div>

          <DatabaseSelector
            value={selectedDbId}
            onValueChange={setSelectedDbId}
          />

          <QueryInput
            query={query}
            setQuery={setQuery}
            isExecuting={isExecuting}
            onExecute={handleExecute}
            disabled={!selectedDbId}
          />

          <QueryResults
            data={results}
            error={error}
            isLoading={isExecuting}
          />
        </div>
      </AppLayout>
    </AuthenticatedRoute>
  );
}


