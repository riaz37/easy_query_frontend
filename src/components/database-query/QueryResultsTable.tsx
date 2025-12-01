"use client";

import React from "react";

interface QueryResultsTableProps {
  data: any[];
  columns?: string[];
}

export function QueryResultsTable({ data, columns }: QueryResultsTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No data to display
      </div>
    );
  }

  // Extract columns from first row if not provided
  const tableColumns = columns || (data.length > 0 ? Object.keys(data[0]) : []);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            {tableColumns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-sm font-semibold text-foreground bg-muted/50"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-border hover:bg-muted/30 transition-colors"
            >
              {tableColumns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {row[col] !== null && row[col] !== undefined
                    ? String(row[col])
                    : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


