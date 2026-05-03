import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';
import { withTenant } from '@/lib/tenantQuery';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/admin/change-role] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const body = await request.json();
        const { targetUid, newRole } = body;

        if (!targetUid || !newRole) {
            return NextResponse.json(
                { error: 'Missing targetUid or newRole' },
                { status: 400 }
            );
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { error } = await withTenant(
            supabase
                .from('profiles')
                .update({ role: newRole }),
            tenantId
        )
            .eq('id', targetUid);

        if (error) throw error;

        console.log(`[API] Admin ${user.uid} changed role for ${targetUid} to ${newRole}`);

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role,
            action: 'user_role_changed',
            entityType: 'user',
            entityId: targetUid,
            summary: `Role changed for user ${targetUid} to ${newRole}`,
            severity: 'critical',
            metadata: {
                targetUid,
                newRole
            },
            visibility: { mode: 'admin' }
        });

        return NextResponse.json({
            success: true,
            message: `Role updated to ${newRole}`
        });

    } catch (error: any) {
        console.error('Error in change-role API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
