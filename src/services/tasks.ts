import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/features/tasks/types/task';
import { CanonicalDataService } from '@/services/canonicalDataService';
import { offlineDB } from '@/lib/offline/db';
import { MonitoringService } from '@/services/monitoringService';
import { TaskSchema } from '@/domain/schemas/task';

/**
 * Mapper to convert relational Supabase result to Task DTO
 */
export const mapTask = (t: any): Task => {
    if (!t) return t;

    const parsed = TaskSchema.safeParse(t);
    if (!parsed.success) {
        MonitoringService.error("[TaskMapping] Validation failed", parsed.error, { rowId: t.id });
    }

    const task = {
        ...t,
        assignedTo: (t.task_assignments ?? []).map((ta: any) => ({
            userId: ta.user_id,
            uid: ta.user_id, // Compatibility
            name: ta.profiles?.full_name ?? 'Unknown',
            avatarUrl: ta.profiles?.avatar_url ?? null,
            avatar_url: ta.profiles?.avatar_url ?? null,
            role: ta.role ?? 'assignee',
        })),
        assigned_to: [], // Deprecated
        // Legacy compatibility for dates
        dueDate: t.due_date || t.dueDate,
        institutionId: t.institution_id || t.institutionId,
        departmentId: t.department_id || t.departmentId,
        created_by: t.creator ? { 
            uid: t.created_by, 
            id: t.creator.id,
            name: t.creator.full_name, 
            role: t.creator.role,
            institution_id: t.creator.institution_id,
            department_id: t.creator.department_id,
            institution_name: t.creator.institutions?.name,
            department_name: t.creator.departments?.name
        } : { uid: t.created_by, name: 'Unknown', role: 'member' },
        updated_by: t.updater ? { 
            uid: t.updated_by, 
            id: t.updater.id,
            name: t.updater.full_name, 
            role: t.updater.role,
            institution_id: t.updater.institution_id,
            department_id: t.updater.department_id,
            institution_name: t.updater.institutions?.name,
            department_name: t.updater.departments?.name
        } : (t.creator ? { uid: t.created_by, name: t.creator.full_name, role: t.creator.role } : { uid: t.updated_by || t.created_by, name: 'Unknown', role: 'member' }),
        assigned_by: t.assigner ? { 
            uid: t.assigned_by, 
            id: t.assigner.id,
            name: t.assigner.full_name, 
            role: t.assigner.role,
            institution_id: t.assigner.institution_id,
            department_id: t.assigner.department_id,
            institution_name: t.assigner.institutions?.name,
            department_name: t.assigner.departments?.name
        } : { uid: t.assigned_by, name: 'Unknown', role: 'admin' },
        // Legacy support
        updatedBy: t.updater ? { uid: t.updated_by, name: t.updater.full_name, role: t.updater.role } : (t.creator ? { uid: t.created_by, name: t.creator.full_name, role: t.creator.role } : { uid: t.updated_by || t.created_by, name: 'Unknown', role: 'member' }),
        createdAt: t.created_at || t.createdAt,
        updatedAt: t.updated_at || t.updatedAt,
        completedAt: t.completed_at || t.completedAt,
    };

    // Intelligence Flags (Computed)
    if (task.due_date && task.status !== 'done') {
        const due = new Date(task.due_date);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        task.isOverdue = due < todayStart;
        task.isDueToday = due >= todayStart && due <= todayEnd;
        task.isUpcoming = due > todayEnd;
    }

    return task;
};

