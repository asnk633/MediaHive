import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '@/features/tasks/services/taskService';
import { Task } from '@/features/tasks/types/task';
import { useAuth } from '@/contexts/AuthContextProvider';
import { apiClient } from '@/lib/apiClient';
import { useAuthQueryGuard } from '@/hooks/useAuthQueryGuard';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';

/**
 * useTasks Hook
 * Uses React Query for caching, automatic retries, and background refetching.
 */
export function useTasks() {
    console.log("[DATA TRACE] useTasks initialized (Global)")
    const { canFetch } = useAuthQueryGuard();

    return useQuery({
        queryKey: ['tasks', 'global'],
        queryFn: async () => {
            const response = await TaskService.getTasks();
            return response || [];
        },
        enabled: canFetch,
        staleTime: 60000,
        retry: 1,
        retryDelay: 1000,
        refetchOnReconnect: true,
        refetchOnMount: true
    });
}

export function useCreateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (task: Partial<Task>) => TaskService.createTask(task),
        onMutate: async (newTask) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', 'global'] });
            const previousTasks = queryClient.getQueryData<Task[]>(['tasks', 'global']);

            if (previousTasks) {
                // Optimistically add the new task with a temporary ID
                const optimisticTask = {
                    ...newTask,
                    id: `temp-${Date.now()}`,
                    status: newTask.status || 'todo',
                    created_at: new Date().toISOString()
                } as Task;

                queryClient.setQueryData(['tasks', 'global'], [optimisticTask, ...previousTasks]);
            }

            return { previousTasks };
        },
        onError: (err, newTask, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks', 'global'], context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
        },
    });
}

export function useUpdateTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
            TaskService.updateTask(id, updates),
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', 'global'] });
            const previousTasks = queryClient.getQueryData<Task[]>(['tasks', 'global']);

            if (previousTasks) {
                queryClient.setQueryData(['tasks', 'global'], (old: Task[] | undefined) =>
                    old?.map(task => task.id === id ? { ...task, ...updates } : task)
                );
            }

            return { previousTasks };
        },
        onError: (err, variables, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks', 'global'], context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
        },
    });
}

export function useDeleteTask() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => TaskService.deleteTask(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['tasks', 'global'] });
            const previousTasks = queryClient.getQueryData<Task[]>(['tasks', 'global']);

            if (previousTasks) {
                queryClient.setQueryData(['tasks', 'global'], (old: Task[] | undefined) =>
                    old?.filter(task => task.id !== id)
                );
            }

            return { previousTasks };
        },
        onError: (err, id, context) => {
            if (context?.previousTasks) {
                queryClient.setQueryData(['tasks', 'global'], context.previousTasks);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', 'global'] });
        },
    });
}
