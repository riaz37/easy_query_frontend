"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/components/providers';
import { ServiceRegistry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Calendar,
  User,
  Database,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format, isValid, parseISO } from 'date-fns';
import { EasyQueryBrandLoader, ReportListSkeleton } from '@/components/ui/loading';

interface ReportTask {
  task_id: string;
  user_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: string;
  current_step: string;
  total_queries: number;
  processed_queries: number;
  successful_queries: number;
  failed_queries: number;
  created_at: string;
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  results?: any;
  error?: string;
  user_query?: string;
}

interface PaginatedReportListProps {
  onViewReport: (taskId: string, results: any) => void;
  onDownloadReport: (taskId: string, results: any) => void;
}

// Utility function to format timestamps safely
const formatTimestamp = (timestamp: string | undefined | null) => {
  if (!timestamp) return { relative: 'Unknown', absolute: '', raw: 'No timestamp' };
  
  try {
    // Try to parse the timestamp
    const date = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    
    if (!isValid(date)) {
      console.warn('Invalid timestamp:', timestamp);
      return { relative: 'Invalid date', absolute: '', raw: timestamp };
    }
    
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, 'MMM dd, yyyy HH:mm'),
      raw: timestamp
    };
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error);
    return { relative: 'Invalid date', absolute: '', raw: timestamp };
  }
};

