import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Only fetch users with 'team' role
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, role, full_name, official_name, email, avatar_url')
            .eq('role', 'team');

        if (error) throw error;

        const teamMembers = (users || []).map(u => ({
            uid: u.id,
            name: u.full_name || u.official_name || u.email || 'Unknown',
            email: u.email,
            avatar_url: u.avatar_url,
            photoURL: u.avatar_url // Map for legacy compatibility
        }));

        return NextResponse.json({ teamMembers });

    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch team members' }, { status: 500 });
    }
}
