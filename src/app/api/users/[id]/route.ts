import { NextRequest, NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        if (userId === 'admins' || (userId === 'manager' || userId === 'member')) {
            return NextResponse.json({ error: 'Route conflict' }, { status: 404 });
        }

        const { db, tenantId, user } = await withTenant();

        // Basic permission check
        const role = (user.app_metadata?.role || user.user_metadata?.role) as string;
        if (user.id !== userId && role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: profile, error } = await db
            .from('profiles')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', userId)
            .single();

        if (error) return handleApiError('USER_FETCH', error);
        if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        console.log(`[DB] query executed: fetched profile for user ${userId}`);
        return NextResponse.json({ user: { uid: profile.id, ...profile } });
    } catch (error: any) {
        return handleApiError('USER_GET_ROUTE', error);
    }
}