export const TaskService = {
    async getTasks(params: { institutionId?: string; status?: string; department?: string } = {}): Promise<Task[]> {
        try {
            let query = supabase
                .from('tasks')
                .select(`
                    *,
                    task_assignments(
                        user_id,
                        role,
                        profiles(id, full_name, avatar_url)
                    ),
                    creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name)),
                    updater:profiles!tasks_updated_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name)),
                    assigner:profiles!tasks_assigned_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name))
                `)
                .eq('deleted', false);
            
            /*
            if (params.institutionId) {
                query = query.eq('institution_id', params.institutionId);
            }
            */
            if (params.status) {
                query = query.eq('status', params.status);
            }
            if (params.department) {
                query = query.eq('department_id', params.department);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            // Update Cache
            if (data) {
                const cacheKey = params.institutionId ? `tasks:${params.institutionId}` : 'tasks';
                await offlineDB.setCache(cacheKey, data);
            }
            
            return ((data as any[]) || []).map(mapTask);
        } catch (error: any) {
            const cacheKey = params.institutionId ? `tasks:${params.institutionId}` : 'tasks';
            MonitoringService.warn("[TaskService] Network error, falling back to cache", { error: error.message, cacheKey });
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            return ((cached as any[]) || []).map(mapTask);
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
                    ),
                    creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name)),
                    updater:profiles!tasks_updated_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name)),
                    assigner:profiles!tasks_assigned_by_fkey(id, full_name, avatar_url, role, institution_id, department_id, institutions(name), departments(name))
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return mapTask(data);
        } catch (error: any) {
            const cacheKey = institutionId ? `tasks:${institutionId}` : 'tasks';
            MonitoringService.warn("[TaskService] Network error for ID, checking cache", { error: error.message, taskId: id });
            const cachedTasks = await offlineDB.getCache<any[]>(cacheKey);
            const task = cachedTasks?.find(t => t.id === id);
            return task ? mapTask(task) : null;
        }
    },

    async createTask(task: Partial<Task>) {
        const { eventBus } = await import('@/system/events/eventSystem');
        const { data, error } = await CanonicalDataService.createRecord('tasks', task, 'task');
        if (error) throw error;
        
        if (data) {
            // Get assignee IDs from the task object (handle both assigned_to and assignedTo)
            const assigneeIds = (task.assignedTo || task.assigned_to || []).map((a: any) => typeof a === 'string' ? a : (a.uid || a.userId));
            eventBus.emit('task.created', { 
                taskId: data.id, 
                title: data.title,
                assignedTo: assigneeIds
            });
        }
        return data;
    },

    async updateTask(id: string, updates: Partial<Task>, baseUpdatedAt?: string, baseVersion?: number) {
        const { eventBus } = await import('@/system/events/eventSystem');
        const { getCurrentUser } = await import('@/lib/auth/verifyUser');
        const user = await getCurrentUser();

        // If status is changing to 'done', we need task info for the notification (title, assigner)
        let taskInfo = null;
        if (updates.status === 'done') {
            taskInfo = await this.getTaskById(id);
        }

        const success = await CanonicalDataService.patchFields('tasks', id, updates, 'task', baseUpdatedAt, baseVersion);
        if (!success) throw new Error('Failed to enqueue task update');

        // Emit events for status changes
        if (updates.status) {
            // Get task info for the notification if not already fetched
            if (!taskInfo) {
                taskInfo = await this.getTaskById(id);
            }

            eventBus.emit('task.updated', { 
                taskId: id, 
                title: taskInfo?.title,
                changes: { status: updates.status },
                assignerId: taskInfo?.assigned_by?.uid || taskInfo?.created_by?.uid
            });

            if (updates.status === 'done') {
                eventBus.emit('task.completed', { 
                    taskId: id, 
                    title: taskInfo?.title,
                    userId: user?.id || 'unknown',
                    assignerId: taskInfo?.assigned_by?.uid || taskInfo?.created_by?.uid
                });
            }
        }

        return { id, ...updates };
    },

    async deleteTask(id: string) {
        const success = await CanonicalDataService.patchFields('tasks', id, { deleted: true }, 'task');
        if (!success) throw new Error('Failed to enqueue task deletion');
    },

    /**
     * Legacy compatibility method with event bus integration
     */
    async updateTaskStatus(taskId: string, status: string): Promise<any> {
        const { eventBus } = await import('@/system/events/eventSystem');
        const { getCurrentUser } = await import('@/lib/auth/verifyUser');
        const user = await getCurrentUser();

        const success = await CanonicalDataService.patchFields('tasks', taskId, { status }, 'task');
        if (!success) throw new Error('Failed to update task status');

        // Emit events
        eventBus.emit('task.updated', { taskId, changes: { status } });
        if (status === 'done') {
            eventBus.emit('task.completed', { taskId, userId: user?.id || 'unknown' });
        }

        return { id: taskId, status };
    }
};
