"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useTaskStore, TaskUtils } from '@/store/task-store';

interface TaskManagerContextType {
  // Task management
  addTask: (task: Omit<import('@/store/task-store').Task, 'id' | 'createdAt' | 'status' | 'progress'>) => string;
  updateTask: (id: string, updates: Partial<import('@/store/task-store').Task>) => void;
  removeTask: (id: string) => void;
  
  // Task utilities
  startTask: (id: string) => void;
  completeTask: (id: string, result?: any) => void;
  failTask: (id: string, error: string) => void;
  updateProgress: (id: string, progress: number) => void;
  cancelTask: (id: string) => void;
  
  // UI actions
  openTaskList: () => void;
  closeTaskList: () => void;
  
  // State
  activeTasksCount: number;
  completedTasksCount: number;
  failedTasksCount: number;
  hasActiveTasks: boolean;
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined);

interface TaskManagerProviderProps {
  children: ReactNode;
}

export function TaskManagerProvider({ children }: TaskManagerProviderProps) {
  const {
    addTask,
    updateTask,
    removeTask,
    openTaskList,
    closeTaskList,
    getActiveTasksCount,
    getCompletedTasksCount,
    getFailedTasksCount,
  } = useTaskStore();

  const activeTasksCount = getActiveTasksCount();
  const completedTasksCount = getCompletedTasksCount();
  const failedTasksCount = getFailedTasksCount();
  const hasActiveTasks = activeTasksCount > 0;

  const contextValue: TaskManagerContextType = {
    // Task management
    addTask,
    updateTask,
    removeTask,
    
    // Task utilities
    startTask: TaskUtils.startTask,
    completeTask: TaskUtils.completeTask,
    failTask: TaskUtils.failTask,
    updateProgress: TaskUtils.updateProgress,
    cancelTask: TaskUtils.cancelTask,
    
    // UI actions
    openTaskList,
    closeTaskList,
    
    // State
    activeTasksCount,
    completedTasksCount,
    failedTasksCount,
    hasActiveTasks,
  };

  return (
    <TaskManagerContext.Provider value={contextValue}>
      {children}
    </TaskManagerContext.Provider>
  );
}

export function useTaskManager() {
  const context = useContext(TaskManagerContext);
  if (context === undefined) {
    throw new Error('useTaskManager must be used within a TaskManagerProvider');
  }
  return context;
}

// Hook for easy task creation with common patterns
export function useTaskCreator() {
  const { addTask, startTask, completeTask, failTask, updateProgress } = useTaskManager();

  const createReportTask = (title: string, description: string, metadata?: Record<string, any>) => {
    return addTask({
      type: 'report_generation',
      title,
      description,
      metadata,
    });
  };

  const createQueryTask = (title: string, description: string, metadata?: Record<string, any>) => {
    return addTask({
      type: 'query_execution',
      title,
      description,
      metadata,
    });
  };

  const createFileUploadTask = (title: string, description: string, metadata?: Record<string, any>) => {
    return addTask({
      type: 'file_upload',
      title,
      description,
      metadata,
    });
  };

  const createDataProcessingTask = (title: string, description: string, metadata?: Record<string, any>) => {
    return addTask({
      type: 'data_processing',
      title,
      description,
      metadata,
    });
  };

  const executeTask = async <T,>(
    taskId: string,
    taskFunction: () => Promise<T>,
    progressCallback?: (progress: number) => void,
    options?: {
      shouldCompleteImmediately?: boolean;
      onUploadSuccess?: (result: T) => void;
    }
  ): Promise<T> => {
    try {
      startTask(taskId);
      
      const result = await taskFunction();
      
      // For file uploads, we don't complete the task immediately
      // The task will be completed when the actual processing finishes via polling
      if (options?.shouldCompleteImmediately !== false) {
        // Simulate progress updates if no callback provided
        if (!progressCallback) {
          for (let i = 0; i <= 100; i += 10) {
            updateProgress(taskId, i);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        completeTask(taskId, result);
      } else {
        // For file uploads, just update progress to indicate upload is done
        // but keep task running until processing is complete
        updateProgress(taskId, 50); // Upload is 50% done, processing is the other 50%
        
        // Call the upload success callback if provided
        options?.onUploadSuccess?.(result);
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Task failed';
      failTask(taskId, errorMessage);
      throw error;
    }
  };

  return {
    createReportTask,
    createQueryTask,
    createFileUploadTask,
    createDataProcessingTask,
    executeTask,
    startTask,
    completeTask,
    failTask,
    updateProgress,
  };
}
