"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Edit,
} from "lucide-react";
import { ReportDeleteIcon } from "@/components/ui/icons/ReportDeleteIcon";
import { useTheme } from "@/store/theme-store";
import { cn } from "@/lib/utils";
import { UserAccessData, UserConfig } from "../types";
import { UserRowSkeleton } from "@/components/ui/loading";

interface UsersTableSectionProps {
  // Header props
  activeTab: string;
  onTabChange: (tab: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateMSSQLAccess: () => void;
  onCreateVectorDBAccess: () => void;
  isDark: boolean;
  // Table props
  users: UserAccessData[] | UserConfig[];
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  extractNameFromEmail: (email: string) => string;
  getAccessLevelBadge: (config: UserAccessData | UserConfig) => React.ReactNode;
  getDatabaseCount?: (config: UserAccessData) => number;
  getDatabaseName?: (dbId: number) => string;
  formatTableNames?: (tableNames: string[]) => string;
  type?: "mssql" | "vector";
  // Loading props
  isLoading?: boolean;
}

export function UsersTableSection({
  // Header props
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onCreateMSSQLAccess,
  onCreateVectorDBAccess,
  isDark,
  // Table props
  users,
  onEditUser,
  onDeleteUser,
  extractNameFromEmail,
  getAccessLevelBadge,
  getDatabaseCount,
  getDatabaseName,
  formatTableNames,
  type = "mssql",
  // Loading props
  isLoading = false,
}: UsersTableSectionProps) {
  const theme = useTheme();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  const isMSSQL = type === "mssql";

  // Check if table is scrollable
  useEffect(() => {
    const checkScrollability = () => {
      if (tableWrapperRef.current) {
        const { scrollWidth, clientWidth } = tableWrapperRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };

    const handleScroll = () => {
      setIsScrolling(true);
      // Hide scrolling state after 2 seconds of no scrolling
      setTimeout(() => setIsScrolling(false), 2000);
    };

    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    
    const tableWrapper = tableWrapperRef.current;
    if (tableWrapper) {
      tableWrapper.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      window.removeEventListener('resize', checkScrollability);
      if (tableWrapper) {
        tableWrapper.removeEventListener('scroll', handleScroll);
      }
    };
  }, [users, isLoading]);

  // Helper function to format date as "Sep 24, 2025"
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
      };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      return "N/A";
    }
  };

  // Process actual user data based on the real data structures
  const processedUsers = users.map((user) => {
    if (isMSSQL) {
      const mssqlUser = user as any; // UserAccessData type
      // For RBAC system, get database count from db_ids array
      const dbIds = mssqlUser.db_ids || [];
      return {
        id: mssqlUser.user_id,
        email: mssqlUser.user_id,
        date: formatDate(mssqlUser.created_at),
        accessLevel: "Full Access", // MSSQL users typically have full access
        databaseCount: dbIds.length || getDatabaseCount?.(mssqlUser) || 0,
        databaseName: "N/A", // Not applicable for MSSQL
        tableNames:
          dbIds.length > 0
            ? `${dbIds.length} database(s)`
            : "No databases",
        originalUser: mssqlUser,
      };
    } else {
      const vectorUser = user as any; // UserConfigData type
      return {
        id: vectorUser.user_id,
        email: vectorUser.user_id,
        date: formatDate(vectorUser.created_at),
        accessLevel: `Level ${vectorUser.access_level}`,
        databaseCount: 0, // Not applicable for Vector DB
        databaseName:
          getDatabaseName?.(vectorUser.db_id) || `DB ${vectorUser.db_id}`,
        tableNames:
          vectorUser.table_names?.length > 0
            ? `${vectorUser.table_names.length} tables`
            : "No tables",
        originalUser: vectorUser,
      };
    }
  });

  const totalPages = Math.ceil(processedUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentUsers = processedUsers.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(currentUsers.map((user) => user.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ChevronDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronDown className="h-4 w-4 text-white" />
    ) : (
      <ChevronDown className="h-4 w-4 text-white rotate-180" />
    );
  };

  return (
    <div className="modal-enhanced">
      <div className="modal-content-enhanced users-table-container users-table-full-height">
        {/* Header Section */}
        <div className="p-6">
          {/* Tabs */}
          <div className="users-tabs">
            <button
              onClick={() => onTabChange("mssql")}
              className={cn("users-tab", activeTab === "mssql" && "active")}
            >
              Mssql database access
            </button>
            <button
              onClick={() => onTabChange("vector")}
              className={cn("users-tab", activeTab === "vector" && "active")}
            >
              Vector database access
            </button>
          </div>

          {/* Action Bar */}
          <div className="users-action-bar">
            {/* Search Input */}
            <div className="users-search-container">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="users-search-input"
              />
            </div>

            {/* Action Buttons */}
            <div className="users-action-buttons">
              <button className="users-action-button">
                <img
                  src="/tables/download.svg"
                  alt="Download"
                  className="w-6 h-6"
                />
              </button>
              <button className="users-action-button">
                <img
                  src="/tables/filter.svg"
                  alt="Filter"
                  className="w-6 h-6"
                />
              </button>
              <button
                onClick={
                  activeTab === "mssql"
                    ? onCreateMSSQLAccess
                    : onCreateVectorDBAccess
                }
                className="users-action-button"
              >
                <img
                  src="/tables/adduser.svg"
                  alt="Add User"
                  className="w-6 h-6"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div 
          ref={tableWrapperRef}
          className={cn(
            "users-table-wrapper px-6 pb-6",
            isScrollable && "scrollable",
            isScrolling && "scrolling"
          )}
        >
          <div className="rounded-t-xl">
            <table className="users-table">
              <thead>
                <tr className="bg-gray-500/8 rounded-t-xl">
                  <th className="px-6 py-4 text-left rounded-tl-xl">
                    <Checkbox
                      checked={
                        selectedRows.size === currentUsers.length &&
                        currentUsers.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      style={{
                        backgroundColor: selectedRows.size === currentUsers.length && currentUsers.length > 0
                          ? "var(--primary-main, rgba(19, 245, 132, 1))"
                          : "transparent",
                        borderColor:
                          "var(--action-active, rgba(145, 158, 171, 1))",
                        borderWidth: "1px",
                      }}
                    />
                  </th>
                  <th
                    className="px-6 py-4 text-left cursor-pointer"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                      User ID
                    </div>
                  </th>
                  {isMSSQL ? (
                    <>
                      <th
                        className="px-6 py-4 text-left cursor-pointer"
                        onClick={() => handleSort("databaseCount")}
                      >
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          Databases
                        </div>
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="px-6 py-4 text-left cursor-pointer"
                        onClick={() => handleSort("databaseName")}
                      >
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          Database
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer"
                        onClick={() => handleSort("accessLevel")}
                      >
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          Access level
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left cursor-pointer"
                        onClick={() => handleSort("tableNames")}
                      >
                        <div className="flex items-center gap-2 text-white font-medium text-sm">
                          Tables
                        </div>
                      </th>
                    </>
                  )}
                  <th
                    className="px-6 py-4 text-left cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-2 text-white font-medium text-sm">
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-white font-medium text-sm rounded-tr-xl">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Show skeleton rows when loading
                  Array.from({ length: 5 }).map((_, index) => (
                    <UserRowSkeleton
                      key={`skeleton-row-${index}`}
                      isMSSQL={isMSSQL}
                      showCheckbox={true}
                      showActions={true}
                    />
                  ))
                ) : currentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isMSSQL ? 5 : 7}
                      className="px-6 py-12 text-center"
                      style={{ 
                        display: 'table-cell',
                        width: '100%',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-32">
                        <span className="text-white/70 text-lg font-medium">No users found</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedRows.has(user.id)}
                          onCheckedChange={(checked) =>
                            handleSelectRow(user.id, checked as boolean)
                          }
                          style={{
                            backgroundColor: selectedRows.has(user.id)
                              ? "var(--primary-main, rgba(19, 245, 132, 1))"
                              : "transparent",
                            borderColor:
                              "var(--action-active, rgba(145, 158, 171, 1))",
                            borderWidth: "1px",
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 text-white font-medium">
                        {user.email}
                      </td>
                      {isMSSQL ? (
                        <>
                          <td className="px-6 py-4 text-white">
                            {user.databaseCount}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-white">
                            {user.databaseName}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {user.accessLevel}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {user.tableNames}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-white">{user.date}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditUser(user.id)}
                            className="text-white hover:bg-white/10"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteUser(user.id)}
                            className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
                            title="Delete user"
                          >
                            <ReportDeleteIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination and Selection Status */}
        <div className="users-pagination">
          {/* Left: Rows Selected */}
          <div className="users-pagination-info">
            {selectedRows.size} of {processedUsers.length} Row(s) Selected
          </div>

          {/* Right side: Rows per page and Page Info */}
          <div className="users-pagination-controls">
            {/* Rows per page */}
            <div className="users-rows-selector">
              <span className="text-white text-sm">Rows per page:</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => setRowsPerPage(Number(value))}
              >
                  <SelectTrigger
                    className="bg-white/10 text-white px-2 py-1 text-sm focus:outline-none focus:ring-0 focus:border-0 focus:shadow-none"
                    style={{
                      outline: "none !important",
                      borderRadius: "99px",
                      width: "auto",
                      minWidth: "60px",
                      border: "1px solid rgba(145, 158, 171, 0.32)",
                      boxShadow: "none",
                    }}
                  >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="modal-select-content-enhanced">
                  <SelectItem value="5" className="dropdown-item">
                    5
                  </SelectItem>
                  <SelectItem value="10" className="dropdown-item">
                    10
                  </SelectItem>
                  <SelectItem value="25" className="dropdown-item">
                    25
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Page Info and Controls */}
            <div className="users-page-controls">
              <span className="text-white text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="users-page-button"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="users-page-button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="users-page-button"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="users-page-button"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
