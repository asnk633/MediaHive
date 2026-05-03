import { supabase } from '@/lib/supabaseClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
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
            console.error('[AdminService] Failed to fetch metrics:', error);
            return { totalUsers: 0, activeWorkspaces: 0, pendingInvites: 0 };
        }
    },

    /**
     * Fetch all institutions with metadata
     */
    getAllWorkspaces: async (): Promise<Institution[]> => {
        try {
            const { tenantId } = await tenantContext();
            const { data, error } = await safeQuery(() => 
                supabase
                    .from('institutions')
                    .select('*, user_institutions(count)')
                    .eq('tenant_id', tenantId)
                    .order('name')
            );

            if (error) throw error;
            return ((data as any[]) || []).map((inst: any) => ({
                ...inst,
                userCount: inst.user_institutions?.[0]?.count || 0
            }));
        } catch (error) {
            console.error('[AdminService] Failed to fetch workspaces:', error);
            return [];
        }
    },

    /**
     * Update module feature toggles for a workspace
     */
    updateWorkspaceFeatures: async (id: string, features: Record<string, boolean>) => {
        try {
            const { error } = await supabase
                .from('institutions')
                .update({ features, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
        } catch (error) {
            console.error('[AdminService] Failed to update features:', error);
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
            console.error('[AdminService] Failed to remove user workspace access:', error);
            throw error;
        }
    },

    /**
     * Create a new user invitation with multi-workspace roles
     */
    createInvitation: async (email: string, workspaces: Record<string, string>) => {
        try {
            const response = await fetch('/api/invites/send', {
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
    }
};
