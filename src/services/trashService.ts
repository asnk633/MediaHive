import { Task } from "@/features/tasks/types/task";
import { CanonicalDataService } from "./canonicalDataService";
import { TABLES } from "@/lib/dbTables";
import { supabase } from "@/lib/supabaseClient";
import { tenantContext } from "@/lib/auth/tenantContext";

export const TrashService = {
    getTrash: async (): Promise<Task[]> => {
        const { tenantId } = await tenantContext();
        const { data, error } = await supabase
            .from(TABLES.TASKS)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('deleted', true);
        
        if (error) {
            console.error('[TrashService] Failed to fetch trash:', error);
            return [];
        }

        const { TaskSchema } = await import('@/domain/schemas');
        const tasks = (data || []).map(item => {
            const v = TaskSchema.safeParse(item);
            if (!v.success) {
                console.warn(`[TrashService] Task ${item.id} validation failed:`, v.error.format());
            }
            return item;
        });

        const { mapTask } = require('@/services/tasks');
        return tasks.map(mapTask);
    },

    restore: async (ids: string | string[]): Promise<void> => {
        const targetIds = Array.isArray(ids) ? ids : [ids];
        
        for (const id of targetIds) {
            const success = await CanonicalDataService.patchFields(
                TABLES.TASKS,
                id,
                { deleted: false },
                'task'
            );
            if (!success) throw new Error(`Failed to restore task ${id}`);
        }
    },

    permanentDelete: async (ids: string | string[]): Promise<void> => {
        const targetIds = Array.isArray(ids) ? ids : [ids];
        
        if (targetIds.length > 1) {
            const success = await CanonicalDataService.bulkHardDelete(TABLES.TASKS, targetIds, 'task');
            if (!success) throw new Error("Failed to enqueue bulk delete");
        } else if (targetIds.length === 1) {
            const success = await CanonicalDataService.hardDelete(TABLES.TASKS, targetIds[0], 'task');
            if (!success) throw new Error(`Failed to enqueue delete for task ${targetIds[0]}`);
        }
    }
};