export function PaginatedReportList({ onViewReport, onDownloadReport }: PaginatedReportListProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const limit = 20; // Load more tasks to ensure we have enough completed ones
  const offset = currentPage * limit;

  // Load tasks from backend
  const loadTasks = useCallback(async (page: number = 0) => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await ServiceRegistry.reports.getUserTasks(
        user.user_id, 
        limit, 
        page * limit
      );
      
      setTasks(response.tasks);
      setTotalTasks(response.total);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, limit]);

  // Load tasks on mount and when user changes
  useEffect(() => {
    loadTasks(currentPage);
  }, [loadTasks, currentPage]);

  // Filter completed tasks for display
  const completedTasks = tasks.filter(task => task.status === 'completed');
  
  // Calculate pagination for completed tasks only
  const completedTasksPerPage = 5;
  const startIndex = currentPage * completedTasksPerPage;
  const endIndex = startIndex + completedTasksPerPage;
  const paginatedCompletedTasks = completedTasks.slice(startIndex, endIndex);
  const hasMoreCompleted = endIndex < completedTasks.length;

  // Refresh tasks
  const handleRefresh = useCallback(() => {
    loadTasks(currentPage);
  }, [loadTasks, currentPage]);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (hasMoreCompleted) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMoreCompleted]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Show delete confirmation dialog
  const handleDeleteClick = useCallback((taskId: string) => {
    setTaskToDelete(taskId);
    setShowDeleteDialog(true);
  }, []);

  // Confirm delete task handler
  const handleConfirmDelete = useCallback(async () => {
    if (!taskToDelete || !user?.user_id) return;

    try {
      setDeletingTaskId(taskToDelete);
      await ServiceRegistry.reports.deleteReportTask(taskToDelete);
      
      // Remove the task from the local state
      setTasks(prevTasks => prevTasks.filter(task => task.task_id !== taskToDelete));
      console.log('Report task deleted successfully');
    } catch (error) {
      console.error('Error deleting report task:', error);
      alert('Failed to delete report task. Please try again.');
    } finally {
      setDeletingTaskId(null);
      setShowDeleteDialog(false);
      setTaskToDelete(null);
    }
  }, [taskToDelete, user?.user_id]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setShowDeleteDialog(false);
    setTaskToDelete(null);
  }, []);

  const handleViewReport = (task: ReportTask) => {
    setSelectedTask(task.task_id);
    if (task.results) {
      onViewReport(task.task_id, task.results);
    } else {
      // Navigate to task detail page if no results in list
      router.push(`/history/report/${task.task_id}`);
    }
  };

  const handleDownloadReport = (task: ReportTask) => {
    if (task.results) {
      onDownloadReport(task.task_id, task.results);
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <ReportListSkeleton 
        reportCount={5}
        showActions={true}
        showPagination={true}
        size="md"
      />
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-500/30">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-white text-lg font-medium mb-2">
            Error Loading Reports
          </h3>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="border-red-500 text-red-300 hover:bg-red-900/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <div className="modal-enhanced">
        <div className="modal-content-enhanced ai-reports-full-height">
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center justify-center h-32">
              <span className="text-white/70 text-lg font-medium">No Completed Reports</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-enhanced">
      <div className="modal-content-enhanced ai-reports-container ai-reports-full-height">
        {/* Reports List */}
        <div className="p-4 sm:p-6">
          <div className="rounded-t-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="ai-reports-table-header">
                    <th className="px-3 sm:px-6 py-4 text-left rounded-tl-xl text-white font-medium text-sm">
                      Report Title
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-white font-medium text-sm hidden sm:table-cell">
                      Created
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-left text-white font-medium text-sm hidden md:table-cell">
                      Queries
                    </th>
                    <th className="px-3 sm:px-6 py-4 text-right text-white font-medium text-sm rounded-tr-xl">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Show skeleton rows while loading
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={`loading-row-${index}`} className="border-b border-white/10">
                        <td className="px-3 sm:px-6 py-4">
                          <div className="space-y-2">
                            <div className="h-5 rounded animate-pulse w-48 ai-reports-skeleton" />
                            <div className="h-4 rounded animate-pulse w-32 ai-reports-skeleton" />
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="h-4 rounded animate-pulse w-24 ai-reports-skeleton" />
                            <div className="h-3 rounded animate-pulse w-16 ai-reports-skeleton" />
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                          <div className="h-4 rounded animate-pulse w-8 ai-reports-skeleton" />
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <div className="rounded-full animate-pulse h-8 w-20 ai-reports-skeleton" />
                            <div className="rounded-full animate-pulse h-8 w-24 ai-reports-skeleton" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedCompletedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 sm:px-6 py-8 text-center">
                        <span className="text-white/70 text-base font-medium">No completed reports found</span>
                      </td>
                    </tr>
                  ) : (
                    paginatedCompletedTasks.map((task) => (
                      <tr 
                        key={task.task_id} 
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-white font-medium">
                            <div className="truncate max-w-[200px] sm:max-w-none">
                              {task.user_query ? task.user_query.substring(0, 50) + (task.user_query.length > 50 ? '...' : '') : 'Generated Report'}
                            </div>
                            {/* Mobile-only info */}
                            <div className="sm:hidden text-xs text-gray-400 mt-1">
                              {formatTimestamp(task.completed_at || task.created_at).relative}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-white hidden sm:table-cell">
                          <div className="text-sm">
                            {formatTimestamp(task.completed_at || task.created_at).absolute}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-white hidden md:table-cell">
                          {task.total_queries || 0}
                        </td>
                        <td className="px-3 sm:px-6 py-4 text-right">
                          <div className="flex items-center gap-1 sm:gap-2 justify-end">
                            <Button
                              onClick={() => handleViewReport(task)}
                              variant="outline"
                              className="ai-reports-action-btn"
                              size="sm"
                            >
                              <Eye className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>
                            {task.results && (
                              <Button
                                onClick={() => handleDownloadReport(task)}
                                variant="outline"
                                className="ai-reports-action-btn"
                                size="sm"
                              >
                                <img src="/tables/download.svg" alt="Download" className="w-4 h-4 sm:ml-1" />
                                <span className="hidden sm:inline ml-1">Download</span>
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDeleteClick(task.task_id)}
                              variant="outline"
                              className="ai-reports-action-btn border-red-500 text-red-300 hover:bg-red-900/20"
                              size="sm"
                              disabled={deletingTaskId === task.task_id}
                            >
                              <img src="/user-configuration/reportdelete.svg" alt="Delete" className="w-4 h-4 sm:mr-1" />
                              <span className="hidden sm:inline">
                                {deletingTaskId === task.task_id ? 'Deleting...' : 'Delete'}
                              </span>
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
        </div>

        {/* Pagination Controls */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {loading ? (
            // Pagination skeleton while loading
            <>
              <div className="space-y-1">
                <div className="h-4 rounded animate-pulse w-48 ai-reports-skeleton" />
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full animate-pulse h-8 w-20 ai-reports-skeleton" />
                <div className="rounded animate-pulse h-6 w-16 ai-reports-skeleton" />
                <div className="rounded-full animate-pulse h-8 w-16 ai-reports-skeleton" />
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-400 text-center sm:text-left">
                Showing {paginatedCompletedTasks.length} of {completedTasks.length}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0 || loading}
                  variant="outline"
                  size="sm"
                  className="ai-reports-pagination-btn"
                >
                  <ChevronLeft className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Page {currentPage + 1}</span>
                </div>
                
                <Button
                  onClick={handleNextPage}
                  disabled={!hasMoreCompleted || loading}
                  variant="outline"
                  size="sm"
                  className="ai-reports-pagination-btn"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 sm:ml-1" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Report Task"
        message="Are you sure you want to delete this report task? This action cannot be undone and will permanently remove the task from your history."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deletingTaskId !== null}
      />
    </div>
  );
}
