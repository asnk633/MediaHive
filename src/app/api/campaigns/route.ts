import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns
 * Fetch campaigns scoped by institution_id
 */
export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseFromRequest(req);
        if (!supabase) {
            return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
        }

        const { data: campaigns, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('institution_id', user.institution_id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[GET /api/campaigns] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ campaigns: campaigns || [] });
    } catch (error: any) {
        console.error('[GET /api/campaigns] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/campaigns
 * Create a new campaign scoped to the user's institution
 */
export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin or team (guests might be restricted depending on policy)
        // For now, allowing guests to create if that's the requirement, but usually it's Admin/Team.
        // The prompt says "Read-only for guest" in context of RLS, so let's enforce it here too.
        if (user.role === 'guest') {
            return NextResponse.json({ error: 'Guests cannot create campaigns' }, { status: 403 });
        }

        const body = await req.json();

        // Prepare data for Supabase (snake_case columns expected)
        const campaignData = {
            name: body.name,
            description: body.description,
            start_date: body.startDate || body.start_date,
            end_date: body.endDate || body.end_date,
            phase: body.phase || 'planning',
            drive_folder_id: body.driveFolderId,
            owner_id: user.uid,
            institution_id: user.institution_id,
            tenant_id: (user as any).tenantId || 1,
            members: body.members || [user.uid],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const supabase = getSupabaseFromRequest(req);
        if (!supabase) {
            return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .insert(campaignData)
            .select()
            .single();

        if (error) {
            console.error('[POST /api/campaigns] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, id: data.id }, { status: 201 });
    } catch (error: any) {
        console.error('[POST /api/campaigns] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
