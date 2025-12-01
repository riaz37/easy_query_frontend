"use client";

import React from "react";
import { QueryResultsTable } from "./QueryResultsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface QueryResultsProps {
  data: any[] | null;
  error: string | null;
  isLoading: boolean;
}

export function QueryResults({ data, error, isLoading }: QueryResultsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Executing query...</p>
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

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No results returned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Results</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryResultsTable data={data} />
      </CardContent>
    </Card>
  );
}


