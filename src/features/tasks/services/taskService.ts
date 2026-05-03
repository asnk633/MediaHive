import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/features/tasks/types/task';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { offlineDB } from '@/lib/offline/db';

/**
 * Mapper to convert relational Supabase result to Task DTO
 */
const mapRelationalTask = (t: any): Task => {
    if (!t) return t;

    return {
        ...t,
        assignedTo: (t.task_assignments ?? []).map((ta: any) => ({
            userId: ta.user_id,
            name: ta.profiles?.full_name ?? 'Unknown',
            avatarUrl: ta.profiles?.avatar_url ?? null,
            role: ta.role ?? 'assignee',
        })),
        assigned_to: [] // Deprecated
    };
};

export const TaskService = {
    async getTasks(institutionId?: string): Promise<Task[]> {
        try {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    task_assignments(
                        user_id,
                        role,
                        profiles(id, full_name, avatar_url)
                    )
                `)
                .eq('deleted', false);
            
            if (institutionId) {
                query = query.eq('institution_id', institutionId);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Update Cache
            if (data) {
                const cacheKey = institutionId ? `tasks:${institutionId}` : 'tasks';
                await offlineDB.setCache(cacheKey, data);
            }
            
            return ((data as any[]) || []).map(mapRelationalTask);
        } catch (error) {
            const cacheKey = institutionId ? `tasks:${institutionId}` : 'tasks';
            console.warn("[TaskService] Network error, falling back to cache:", error);
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            return ((cached as any[]) || []).map(mapRelationalTask);
        }
    },

    async getTaskById(id: string, institutionId?: string): Promise<Task | null> {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    task_assignments(
                        user_id,
                        role,
                        profiles(id, full_name, avatar_url)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return mapRelationalTask(data);
        } catch (error) {
            const cacheKey = institutionId ? `tasks:${institutionId}` : 'tasks';
            console.warn("[TaskService] Network error for ID, checking cache:", error);
            const cachedTasks = await offlineDB.getCache<any[]>(cacheKey);
            const task = cachedTasks?.find(t => t.id === id);
            return task ? mapRelationalTask(task) : null;
        }
    },

    async createTask(task: Partial<Task>) {
        const { data, error } = await CanonicalDataService.createRecord('tasks', task, 'task');
        if (error) throw error;
        return data;
    },

    async updateTask(id: string, updates: Partial<Task>) {
        // We capture baseUpdatedAt from the updates if provided, or from the current record if we can
        const baseUpdatedAt = (updates as any).updated_at;
        const success = await CanonicalDataService.patchFields('tasks', id, updates, 'task', baseUpdatedAt);
        if (!success) throw new Error('Failed to enqueue task update');
        return { id, ...updates };
    },

    async deleteTask(id: string) {
        const success = await CanonicalDataService.patchFields('tasks', id, { deleted: true }, 'task');
        if (!success) throw new Error('Failed to enqueue task deletion');
    }
};
