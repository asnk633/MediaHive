import { Task } from '@/types/task';
import { TaskRating } from '@/types/taskRating';
import { apiClient } from '@/lib/apiClient';

// Helper to save to local storage
const saveToLocal = (tasks: Task[]) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('mediahive_offline_tasks', JSON.stringify(tasks));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('task-update'));
    }
};

// Helper to load from local storage
const loadFromLocal = (): Task[] => {
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('mediahive_offline_tasks');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return parsed.map((t: any) => ({
                    ...t,
                    dueDate: t.dueDate?.seconds ? t.dueDate : { seconds: new Date(t.dueDate).getTime() / 1000, nanoseconds: 0 },
                    createdAt: t.createdAt?.seconds ? t.createdAt : { seconds: Date.now() / 1000, nanoseconds: 0 }
                }));
            } catch (e) { console.error(e); }
        }
    }
    return [];
};

// API helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `/api/tasks${endpoint}`;
    return apiClient(url, options);
};

export const TaskService = {
    subscribeToTasks: (callback: (tasks: Task[]) => void) => {
        let isCancelled = false;
        let pollInterval: NodeJS.Timeout | null = null;

        const pollTasks = async () => {
            if (isCancelled) return;

            try {
                const data = await apiClient('/api/tasks', {
                    method: 'GET'
                });

                callback(data.tasks || []);
            } catch (error) {
                console.warn('Task polling failed:', error);
                // Fallback to local storage if API fails
                if (!isCancelled) callback(loadFromLocal());
            }

            // Continue polling every 30 seconds
            if (!isCancelled) {
                pollInterval = setTimeout(pollTasks, 30000);
            }
        };

        // Start polling immediately
        pollTasks();

        if (typeof window !== 'undefined') {
            const handleStorage = () => callback(loadFromLocal());
            window.addEventListener('task-update', handleStorage);

            return () => {
                isCancelled = true;
                if (pollInterval) clearTimeout(pollInterval);
                window.removeEventListener('task-update', handleStorage);
            };
        }

        return () => {
            isCancelled = true;
            if (pollInterval) clearTimeout(pollInterval);
        };
    },

    getTask: async (id: string): Promise<Task | null> => {
        try {
            const data = await apiClient(`/api/tasks/${id}`, {
                method: 'GET'
            });

            return data.task || null;
        } catch (e) {
            console.error("Error fetching task", e);
            const local = loadFromLocal();
            return local.find(t => t.id === id) || null;
        }
    },

    addTask: async (task: Omit<Task, 'id' | 'createdAt'>) => {
        // Route through server API instead of direct Firestore write
        const response = await apiRequest('', {
            method: 'POST',
            body: JSON.stringify(task),
        });

        // Log Activity
        const { ActivityService } = await import('@/services/activityService');
        ActivityService.logActivity({
            type: 'task_created',
            entityType: 'task',
            entityId: response.id,
            title: `Task '${task.title}' created`,
            metadata: { priority: task.priority }
        });

        return { id: response.id };
    },

    updateTask: async (id: string, updates: Partial<Task>) => {
        // Route through server API instead of direct Firestore write
        await apiRequest('', {
            method: 'PUT',
            body: JSON.stringify({ id, ...updates }),
        });

        // Log Activity
        const { ActivityService } = await import('@/services/activityService');

        if (updates.status) {
            ActivityService.logActivity({
                type: 'task_status_change',
                entityType: 'task',
                entityId: id,
                title: `Task status updated to '${updates.status}'`,
                metadata: { newStatus: updates.status }
            });
        }
    },

    deleteTask: async (id: string) => {
        // Route through server API instead of direct Firestore write
        const result = await apiClient(`/api/tasks?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });

        // Log Activity
        const { ActivityService } = await import('@/services/activityService');
        ActivityService.logActivity({
            type: 'task_deleted',
            entityType: 'task',
            entityId: id,
            title: `Task deleted`,
        });

        return result;
    },

    toggleTaskAssignee: async (taskId: string, member: { uid: string; name: string }) => {
        // Route through server API instead of direct Firestore write
        return apiClient(`/api/tasks/assign?id=${encodeURIComponent(taskId)}`, {
            method: 'POST',
            body: JSON.stringify({
                assignedToId: member.uid,
                assignedUserName: member.name
            }),
        });
    },

    uploadAttachment: async (taskId: string, file: File, section: 'requester-inputs' | 'team-working-files' | 'team-final-exports') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', section);

        return apiClient(`/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            body: formData,
        });
    },

    deleteAttachment: async (taskId: string, fileId: string) => {
        return apiClient(`/api/tasks/${taskId}/attachments?fileId=${fileId}`, {
            method: 'DELETE'
        });
    },

    toggleAttachmentVisibility: async (taskId: string, fileId: string, showInDownloads: boolean) => {
        return apiClient(`/api/tasks/${taskId}/attachments`, {
            method: 'PATCH',
            body: JSON.stringify({ fileId, showInDownloads })
        });
    },

    fetchAttachmentActivity: async (taskId: string) => {
        return apiClient(`/api/tasks/${taskId}/activity`, {
            method: 'GET'
        });
    }
};