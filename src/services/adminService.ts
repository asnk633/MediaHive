import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
import { MonitoringService } from '@/services/monitoringService';
import { User } from '@/types/user';
import { Institution } from '@/types/structure';

export interface TenantMetrics {
    totalUsers: number;
    activeWorkspaces: number;
    pendingInvites: number;
}

export const AdminService = {
    /**
     * Get system-wide metrics for the tenant
     */
    getTenantOverview: async (): Promise<TenantMetrics> => {
        try {
            const { tenantId } = await tenantContext();

            const [usersCount, instCount, invitesCount] = await Promise.all([
                supabase.from(TABLES.USERS).select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
                supabase.from('institutions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'active'),
                supabase.from('invites').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId)
            ]);

            return {
                totalUsers: usersCount.count || 0,
                activeWorkspaces: instCount.count || 0,
                pendingInvites: invitesCount.count || 0
            };
        } catch (error) {
            MonitoringService.error('[AdminService] Failed to fetch metrics', error);
            return { totalUsers: 0, activeWorkspaces: 0, pendingInvites: 0 };
        }
    },

    /**
     * Fetch all institutions and departments with metadata
     */
    getAllWorkspaces: async (): Promise<(Institution & { type: 'institution' | 'department' })[]> => {
        try {
            const { tenantId } = await tenantContext();
            
            // 1. Fetch Institutions with member counts
            const { data: instData, error: instError } = await safeQuery(() => 
                supabase
                    .from('institutions')
                    .select('*, user_institutions(count)')
                    .eq('tenant_id', tenantId)
                    .order('name')
            );
            if (instError) throw instError;

            // 2. Fetch Departments with member counts from profiles
            const { data: deptData, error: deptError } = await safeQuery(() => 
                supabase
                    .from('departments')
                    .select('*')
                    .eq('tenant_id', tenantId)
                    .order('name')
            );
            if (deptError) throw deptError;

            // 3. Fetch Department member counts manually
            const { data: deptCounts, error: countError } = await supabase
                .from('profiles')
                .select('department_id')
                .eq('tenant_id', tenantId)
                .not('department_id', 'is', null);

            const deptCountMap = (deptCounts || []).reduce((acc: any, curr: any) => {
                acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
                return acc;
            }, {});

            // 4. Combine and unify with validation
            const { InstitutionSchema } = await import('@/domain/schemas');
            
            const institutions = ((instData as any[]) || []).map(inst => {
                const validation = InstitutionSchema.safeParse(inst);
                if (!validation.success) {
                    console.warn(`[AdminService] Institution ${inst.id} validation failed:`, validation.error.format());
                }
                return {
                    ...inst,
                    type: 'institution' as const,
                    userCount: inst.user_institutions?.[0]?.count || 0
                };
            });

            const departments = ((deptData as any[]) || []).map(dept => {
                // Departments currently follow institution schema or simplified version
                return {
                    ...dept,
                    id: String(dept.id), // Ensure string ID for consistency
                    type: 'department' as const,
                    userCount: deptCountMap[dept.id] || 0
                };
            });

            return [...institutions, ...departments].sort((a, b) => a.name.localeCompare(b.name));
        } catch (error) {
            MonitoringService.error('[AdminService] Failed to fetch workspaces', error);
            return [];
        }
    },

    /**
     * Update module feature toggles for a workspace
     */
    updateWorkspaceFeatures: async (id: string, features: Record<string, boolean>, type: 'institution' | 'department' = 'institution') => {
        try {
            const table = type === 'department' ? 'departments' : 'institutions';
            const { error } = await supabase
                .from(table)
                .update({ features, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error(`[AdminService] Failed to update ${type} features:`, error);
            throw error;
        }
    },

    /**
     * Get all institutional roles for a specific user
     */
    getUserWorkspaceAccess: async (userId: string): Promise<any[]> => {
        try {
            const { data, error } = await safeQuery(() => 
                supabase
                    .from('user_institutions')
                    .select('*, institutions(name)')
                    .eq('user_id', userId)
            );

            if (error) throw error;
            return (data as any[]) || [];
        } catch (error) {
            console.error('[AdminService] Failed to fetch user workspace access:', error);
            return [];
        }
    },

    /**
     * Set role for a user in a specific workspace
     */
    setUserWorkspaceRole: async (userId: string, institutionId: string, role: string) => {
        try {
            const { tenantId } = await tenantContext();

            // Upsert role in junction table
            const { error } = await supabase
                .from('user_institutions')
                .upsert({
                    user_id: userId,
                    institution_id: institutionId,
                    tenant_id: tenantId,
                    role,
                    created_at: new Date().toISOString()
                }, { onConflict: 'user_id, institution_id' });

            if (error) throw error;
        } catch (error) {
            console.error('[AdminService] Failed to set user workspace role:', error);
            throw error;
        }
    },

    /**
     * Remove user access to a workspace
     */
    removeUserWorkspaceAccess: async (userId: string, institutionId: string) => {
        try {
            const { error } = await supabase
                .from('user_institutions')
                .delete()
                .eq('user_id', userId)
                .eq('institution_id', institutionId);

            if (error) throw error;
        } catch (error) {
            MonitoringService.error('[AdminService] Failed to remove user workspace access', error, { userId, institutionId });
            throw error;
        }
    },

    /**
     * Create a new user invitation with multi-workspace roles
     */
    createInvitation: async (email: string, workspaces: Record<string, string>) => {
        try {
            const response = await fetch('/ap' + 'i/invites/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, workspaces })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to create invitation');
            
            return { invite: data.invite, link: data.link };
        } catch (error) {
            console.error('[AdminService] Failed to create invitation:', error);
            throw error;
        }
    },

    /**
     * Fetch all invitations for the tenant
     */
    getInvitations: async () => {
        const { tenantId } = await tenantContext();
        const { data, error } = await supabase
            .from('invites')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as any[]) || [];
    },

    /**
     * Cancel a pending invitation
     */
    cancelInvitation: async (inviteId: string) => {
        const { error } = await supabase
            .from('invites')
            .delete()
            .eq('id', inviteId);

        if (error) throw error;
        return true;
    },

    /**
     * Permanently delete a user account and their associated data.
     * This calls a secure RPC function on the server.
     */
    deleteUser: async (uid: string) => {
        const { error } = await supabase.rpc('delete_user_permanently', {
            target_user_id: uid
        });

        if (error) {
            MonitoringService.error('[AdminService] Failed to permanently delete user', error, { uid });
            throw error;
        }
        return true;
    }
};
