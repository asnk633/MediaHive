import { supabase } from '@/lib/supabaseClient';
import { Institution, Department, StructureStatus } from '@/types/structure';
import { tenantContext } from '@/lib/auth/tenantContext';

export const StructureService = {
    // Institutions
    getInstitutions: async (showArchived = false) => {
        try {
            const { tenantId } = await tenantContext();

            let query = supabase
                .from('institutions')
                .select('*')
                .eq('tenant_id', tenantId);

            if (!showArchived) {
                query = query.eq('status', 'active');
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;

            return {
                institutions: (data || []) as Institution[]
            };
        } catch (error: any) {
            console.error("[StructureService] Failed to fetch institutions", error);
            throw error;
        }
    },

    createInstitution: async (name: string) => {
        const { tenantId } = await tenantContext();

        const { data, error } = await supabase
            .from('institutions')
            .insert([{
                name: name.trim(),
                status: 'active',
                tenant_id: tenantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Institution;
    },

    updateInstitution: async (id: string, data: { name?: string; status?: StructureStatus }) => {
        const { tenantId } = await tenantContext();

        const { data: updated, error } = await supabase
            .from('institutions')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) throw error;
        return updated as Institution;
    },

    // Departments
    getDepartments: async (showArchived = false) => {
        try {
            const { tenantId } = await tenantContext();

            let query = supabase
                .from('departments')
                .select('*')
                .eq('tenant_id', tenantId);

            if (!showArchived) {
                // Assuming status check for departments if applicable, or just fetch all
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;

            return {
                departments: (data || []) as Department[]
            };
        } catch (error: any) {
            console.error("[StructureService] Failed to fetch departments", error);
            throw error;
        }
    },

    createDepartment: async (name: string) => {
        const { tenantId } = await tenantContext();

        const { data, error } = await supabase
            .from('departments')
            .insert([{
                name: name.trim(),
                tenant_id: tenantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Department;
    },

    updateDepartment: async (id: number, data: { name?: string; status?: StructureStatus }) => {
        const { tenantId } = await tenantContext();

        const { data: updated, error } = await supabase
            .from('departments')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single();

        if (error) throw error;
        return updated as Department;
    },

    // Resolvers
    getInstitutionName: async (id: number | string): Promise<string> => {
        try {
            const { institutions } = await StructureService.getInstitutions();
            const match = institutions.find(i => String(i.id) === String(id));
            return match ? match.name : String(id);
        } catch {
            return String(id);
        }
    },

    getDepartmentName: async (id: number | string): Promise<string> => {
        try {
            const { departments } = await StructureService.getDepartments();
            const match = departments.find(d => String(d.id) === String(id));
            return match ? match.name : String(id);
        } catch {
            return String(id);
        }
    }
};
