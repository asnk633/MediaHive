// src/hooks/useKanbanRealtime.ts
// Hook for Kanban realtime updates

import { useServerSync } from './useServerSync';

interface KanbanUpdate {
  type: 'taskMoved' | 'taskUpdated' | 'newTask';
  task: any;
  oldStatus?: string;
  newStatus?: string;
}

export function useKanbanRealtime(callback: (update: KanbanUpdate) => void) {
  useServerSync('kanban', (data) => {
    // Type guard to ensure data matches KanbanUpdate interface
    if (data && typeof data === 'object' && 'type' in data) {
      callback(data as KanbanUpdate);
    }
  });
}