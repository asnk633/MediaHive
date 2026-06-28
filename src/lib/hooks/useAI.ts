import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api-utils';

interface AIState {
  isLoading: boolean;
  error: string | null;
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    isLoading: false,
    error: null,
  });

  const generateContent = async (prompt: string, systemInstruction?: string): Promise<string | null> => {
    setState({ isLoading: true, error: null });
    try {
      const data = await apiClient(`${API_BASE}/ai/generate`, {
        method: 'POST',
        body: JSON.stringify({ prompt, systemInstruction }),
      });

      setState({ isLoading: false, error: null });
      return data.text;
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || 'An unexpected error occurred' });
      return null;
    }
  };

  const prioritizeTasks = async (tasks: any[]): Promise<{ taskId: string; reason: string }[] | null> => {
    setState({ isLoading: true, error: null });
    try {
      const data = await apiClient(`${API_BASE}/ai/prioritize`, {
        method: 'POST',
        body: JSON.stringify({ tasks }),
      });

      setState({ isLoading: false, error: null });
      return data.prioritizedTasks;
    } catch (err: any) {
      setState({ isLoading: false, error: err.message || 'An unexpected error occurred' });
      return null;
    }
  };

  return {
    ...state,
    generateContent,
    prioritizeTasks,
  };
}
