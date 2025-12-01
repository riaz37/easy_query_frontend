import { useState, useCallback } from 'react';
import { QueryService } from '@/lib/api/services/query-service';
import { ServiceRegistry } from '@/lib/api/services/service-registry';

export interface BackgroundQueryState {
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  result: any | null;
  taskId: string | null;
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed';
}

export interface BackgroundQueryOptions {
  model?: 'gemini' | 'llama-3.3-70b-versatile' | 'openai/gpt-oss-120b';
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export function useBackgroundQuery() {
  const [state, setState] = useState<BackgroundQueryState>({
    isLoading: false,
    isPolling: false,
    error: null,
    result: null,
    taskId: null,
    status: 'idle'
  });

  const queryService = ServiceRegistry.query;

  const startQuery = useCallback(async (
    question: string, 
    userId: string, 
    options: BackgroundQueryOptions = {}
  ) => {
    if (!question.trim()) {
      setState(prev => ({ ...prev, error: 'Question cannot be empty' }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      result: null,
      taskId: null,
      status: 'idle'
    }));

    try {
      // Start background query
      const backgroundResponse = await queryService.startBackgroundQuery({
        question,
        userId,
        model: options.model || 'gemini'
      });

      if (!backgroundResponse.success || !backgroundResponse.data?.task_id) {
        throw new Error(backgroundResponse.error || 'Failed to start background query');
      }

      const taskId = backgroundResponse.data.task_id;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPolling: true,
        taskId,
        status: 'queued'
      }));

      options.onStatusChange?.('queued');

      // Poll for completion
      const result = await queryService.pollBackgroundQuery(taskId);
      
      setState(prev => ({
        ...prev,
        isPolling: false,
        result: result.data,
        status: 'completed'
      }));

      options.onStatusChange?.('completed');
      options.onComplete?.(result.data);

    } catch (error: any) {
      const errorMessage = error.message || 'Query failed';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPolling: false,
        error: errorMessage,
        status: 'failed'
      }));

      options.onStatusChange?.('failed');
      options.onError?.(errorMessage);
    }
  }, [queryService]);

  const getStatus = useCallback(async (taskId: string) => {
    if (!taskId) return;

    try {
      const statusResponse = await queryService.getBackgroundQueryStatus(taskId);
      
      if (statusResponse.success && statusResponse.data) {
        setState(prev => ({
          ...prev,
          status: statusResponse.data.status as any,
          result: statusResponse.data.result || prev.result
        }));

        return statusResponse.data;
      }
    } catch (error) {
      console.error('Failed to get query status:', error);
    }
  }, [queryService]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isPolling: false,
      error: null,
      result: null,
      taskId: null,
      status: 'idle'
    });
  }, []);

  return {
    ...state,
    startQuery,
    getStatus,
    reset
  };
}
