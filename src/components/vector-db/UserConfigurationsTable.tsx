"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { UserConfig } from "@/lib/api/services/vector-db-service";

interface UserConfigurationsTableProps {
  configs: UserConfig[];
  loading: boolean;
}

export function UserConfigurationsTable({
  configs,
  loading,
}: UserConfigurationsTableProps) {
  const columns: ColumnDef<UserConfig>[] = React.useMemo(
    () => [
      {
        accessorKey: "config_id",
        header: "Config ID",
        cell: ({ row }) => (
          <div className="text-gray-400 font-public-sans">
            #{row.getValue("config_id")}
          </div>
        ),
      },
      {
        accessorKey: "user_id",
        header: "User ID",
        cell: ({ row }) => (
          <div className="font-medium text-white font-barlow">
            {row.getValue("user_id")}
          </div>
        ),
      },
      {
        accessorKey: "db_id",
        header: "DB ID",
        cell: ({ row }) => (
          <div className="text-gray-400 font-public-sans">
            #{row.getValue("db_id")}
          </div>
        ),
      },
      {
        accessorKey: "db_config.DB_NAME",
        header: "Database Name",
        cell: ({ row }) => (
          <div className="text-gray-200 font-public-sans">
            {row.original.db_config?.DB_NAME || "-"}
          </div>
        ),
      },
      {
        accessorKey: "access_level",
        header: "Access Level",
        cell: ({ row }) => (
          <div className="text-gray-200 font-public-sans">
            <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">
              Level {row.getValue("access_level")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "table_names",
        header: "Folders",
        cell: ({ row }) => {
          const folders = row.original.table_names || [];
          return (
            <div className="text-gray-200 font-public-sans">
              {folders.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {folders.slice(0, 3).map((folder, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded bg-white/5 text-xs"
                    >
                      {folder}
                    </span>
                  ))}
                  {folders.length > 3 && (
                    <span className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400">
                      +{folders.length - 3} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-500">No folders</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "is_latest",
        header: "Status",
        cell: ({ row }) => (
          <div className="text-gray-200 font-public-sans">
            {row.original.is_latest ? (
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs">
                Active
              </span>
            ) : (
              <span className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs">
                Inactive
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        cell: ({ row }) => {
          const date = row.getValue("updated_at") as string;
          return (
            <div className="text-gray-400 font-public-sans">
              {date ? new Date(date).toLocaleDateString() : "-"}
            </div>
          );
        },
      },
    ],
    []
  );

  return <DataTable columns={columns} data={configs} loading={loading} />;
}

