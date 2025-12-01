"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  XIcon,
  Columns,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Table as TableIcon,
} from "lucide-react";
import { UserTablesResponse, UserTable } from "@/types/api";
import { useNewTable } from "@/lib/hooks/use-new-table";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface YourTablesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
  onRefresh: () => void;
  onCreateTable: () => void;
}

type SortableColumn = "table_name" | "full_name" | "schema_name" | "columns";

export function YourTablesModal({
  open,
  onOpenChange,
  userId,
  onRefresh,
  onCreateTable,
}: YourTablesModalProps) {
  const [userTables, setUserTables] = useState<UserTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [tableLoadError, setTableLoadError] = useState<string | null>(null);
  const [lastTablesUpdate, setLastTablesUpdate] = useState<Date | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const { getUserTables } = useNewTable();

  // Transform user table data with memoization
  const transformedTables = useMemo(() => {
    return userTables.map(table => ({
      table_name: table.table_name,
      full_name: table.table_full_name,
      schema_name: table.schema_name || 'dbo',
      columns: table.table_schema?.columns?.map(col => ({
        column_name: col.name,
        data_type: col.type,
        is_nullable: !col.is_required,
        is_primary: col.is_primary || false,
        is_foreign: col.is_foreign || false,
        max_length: col.max_length || null,
      })) || []
    }));
  }, [userTables]);

  // Sort tables with memoization
  const sortedTables = useMemo(() => {
    if (!sortColumn) return transformedTables;

    return [...transformedTables].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortColumn) {
        case "columns":
          aValue = a.columns.length;
          bValue = b.columns.length;
          break;
        default:
          aValue = a[sortColumn] || "";
          bValue = b[sortColumn] || "";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [transformedTables, sortColumn, sortDirection]);

  // Pagination with memoization
  const paginatedData = useMemo(() => {
    const totalPages = Math.ceil(sortedTables.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentTables = sortedTables.slice(startIndex, endIndex);

    return { totalPages, currentTables };
  }, [sortedTables, currentPage, rowsPerPage]);

  // Fetch user tables from API
  const fetchUserTables = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setTableLoadError(null);
    try {
      console.log("Loading user tables for userId:", userId);
      const response = await getUserTables(userId);
      console.log("User tables response:", response);
      
      if (response && response.tables && Array.isArray(response.tables)) {
        setUserTables(response.tables);
        setLastTablesUpdate(new Date());
        
        if (response.tables.length > 0) {
          toast.success(`Loaded ${response.tables.length} user table(s)`);
        } else {
          toast.info('No user tables found');
        }
      } else {
        console.warn('Invalid response structure:', response);
        toast.error('Invalid response structure from server');
      }
    } catch (error) {
      console.error('Failed to fetch user tables:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user tables';
      setTableLoadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, getUserTables]);

  // Fetch user tables on component mount
  useEffect(() => {
    if (open && userId) {
      fetchUserTables();
    }
  }, [open, userId, fetchUserTables]);

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [sortedTables.length, rowsPerPage]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.currentTables.map(table => table.table_name)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData.currentTables]);

  const handleSelectRow = useCallback((tableName: string, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(tableName);
      } else {
        newSelected.delete(tableName);
      }
      return newSelected;
    });
  }, []);

  const handleSort = useCallback((column: SortableColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }, [sortColumn]);

  const getSortIcon = useCallback((column: SortableColumn) => {
    if (sortColumn !== column) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" 
      ? <ChevronDown className="h-4 w-4 text-white" />
      : <ChevronDown className="h-4 w-4 text-white rotate-180" />;
  }, [sortColumn, sortDirection]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleRowsPerPageChange = useCallback((value: number) => {
    setRowsPerPage(value);
    setCurrentPage(1);
  }, []);

  const handleCreateTableClick = useCallback(() => {
    onOpenChange(false);
    onCreateTable();
  }, [onOpenChange, onCreateTable]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-0 bg-transparent modal-xl" 
        showCloseButton={false}
      >
        <div className="modal-enhanced">
          <div className="modal-content-enhanced">
            <DialogHeader className="modal-header-enhanced px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-2 sm:pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <DialogTitle className="modal-title-enhanced text-lg sm:text-xl">
                    Your Database Tables
                  </DialogTitle>
                  <p className="modal-description-enhanced text-xs sm:text-sm">
                    View and manage all your created database tables
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onOpenChange(false)}
                  className="modal-close-button cursor-pointer"
                >
                  <XIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 overflow-y-auto">
              {/* Error Display */}
                {tableLoadError && (
                <Alert className="mb-6 border-red-500/50 bg-red-900/20">
                    <AlertDescription className="text-red-300">
                      {tableLoadError}
                    </AlertDescription>
                  </Alert>
                )}

              {/* Loading State */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4" />
                    <p className="text-slate-400">Loading tables...</p>
                  </div>
                </div>
              ) : transformedTables.length === 0 ? (
                <div className="text-center py-12">
                  <TableIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">
                    No tables created yet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Create your first table to get started
                  </p>
                  <Button
                    onClick={handleCreateTableClick}
                    className="modal-button-primary cursor-pointer"
                  >
                      <Plus className="h-4 w-4 mr-2" />
                    Create Table
                    </Button>
                </div>
              ) : (
                <div className="modal-table-responsive">
                  <div className="rounded-t-xl overflow-hidden">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="bg-slate-700/8 rounded-t-xl">
                          <th className="px-3 sm:px-6 py-4 text-left rounded-tl-xl w-12">
                            <Checkbox
                              checked={selectedRows.size === paginatedData.currentTables.length && paginatedData.currentTables.length > 0}
                              onCheckedChange={handleSelectAll}
                              className={`${
                                selectedRows.size === paginatedData.currentTables.length && paginatedData.currentTables.length > 0
                                  ? "bg-green-400 border-green-400"
                                  : "bg-transparent border-slate-500"
                              } border`}
                            />
                          </th>
                          <th 
                            className="px-3 sm:px-6 py-4 text-left cursor-pointer min-w-[120px]"
                            onClick={() => handleSort("table_name")}
                          >
                            <div className="flex items-center gap-2 text-white font-medium text-sm">
                              <span className="truncate">Table Name</span>
                            </div>
                          </th>
                          <th 
                            className="px-3 sm:px-6 py-4 text-left cursor-pointer min-w-[150px] hidden sm:table-cell"
                            onClick={() => handleSort("full_name")}
                          >
                            <div className="flex items-center gap-2 text-white font-medium text-sm">
                              <span className="truncate">Full Name</span>
                            </div>
                          </th>
                          <th 
                            className="px-3 sm:px-6 py-4 text-left cursor-pointer min-w-[80px]"
                            onClick={() => handleSort("schema_name")}
                          >
                            <div className="flex items-center gap-2 text-white font-medium text-sm">
                              <span className="truncate">Schema</span>
                            </div>
                          </th>
                          <th 
                            className="px-3 sm:px-6 py-4 text-left cursor-pointer min-w-[80px] hidden md:table-cell"
                            onClick={() => handleSort("columns")}
                          >
                            <div className="flex items-center gap-2 text-white font-medium text-sm">
                              <span className="truncate">Columns</span>
                            </div>
                          </th>
                          <th className="px-3 sm:px-6 py-4 text-right text-white font-medium text-sm rounded-tr-xl w-20">
                            <span className="truncate">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.currentTables.map((table) => (
                          <tr 
                            key={table.table_name} 
                            className="border-b border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="px-3 sm:px-6 py-4">
                              <Checkbox
                                checked={selectedRows.has(table.table_name)}
                                onCheckedChange={(checked) => handleSelectRow(table.table_name, checked as boolean)}
                                className={`${
                                  selectedRows.has(table.table_name)
                                    ? "bg-green-400 border-green-400"
                                    : "bg-transparent border-slate-500"
                                } border`}
                              />
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-white font-medium min-w-[120px]">
                              <div className="truncate" title={table.table_name}>
                                {table.table_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-white min-w-[150px] hidden sm:table-cell">
                              <div className="truncate font-mono text-sm" title={table.full_name}>
                                {table.full_name}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-white min-w-[80px]">
                              <Badge 
                                className="bg-gray-800/50 text-white px-2 py-1 rounded-lg text-xs truncate"
                                title={table.schema_name}
                              >
                                {table.schema_name}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-white min-w-[80px] hidden md:table-cell">
                              <Badge 
                                className="px-2 py-1 rounded-lg text-xs bg-green-400/8 text-green-400 truncate"
                                title={`${table.columns.length} columns`}
                              >
                                {table.columns.length} cols
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-6 py-4 text-right w-20">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/10 transition-colors duration-200 h-8 w-8"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                  align="end" 
                                  className="w-48 modal-select-content-enhanced border-emerald-500/20"
                                >
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedTable(table.table_name);
                                      toast.info(`Viewing table: ${table.table_name}`);
                                    }}
                                    className="dropdown-item text-white hover:bg-emerald-500/10 cursor-pointer transition-colors duration-200"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Table
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      toast.info(`Editing table: ${table.table_name}`);
                                    }}
                                    className="dropdown-item text-white hover:bg-emerald-500/10 cursor-pointer transition-colors duration-200"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Table
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-emerald-500/20" />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      toast.info(`Deleting table: ${table.table_name}`);
                                    }}
                                    className="dropdown-item text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors duration-200"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Table
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination and Selection Status */}
                  <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    {/* Left: Rows Selected */}
                    <div className="flex items-center">
                      <p className="text-white text-sm">
                        <span className="hidden sm:inline">{selectedRows.size} of {transformedTables.length} Row(s) Selected</span>
                        <span className="sm:hidden">{selectedRows.size}/{transformedTables.length} Selected</span>
                      </p>
                    </div>

                    {/* Right side: Pagination controls */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                      {/* Rows per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm hidden sm:inline">Rows per page:</span>
                        <span className="text-white text-sm sm:hidden">Per page:</span>
                        <Select
                          value={rowsPerPage.toString()}
                          onValueChange={(value) => handleRowsPerPageChange(Number(value))}
                        >
                          <SelectTrigger
                            className="bg-white/10 text-white px-2 py-1 text-sm focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none rounded-full w-auto min-w-[60px] border border-slate-500/32"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="modal-select-content-enhanced w-16">
                            <SelectItem value="5" className="dropdown-item">5</SelectItem>
                            <SelectItem value="10" className="dropdown-item">10</SelectItem>
                            <SelectItem value="25" className="dropdown-item">25</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Page Info and Controls */}
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className="text-white text-sm whitespace-nowrap">
                          Page {currentPage} of {paginatedData.totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-50"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === paginatedData.totalPages}
                            className="h-8 w-8 text-white hover:bg-white/10 disabled:opacity-50"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}