import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { getSupabaseAdmin } from '@/lib/server/supabase-admin';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

const TABLE = 'device_requests';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[PATCH /api/inventory/requests/[id]] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { action, ...updates } = body;

        const supabase = getSupabaseAdmin();

        let payload: any = {};

        if (action === 'approve') {
            if (user.role !== 'admin' && user.role !== 'team') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            payload = {
                status: 'approved',
                approvedBy: user.uid,
                approvedAt: new Date().toISOString()
            };
        } else if (action === 'reject') {
            if (user.role !== 'admin' && user.role !== 'team') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            payload = {
                status: 'rejected',
                rejectionReason: updates.reason
            };
        } else if (action === 'mark_issued') {
            payload = {
                status: 'issued',
                issuedIssueId: updates.issueId
            };
        } else {
            // Generic update if needed
            payload = updates;
        }

        const { error } = await withTenant(
            supabase
                .from(TABLE)
                .update(payload),
            tenantId
        )
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating inventory request:', error);
        return NextResponse.json({ error: error.message || 'Failed to update request' }, { status: 500 });
    }
}
