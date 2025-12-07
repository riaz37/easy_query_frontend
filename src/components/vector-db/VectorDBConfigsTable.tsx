"use client";

import React from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { VectorDBConfig } from "@/lib/api/services/vector-db-service";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

interface VectorDBConfigsTableProps {
  configs: VectorDBConfig[];
  loading: boolean;
  onEdit: (config: VectorDBConfig) => void;
  onDelete: (config: VectorDBConfig) => void;
}

export function VectorDBConfigsTable({
  configs,
  loading,
  onEdit,
  onDelete,
}: VectorDBConfigsTableProps) {
  const columns: ColumnDef<VectorDBConfig>[] = React.useMemo(
    () => [
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
          <div className="font-medium text-white font-barlow">
            {row.original.db_config?.DB_NAME || "Unknown"}
          </div>
        ),
      },
      {
        accessorKey: "db_config.DB_HOST",
        header: "Host",
        cell: ({ row }) => (
          <div className="text-gray-400 font-public-sans">
            {row.original.db_config?.DB_HOST || "-"}
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
      {
        id: "actions",
        cell: ({ row }) => {
          const config = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-white/5"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-[#1a1f2e] border-white/10 text-white"
              >
                <DropdownMenuLabel className="text-white font-barlow">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onEdit(config)}
                  className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-white"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Configuration
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => onDelete(config)}
                  className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                >
                  <Trash2 className="mr-2 h-4 w-4 text-red-400" />
                  Delete Config
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  return <DataTable columns={columns} data={configs} loading={loading} />;
}

