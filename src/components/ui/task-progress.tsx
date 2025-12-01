"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/loading";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MSSQLConfigService } from "@/lib/api/services/mssql-config-service";

interface TaskProgressProps {
  taskId: string | null;
  onTaskComplete?: (success: boolean, result?: any) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
  showCancelButton?: boolean;
  pollInterval?: number;
}

interface TaskStatus {
  status: 'pending' | 'running' | 'success' | 'failed';
  progress: number;
  error?: string;
  result?: any;
}

export function TaskProgress({
  taskId,
  onTaskComplete,
  onCancel,
  title = "Processing Task",
  description = "Please wait while we process your request...",
  showCancelButton = true,
  pollInterval = 2000,
}: TaskProgressProps) {
  const [taskStatus, setTaskStatus] = useState<TaskStatus>({
    status: 'pending',
    progress: 0,
  });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  // Timer effect for elapsed time
  useEffect(() => {
    if (!taskId) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [taskId]);

  // Polling effect for task status
  useEffect(() => {
    if (!taskId || isPolling) return;

    let pollTimer: NodeJS.Timeout;
    
    const pollTaskStatus = async () => {
      try {
        setIsPolling(true);
        const response = await MSSQLConfigService.getTaskStatus(taskId);
        
        // Handle different response formats
        let taskData: any = response;
        if (response && typeof response === 'object') {
          // Check if response has a data property (common with axios)
          if ('data' in response && response.data) {
            taskData = response.data;
          }
        }
        
        if (!taskData || typeof taskData !== 'object') {
          throw new Error('Invalid task status response format');
        }
        
        const normalizedStatus = taskData.status === 'completed' ? 'success' : taskData.status;
        const newStatus: TaskStatus = {
          status: normalizedStatus,
          progress: taskData.progress || 0,
          error: taskData.error,
          result: taskData.result,
        };
        
        setTaskStatus(newStatus);
        
        if (newStatus.status === 'success') {
          onTaskComplete?.(true, newStatus.result);
          return;
        } else if (newStatus.status === 'failed') {
          onTaskComplete?.(false, newStatus.error);
          return;
        }
        
        // Continue polling if still pending or running
        if (newStatus.status === 'pending' || newStatus.status === 'running') {
          pollTimer = setTimeout(pollTaskStatus, pollInterval);
        }
      } catch (error: any) {
        console.error('Error polling task status:', error);
        const errorMessage = error?.message || error?.toString() || 'Failed to check task status';
        setTaskStatus(prev => ({
          ...prev,
          status: 'failed',
          error: errorMessage,
        }));
        onTaskComplete?.(false, errorMessage);
      } finally {
        setIsPolling(false);
      }
    };

    // Start polling immediately
    pollTaskStatus();

    return () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [taskId, onTaskComplete, pollInterval, isPolling]);

  const getStatusIcon = () => {
    switch (taskStatus.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'running':
        return <Spinner size="sm" variant="accent-green" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Spinner size="sm" variant="accent-green" />;
    }
  };

  const getStatusText = () => {
    switch (taskStatus.status) {
      case 'pending':
        return 'Queued';
      case 'running':
        return 'Processing';
      case 'success':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (taskStatus.status) {
      case 'pending':
        return 'text-gray-400';
      case 'running':
        return 'text-green-400';
      case 'success':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!taskId) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Simple Spinner */}
      <Spinner size="xl" variant="primary" />
      
      {/* Simple Text */}
      <p className="text-sm text-gray-400">Creating database</p>
    </div>
  );
}