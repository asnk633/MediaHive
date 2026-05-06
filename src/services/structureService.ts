import { supabase } from '@/lib/supabaseClient';
import { Institution, Department, StructureStatus } from '@/types/structure';
import { tenantContext } from '@/lib/auth/tenantContext';
import { safeQuery } from '@/lib/safeQuery';
import { MonitoringService } from '@/services/monitoringService';

export const StructureService = {
    // Institutions
    getInstitutions: async (showArchived = false) => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => {
                let query = supabase
                    .from('institutions')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (!showArchived) {
                    query = query.eq('status', 'active');
                }

                return query.order('name', { ascending: true });
            }, { table: 'institutions' });

            if (error) throw error;

            return {
                institutions: (data || []) as Institution[]
            };
        } catch (error: any) {
            MonitoringService.error("[StructureService] Failed to fetch institutions", error);
            throw error;
        }
    },

    createInstitution: async (name: string) => {
        try {
            const { tenantId } = await tenantContext();

            // 1. Ensure a matching Unit exists (User says they are same)
            const { departments } = await StructureService.getDepartments();
            let unit = departments.find(d => d.name.toLowerCase() === name.trim().toLowerCase());
            
            if (!unit) {
                unit = await StructureService.createDepartment(name);
            }

            const payload = {
                name: name.trim(),
                status: 'active',
                unit_id: unit.id,
                tenant_id: tenantId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await safeQuery(() => 
                supabase
                    .from('institutions')
                    .insert([payload])
                    .select()
                    .single(),
                { 
                    table: 'institutions', 
                    type: 'INSERT', 
                    payload,
                    offlineFirst: true 
                }
            );

            if (error) {
                // If unique violation, it might be already created
                if (error.code === '23505') {
                    const { data: existing } = await supabase
                        .from('institutions')
                        .select()
                        .eq('name', name.trim())
                        .eq('tenant_id', tenantId)
                        .single();
                    if (existing) return existing as Institution;
                }
                MonitoringService.error("[StructureService] Create institution failed", error, { name });
                throw error;
            }
            
            return data as Institution;
        } catch (error) {
            MonitoringService.error("[StructureService] Create institution unexpected error", error);
            throw error;
        }
    },

    updateInstitution: async (id: string, updateData: { name?: string; status?: StructureStatus }) => {
        try {
            const { tenantId } = await tenantContext();

            const { data: updated, error } = await safeQuery(() => 
                supabase
                    .from('institutions')
                    .update({
                        ...updateData,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', id)
                    .eq('tenant_id', tenantId)
                    .select()
                    .single(),
                { table: 'institutions', type: 'UPDATE', payload: updateData }
            );

            if (error) throw error;
            return updated as Institution;
        } catch (error) {
            MonitoringService.error("[StructureService] Update institution failed", error, { id });
            throw error;
        }
    },

    // Departments
    getDepartments: async (showArchived = false) => {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => {
                let query = supabase
                    .from('units')
                    .select('*')
                    .eq('tenant_id', tenantId);

                return query.order('name', { ascending: true });
            }, { table: 'units' });

            if (error) throw error;

            return {
                departments: (data || []) as Department[]
            };
        } catch (error: any) {
            MonitoringService.error("[StructureService] Failed to fetch departments", error);
            throw error;
        }
    },

    createDepartment: async (name: string) => {
        try {
            const { tenantId } = await tenantContext();

            const payload = {
                name: name.trim(),
                tenant_id: tenantId,
                created_at: new Date().toISOString()
            };

            const { data, error } = await safeQuery(() => 
                supabase
                    .from('units')
                    .insert([payload])
                    .select()
                    .single(),
                { 
                    table: 'units', 
                    type: 'INSERT', 
                    payload,
                    offlineFirst: true 
                }
            );

            if (error) throw error;
            return data as Department;
        } catch (error) {
            MonitoringService.error("[StructureService] Create department failed", error, { name });
            throw error;
        }
    },

    updateDepartment: async (id: string, updateData: { name?: string }) => {
        try {
            const { tenantId } = await tenantContext();

            const { data: updated, error } = await safeQuery(() => 
                supabase
                    .from('units')
                    .update(updateData)
                    .eq('id', id)
                    .eq('tenant_id', tenantId)
                    .select()
                    .single(),
                { table: 'units', type: 'UPDATE', payload: updateData }
            );

            if (error) throw error;
            return updated as Department;
        } catch (error) {
            MonitoringService.error("[StructureService] Update department failed", error, { id });
            throw error;
        }
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
