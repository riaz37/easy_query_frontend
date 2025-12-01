"use client";

import React, { useState, useMemo } from "react";
import { QueryResultsTable } from "./QueryResultsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Table2, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicGraph } from "@/components/ai-reports/DynamicGraph";

interface QueryResultsProps {
  data: any[] | null;
  error: string | null;
  isLoading: boolean;
}

export function QueryResults({ data, error, isLoading }: QueryResultsProps) {
  const [activeTab, setActiveTab] = useState<"table" | "graph">("table");

  // Generate graph configuration from data
  const graphConfig = useMemo(() => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0] || {});
    if (columns.length === 0) return null;

    // Find numeric columns (check multiple rows to be sure)
    const numericColumns = columns.filter((col) => {
      const samples = data.slice(0, Math.min(5, data.length)).map(row => row[col]);
      return samples.some(val => typeof val === "number" || (!isNaN(Number(val)) && val !== null && val !== ""));
    });

    // Find text/category columns
    const textColumns = columns.filter((col) => {
      const sample = data[0]?.[col];
      return typeof sample === "string" || sample === null || sample === undefined;
    });

    // Determine graph type based on data
    let graphType = "bar";
    let xColumn = textColumns[0] || columns[0];
    let yColumn = numericColumns[0] || columns[1] || columns[0];

    // If we have numeric data, use bar chart
    if (numericColumns.length > 0 && textColumns.length > 0) {
      graphType = "bar";
      xColumn = textColumns[0];
      yColumn = numericColumns[0];
    } else if (numericColumns.length >= 2) {
      // If all numeric, use line chart
      graphType = "line";
      xColumn = columns[0];
      yColumn = numericColumns[0];
    } else if (textColumns.length > 0) {
      // If all text, use simple bar chart showing count per category
      graphType = "bar";
      xColumn = textColumns[0];
      // Create a count column for visualization
      yColumn = "value";
    }

    return {
      graph_type: graphType,
      column_mapping: {
        x: xColumn,
        y: yColumn,
        color: columns[2] || columns[0],
        size: columns[3] || columns[1],
      },
    };
  }, [data]);

  // Process data for graph if needed (add count for text-only data)
  const processedDataForGraph = useMemo(() => {
    if (!data || !graphConfig) return data;
    
    // If we're using "value" as y-axis (for text-only data), add count
    if (graphConfig.column_mapping.y === "value") {
      return data.map((row, index) => ({
        ...row,
        value: 1, // Simple count visualization
      }));
    }
    
    return data;
  }, [data, graphConfig]);

  // Check if graph can be displayed
  const canShowGraph = graphConfig && data && data.length > 0;

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

  const columns = Object.keys(data[0] || []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Query Results</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "table" | "graph")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Table2 className="h-4 w-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2" disabled={!canShowGraph}>
              <BarChart3 className="h-4 w-4" />
              Graph
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="mt-4">
            <QueryResultsTable data={data} columns={columns} />
          </TabsContent>
          <TabsContent value="graph" className="mt-4">
            {canShowGraph ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <DynamicGraph
                  graphData={graphConfig}
                  tableData={processedDataForGraph || data}
                  columns={columns}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Graph visualization not available for this data
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


