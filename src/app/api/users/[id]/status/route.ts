// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';
import { getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify Admin Access
        await requireAdminWithVerifiedEmail(request);

        // 2. Await Params
        const { id: userId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 3. Parse Body
        const body = await request.json();
        const { status, updated_by } = body;

        if (!status || !['active', 'disabled'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status provided' }, { status: 400 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // 4. Update Supabase
        const { error } = await supabase
            .from('profiles')
            .update({
                status,
                status_updated_at: new Date().toISOString(),
                status_updated_by: updated_by || 'admin'
            })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true, message: `User status updated to ${status}` });

    } catch (error: any) {
        console.error(`[API] Error updating user status:`, error);
        return NextResponse.json(
            { error: error.message || 'Failed to update user status' },
            { status: 500 }
        );
    }
}
