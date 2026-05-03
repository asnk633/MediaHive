// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

/**
 * GET /api/users/[id]
 * Fetches a single user by their ID
 * 
 * Authorization:
 * - Users can fetch their own profile
 * - Admins can fetch any user's profile
 */

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: userId } = await params;

        if (userId === 'admins' || userId === 'team') {
            return NextResponse.json({ error: 'Route conflict' }, { status: 404 });
        }

        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.uid !== userId && user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) {
            return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: { uid: profile.id, ...profile } });
    } catch (error: any) {
        console.error(`[API] GET /api/users/${(await params).id} error:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
