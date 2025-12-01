"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface QueryResultsProps {
  answer: string | null;
  error: string | null;
  isLoading: boolean;
}

export function QueryResults({ answer, error, isLoading }: QueryResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Processing your query...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Query Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!answer) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No answer available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground whitespace-pre-wrap">{answer}</p>
        </div>
      </CardContent>
    </Card>
  );
}


