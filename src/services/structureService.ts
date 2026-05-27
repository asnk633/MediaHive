import { supabase } from '@/lib/supabaseClient';
import { Institution, Department, StructureStatus } from '@/types/structure';
import { tenantContext } from '@/lib/auth/tenantContext';
import { safeQuery } from '@/lib/safeQuery';
import { MonitoringService } from '@/services/monitoringService';

export const StructureService = {
    // Institutions
    getInstitutions: async (showArchived = false) => {
        try {
            let tenantId: string;
            try {
                const ctx = await tenantContext();
                tenantId = ctx.tenantId;
            } catch (e) {
                // Public/Signup fallback for primary tenant
                tenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
            }

            const { data, error } = await safeQuery(() => {
                let query = supabase
                    .from('institutions')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (!showArchived) {
                    query = query.eq('status', 'active');
                }

                return query.order('name', { ascending: true });
            }, { table: 'institutions', silent: true });

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

    deleteInstitution: async (id: string) => {
        try {
            const { tenantId } = await tenantContext();

            const { error } = await safeQuery(() => 
                supabase
                    .from('institutions')
                    .delete()
                    .eq('id', id)
                    .eq('tenant_id', tenantId),
                { table: 'institutions', type: 'DELETE' }
            );

            if (error) throw error;
            return true;
        } catch (error) {
            MonitoringService.error("[StructureService] Delete institution failed", error, { id });
            throw error;
        }
    },

    // Departments
    getDepartments: async (showArchived = false) => {
        try {
            let tenantId: string;
            try {
                const ctx = await tenantContext();
                tenantId = ctx.tenantId;
            } catch (e) {
                // Public/Signup fallback for primary tenant
                tenantId = '7bc0bbe7-1943-4929-a769-5fdfbc487446';
            }

            const { data, error } = await safeQuery(() => {
                let query = supabase
                    .from('departments')
                    .select('*')
                    .eq('tenant_id', tenantId);

                if (!showArchived) {
                    query = query.eq('status', 'active');
                }

                return query.order('name', { ascending: true });
            }, { table: 'departments', silent: true });

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
                status: 'active',
                tenant_id: tenantId,
                created_at: new Date().toISOString()
            };

            const { data, error } = await safeQuery(() => 
                supabase
                    .from('departments')
                    .insert([payload])
                    .select()
                    .single(),
                { 
                    table: 'departments', 
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

    updateDepartment: async (id: string, updateData: { name?: string; status?: StructureStatus }) => {
        try {
            const { tenantId } = await tenantContext();

            const { data: updated, error } = await safeQuery(() => 
                supabase
                    .from('departments')
                    .update(updateData)
                    .eq('id', id)
                    .eq('tenant_id', tenantId)
                    .select()
                    .single(),
                { table: 'departments', type: 'UPDATE', payload: updateData }
            );

            if (error) throw error;
            return updated as Department;
        } catch (error) {
            MonitoringService.error("[StructureService] Update department failed", error, { id });
            throw error;
        }
    },

    deleteDepartment: async (id: string) => {
        try {
            const { tenantId } = await tenantContext();

            const { error } = await safeQuery(() => 
                supabase
                    .from('departments')
                    .delete()
                    .eq('id', id)
                    .eq('tenant_id', tenantId),
                { table: 'departments', type: 'DELETE' }
            );

            if (error) throw error;
            return true;
        } catch (error) {
            MonitoringService.error("[StructureService] Delete department failed", error, { id });
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
    },

    convertWorkspaceType: async (id: string, currentType: 'institution' | 'department', targetType: 'institution' | 'department', name: string, status: StructureStatus) => {
        try {
            const { tenantId } = await tenantContext();

            if (currentType === targetType) {
                return;
            }

            if (targetType === 'department') {
                // Convert Institution -> Department
                const { data: inst, error: fetchErr } = await supabase
                    .from('institutions')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (fetchErr) throw fetchErr;

                const { data: newDept, error: insertErr } = await supabase
                    .from('departments')
                    .insert([{
                        name: name.trim(),
                        status: status,
                        features: inst.features || {},
                        tenant_id: tenantId,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                if (insertErr) throw insertErr;

                // Migrate users from user_institutions to profiles
                const { data: members, error: membersErr } = await supabase
                    .from('user_institutions')
                    .select('user_id')
                    .eq('institution_id', id);
                
                if (!membersErr && members && members.length > 0) {
                    const userIds = members.map(m => m.user_id);
                    const { error: profileErr } = await supabase
                        .from('profiles')
                        .update({ department_id: newDept.id })
                        .in('id', userIds);
                    if (profileErr) console.error("Error migrating user profiles:", profileErr);
                }

                await supabase
                    .from('user_institutions')
                    .delete()
                    .eq('institution_id', id);

                const { error: deleteErr } = await supabase
                    .from('institutions')
                    .delete()
                    .eq('id', id);
                if (deleteErr) throw deleteErr;

                return newDept;
            } else {
                // Convert Department -> Institution
                const { data: dept, error: fetchErr } = await supabase
                    .from('departments')
                    .select('*')
                    .eq('id', id)
                    .single();
                if (fetchErr) throw fetchErr;

                const { data: newInst, error: insertErr } = await supabase
                    .from('institutions')
                    .insert([{
                        name: name.trim(),
                        status: status,
                        features: dept.features || {},
                        tenant_id: tenantId,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();
                if (insertErr) throw insertErr;

                // Migrate users from profiles to user_institutions
                const { data: members, error: membersErr } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('department_id', id);

                if (!membersErr && members && members.length > 0) {
                    const userInstitutions = members.map(m => ({
                        user_id: m.id,
                        institution_id: newInst.id,
                        tenant_id: tenantId,
                        role: 'member',
                        created_at: new Date().toISOString()
                    }));

                    const { error: junctionErr } = await supabase
                        .from('user_institutions')
                        .insert(userInstitutions);
                    if (junctionErr) console.error("Error creating user_institutions assignments:", junctionErr);

                    const userIds = members.map(m => m.id);
                    await supabase
                        .from('profiles')
                        .update({ department_id: null })
                        .in('id', userIds);
                }

                const { error: deleteErr } = await supabase
                    .from('departments')
                    .delete()
                    .eq('id', id);
                if (deleteErr) throw deleteErr;

                return newInst;
            }
        } catch (error) {
            MonitoringService.error("[StructureService] Convert workspace type failed", error, { id, currentType, targetType });
            throw error;
        }
    }
};
