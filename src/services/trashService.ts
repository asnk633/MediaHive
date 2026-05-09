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

        const { mapTask } = require('@/services/tasks');
        return (data || []).map(mapTask);
    },

    restore: async (id: string): Promise<void> => {
        const success = await CanonicalDataService.patchFields(
            TABLES.TASKS,
            id,
            { deleted: false },
            'task'
        );
        if (!success) throw new Error("Failed to restore task");
    },

    permanentDelete: async (ids: string | string[]): Promise<void> => {
        const targetIds = Array.isArray(ids) ? ids : [ids];
        
        for (const id of targetIds) {
            const success = await CanonicalDataService.hardDelete(TABLES.TASKS, id, 'task');
            if (!success) throw new Error(`Failed to enqueue delete for task ${id}`);
        }
    }
};
