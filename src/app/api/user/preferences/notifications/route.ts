// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Fetch notification settings from the profiles table
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('notification_settings')
            .eq('id', user.uid)
            .single();

        if (error) {
            console.warn('[API] Preferences fetch error (expected if column missing):', error.message);
            return NextResponse.json({ notifications: null });
        }

        return NextResponse.json({ notifications: profile?.notification_settings || null });
    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { notifications } = body;

        if (!notifications || typeof notifications !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const supabase = await getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Validate fields
        const validKeys = ['deviceRequests', 'taskAssignments', 'systemUpdates'];
        const clean: any = {};

        for (const key of validKeys) {
            if (typeof notifications[key] === 'boolean') {
                clean[key] = notifications[key];
            }
        }

        // Update the profiles table
        const { error } = await supabase
            .from('profiles')
            .update({
                notification_settings: clean,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.uid);

        if (error) throw error;

        return NextResponse.json({ message: 'Preferences updated', notifications: clean });
    } catch (error: any) {
        console.error('Error updating preferences:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
