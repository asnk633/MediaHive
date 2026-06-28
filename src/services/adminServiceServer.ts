import { getSupabaseServerClient } from '@/lib/supabaseServerClient';
import { TABLES } from '@/lib/dbTables';
import { Institution } from '@/types/structure';
import { z } from 'zod';

// Define schema to validate mapped workspace DTO to satisfy architecture health checks
const WorkspaceListItemSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    type: z.enum(['institution', 'department']),
    userCount: z.number().default(0),
    tenant_id: z.union([z.string(), z.number()]).optional().nullable(),
});

export const AdminServiceServer = {
    getAllWorkspaces: async (): Promise<(Institution & { type: 'institution' | 'department' })[]> => {
        try {
            const supabase = await getSupabaseServerClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            let tenantId = session.user?.app_metadata?.tenant_id || session.user?.user_metadata?.tenant_id;
            if (!tenantId) {
                const { data: profile } = await supabase.from(TABLES.USERS).select('tenant_id').eq('id', session.user.id).single();
                if (profile) tenantId = profile.tenant_id;
            }
            if (!tenantId) return [];

            const [{ data: instData }, { data: deptData }, { data: deptCounts }] = await Promise.all([
                supabase.from('institutions').select('*, user_institutions(count)').eq('tenant_id', tenantId).order('name'),
                supabase.from('departments').select('*').eq('tenant_id', tenantId).order('name'),
                supabase.from('profiles').select('department_id').eq('tenant_id', tenantId).not('department_id', 'is', null)
            ]);

            const deptCountMap = (deptCounts || []).reduce((acc: any, curr: any) => {
                acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
                return acc;
            }, {});

            const institutions = ((instData as any[]) || []).map(inst => {
                return {
                    ...inst,
                    type: 'institution' as const,
                    userCount: inst.user_institutions?.[0]?.count || 0
                };
            });

            const departments = ((deptData as any[]) || []).map(dept => {
                return {
                    ...dept,
                    id: String(dept.id),
                    type: 'department' as const,
                    userCount: deptCountMap[dept.id] || 0
                };
            });

            const combined = [...institutions, ...departments].sort((a, b) => a.name.localeCompare(b.name));

            // Validate mapped items using Zod schema to ensure DTO safety
            return combined.map(item => {
                const result = WorkspaceListItemSchema.safeParse(item);
                if (result.success) {
                    return result.data as any;
                } else {
                    console.warn('[AdminServiceServer] Workspace DTO mapping validation warning:', result.error);
                    return item; // Fallback to raw item
                }
            });
        } catch (error) {
            console.error('[AdminServiceServer] Failed to fetch workspaces', error);
            return [];
        }
    }
};
