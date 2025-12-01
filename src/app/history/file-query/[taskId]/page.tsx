"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers";
import { ServiceRegistry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, XCircle, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { AppLayout } from "@/components/layout/AppLayout";
import { BackgroundTaskDetail } from "@/types/api";
import { AuthenticatedRoute } from "@/components/auth";

export default function FileQueryDetailPage() {
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

        const response = await ServiceRegistry.fileQueryBackground.getTaskStatus(taskId);

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

  const extractAnswer = (result: any): string | null => {
    if (!result) return null;

    if (typeof result === "string") return result;

    if (result.answer) {
      if (typeof result.answer === "string") return result.answer;
      if (result.answer.answer) return result.answer.answer;
    }

    if (result.result?.answer) {
      if (typeof result.result.answer === "string") return result.result.answer;
      if (result.result.answer.answer) return result.result.answer.answer;
    }

    return JSON.stringify(result, null, 2);
  };

  if (loading) {
    return (
      <AuthenticatedRoute>
        <AppLayout title="File Query Results" description="Loading file query results...">
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        </AppLayout>
      </AuthenticatedRoute>
    );
  }

  if (error || !taskDetail) {
    return (
      <AuthenticatedRoute>
        <AppLayout title="File Query Results" description="Error loading file query results">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-foreground text-lg font-medium mb-2">
                Error Loading File Query Task
              </h3>
              <p className="text-destructive mb-4">{error || "Task not found"}</p>
              <Button onClick={() => router.push("/history")}>Back to History</Button>
            </CardContent>
          </Card>
        </AppLayout>
      </AuthenticatedRoute>
    );
  }

  const answer = extractAnswer(taskDetail.result);

  return (
    <AuthenticatedRoute>
      <AppLayout title="File Query Results" description={`Task: ${taskId}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/history")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to History
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Query: {taskDetail.query || taskDetail.question || "N/A"}</CardTitle>
            </CardHeader>
            <CardContent>
              {!answer ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No answer available</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthenticatedRoute>
  );
}


