import { supabase } from '@/lib/supabaseClient';
import { MediaTask, MediaTaskSchema } from './taskContract';
import { eventBus } from '@/system/events/eventSystem';
import { tenantContext } from '@/lib/auth/tenantContext';
import { logger } from '@/lib/logging';
import { tenantQuery, fromTable } from '@/lib/db/tenantQuery';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

const parseDate = (d: any): string => {
    if (!d) return new Date(0).toISOString();
    if (typeof d === 'string') return d;
    if (d.seconds) return new Date(d.seconds * 1000).toISOString();
    return new Date(0).toISOString();
};

export function mapTask(row: any): MediaTask {
    const task: any = {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        dueDate: parseDate(row.due_date || row.dueDate),
        due_date: parseDate(row.due_date || row.dueDate),
        institutionId: row.institution_id || row.institutionId,
        institution_id: row.institution_id || row.institutionId,
        departmentId: row.department_id || row.departmentId,
        department_id: row.department_id || row.departmentId,
        assignedTo: (row.task_assignments ?? []).map((ta: any) => ({
            userId: ta.user_id,
            name: ta.profiles?.full_name ?? 'Unknown',
            avatarUrl: ta.profiles?.avatar_url ?? null,
            role: ta.role ?? 'assignee',
        })),
        assigned_to: [], // Deprecated
        createdBy: {
            uid: typeof row.created_by === 'string' ? row.created_by : (row.created_by?.uid || 'unknown'),
            name: typeof row.created_by === 'string' ? 'Unknown' : (row.created_by?.name || 'Unknown'),
            role: typeof row.created_by === 'string' ? 'user' : (row.created_by?.role || 'user')
        },
        created_by: row.created_by,
        assignedBy: row.assigned_by ? {
            uid: typeof row.assigned_by === 'string' ? row.assigned_by : row.assigned_by.uid,
            name: typeof row.assigned_by === 'string' ? 'Unknown' : row.assigned_by.name
        } : undefined,
        assigned_by: row.assigned_by,
        updatedBy: row.updated_by ? {
            uid: typeof row.updated_by === 'string' ? row.updated_by : row.updated_by.uid,
            name: typeof row.updated_by === 'string' ? 'Unknown' : row.updated_by.name
        } : undefined,
        updated_by: row.updated_by,
        createdAt: parseDate(row.created_at || row.createdAt),
        created_at: parseDate(row.created_at || row.createdAt),
        updatedAt: parseDate(row.updated_at || row.updatedAt),
        updated_at: parseDate(row.updated_at || row.updatedAt),
        completedAt: parseDate(row.completed_at || row.completedAt),
        completed_at: parseDate(row.completed_at || row.completedAt),
        mediaUploaded: row.media_uploaded,
        media_uploaded: row.media_uploaded,
        mediaApproved: row.media_approved,
        media_approved: row.media_approved,
        mediaApprovedDate: parseDate(row.media_approved_date || row.mediaApprovedDate),
        media_approved_date: parseDate(row.media_approved_date || row.mediaApprovedDate),
        is_demo_data: row.is_demo_data,
        deleted: row.deleted,
        tenant_id: row.tenant_id
    };

    // Intelligence Flags (Computed)
    if (task.dueDate && task.status !== 'done') {
        const due = new Date(task.dueDate);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        task.isOverdue = due < todayStart;
        task.isDueToday = due >= todayStart && due <= todayEnd;
        task.isUpcoming = due > todayEnd;
    }

    const result = MediaTaskSchema.safeParse(task);
    if (!result.success) {
        console.error("[TaskMapping] Validation failed:", result.error.format());
        return task as MediaTask;
    }
    return result.data;
}

export const taskService = {
    async getTasks(params: { status?: string; department?: string } = {}): Promise<MediaTask[]> {
        try {
            const { tenantId } = await tenantContext();

            let query = tenantQuery(TABLES.TASKS, tenantId)
                .eq('deleted', false)
                .order('created_at', { ascending: false });

            if (params.status) {
                query = query.eq('status', params.status);
            }

            if (params.department) {
                query = query.eq('department_id', params.department);
            }

            const { data, error } = await safeQuery(() => query) as { data: any[]; error: any };

            if (error) throw error;

            logger.info('Fetched tasks', { tenantId, action: 'GET_TASKS', metadata: { count: (data as any[])?.length } });
            return ((data as any[]) || []).map(mapTask);
        } catch (error) {
            logger.error('Failed to fetch tasks', { action: 'GET_TASKS', metadata: { error } });
            return [];
        }
    },

    async updateTaskStatus(taskId: string, status: string): Promise<MediaTask> {
        try {
            const { tenantId, userId } = await tenantContext();

            const { data, error } = await safeQuery(() => fromTable(TABLES.TASKS)
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .eq('tenant_id', tenantId)
                .select()
                .single()
            );

            if (error) throw error;

            const task = mapTask(data);

            // Emit events
            eventBus.emit('task.updated', { taskId: task.id, changes: { status } });
            if (status === 'done') {
                eventBus.emit('task.completed', { taskId: task.id, userId: userId });
            }

            logger.info('Updated task status', { tenantId, action: 'UPDATE_TASK_STATUS', resourceId: taskId, metadata: { status } });
            return task;
        } catch (error) {
            logger.error('Failed to update task status', { action: 'UPDATE_TASK_STATUS', resourceId: taskId, metadata: { error } });
            throw error;
        }
    },

    async getTaskById(taskId: string): Promise<MediaTask | null> {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => tenantQuery(TABLES.TASKS, tenantId)
                .select(`
                    *,
                    task_assignments(
                        user_id,
                        role,
                        profiles:${TABLES.USERS}(id, full_name, avatar_url)
                    )
                `)
                .eq('id', taskId)
                .single()
            );

            if (error) throw error;

            return data ? mapTask(data) : null;
        } catch (error) {
            logger.error('Failed to fetch task by ID', { action: 'GET_TASK_BY_ID', resourceId: taskId, metadata: { error } });
            return null;
        }
    }
};
