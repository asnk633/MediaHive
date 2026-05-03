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

        const { mapTask } = require('@/features/tasks/services/taskService');
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

    permanentDelete: async (id: string): Promise<void> => {
        // We'll use a direct delete via CanonicalDataService if supported, 
        // or a specific mutation type. For now, we'll assume a direct call is needed 
        // as CanonicalDataService doesn't have a 'hardDelete' yet.
        const { tenantId } = await tenantContext();
        const { error } = await supabase
            .from(TABLES.TASKS)
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId);

        if (error) throw error;
    }
};
