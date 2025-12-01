"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers";
import { ServiceRegistry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, XCircle, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { QueryResultsTable } from "@/components/database-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackgroundTaskDetail } from "@/types/api";
import { AuthenticatedRoute } from "@/components/auth";

export default function DatabaseQueryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthContext();
  const [taskDetail, setTaskDetail] = useState<BackgroundTaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = params.taskId as string;

  useEffect(() => {
    const loadTaskDetail = async () => {
      if (!taskId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await ServiceRegistry.databaseQueryBackground.getTaskStatus(taskId);

        if (response.success) {
          setTaskDetail(response.data);
        } else {
          setError(response.error || "Failed to load task details");
        }
      } catch (err) {
        console.error("Error loading task detail:", err);
        setError("Failed to load task details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTaskDetail();
  }, [taskId]);

  if (loading) {
    return (
      <AuthenticatedRoute>
        <AppLayout title="Query History" description="Loading task details...">
          <div className="text-center py-12">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Loading task details...</p>
          </div>
        </AppLayout>
      </AuthenticatedRoute>
    );
  }

  if (error || !taskDetail) {
    return (
      <AuthenticatedRoute>
        <AppLayout title="Query History" description="Error loading task">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-foreground text-lg font-medium mb-2">
                Error Loading Task Details
              </h3>
              <p className="text-destructive mb-4">{error || "Task not found"}</p>
              <Button onClick={() => router.push("/history")}>Back to History</Button>
            </CardContent>
          </Card>
        </AppLayout>
      </AuthenticatedRoute>
    );
  }

  const queryData = taskDetail.result?.payload?.data || [];
  const columns = queryData.length > 0 ? Object.keys(queryData[0]) : [];

  return (
    <AuthenticatedRoute>
      <AppLayout title="Query History" description={`Task: ${taskId}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/history")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Query: {taskDetail.question || "N/A"}</CardTitle>
            </CardHeader>
            <CardContent>
              {queryData.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No data available</p>
                </div>
              ) : (
                <QueryResultsTable data={queryData} columns={columns} />
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthenticatedRoute>
  );
}


