import { NextRequest, NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;
        if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        const { db, tenantId, user: adminUser } = await withTenant();

        // Admin check
        const role = (adminUser.app_metadata?.role || adminUser.user_metadata?.role) as string;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { status, updated_by } = body;

        if (!status || !['active', 'disabled'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
        }

        // Update Supabase with tenant scoping
        const { error } = await db
            .from('profiles')
            .update({
                status,
                status_updated_at: new Date().toISOString(),
                status_updated_by: updated_by || adminUser.id
            })
            .eq('tenant_id', tenantId)
            .eq('id', userId);

        if (error) return handleApiError('USER_STATUS_UPDATE', error);

        console.log(`[DB] query executed: updated status for user ${userId} to ${status}`);
        return NextResponse.json({ success: true, message: `User status updated to ${status}` });

    } catch (error: any) {
        return handleApiError('USER_STATUS_PUT_ROUTE', error);
    }
}
