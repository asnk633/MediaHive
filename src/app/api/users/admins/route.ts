// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        console.log('[API] GET /api/users/admins called');

        // Relaxed: Allow any authenticated user to fetch admin list
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) {
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const { data: adminsList, error } = await supabase
            .from('profiles')
            .select('id, role, full_name, official_name, email, avatar_url')
            .eq('role', 'admin');

        if (error) {
            console.error('Supabase fetch admins error:', error);
            throw error;
        }

        const admins = (adminsList || []).map(profile => ({
            uid: profile.id,
            name: profile.full_name || profile.official_name || profile.email?.split('@')[0] || 'Admin',
            avatar_url: profile.avatar_url || null,
            photoURL: profile.avatar_url || null // Backward compatibility
        }));

        return NextResponse.json({ admins });
    } catch (error: any) {
        console.error('Error fetching admins:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch admins' }, { status: 500 });
    }
}
