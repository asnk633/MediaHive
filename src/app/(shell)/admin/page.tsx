import React from 'react';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { getSupabaseServerClient } from '@/lib/supabaseServerClient';
import { TABLES } from '@/lib/dbTables';
import { TenantMetrics } from '@/services/adminService';

// Disable caching for this admin dashboard since metrics are real-time
export const dynamic = 'force-dynamic';

async function getMetricsOnServer(): Promise<TenantMetrics> {
    const supabase = await getSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        return { totalUsers: 0, activeWorkspaces: 0, pendingInvites: 0 };
    }
    
    let tenantId = session.user?.app_metadata?.tenant_id || session.user?.user_metadata?.tenant_id;
    
    if (!tenantId) {
        const { data: profile } = await supabase
            .from(TABLES.USERS)
            .select('tenant_id')
            .eq('id', session.user.id)
            .single();
        if (profile) {
            tenantId = profile.tenant_id;
        }
    }

    if (!tenantId) {
        return { totalUsers: 0, activeWorkspaces: 0, pendingInvites: 0 };
    }

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
}

export default async function AdminDashboardPage() {
    const metrics = await getMetricsOnServer();
    return <AdminDashboardClient metrics={metrics} />;
}
