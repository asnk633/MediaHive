import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server/server-utils';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

/**
 * GET /api/campaigns/[id]
 * Fetch a single campaign scoped by institution_id
 */
export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/campaigns/[id]] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const supabase = await getSupabaseFromRequest(req);
        if (!supabase) {
            return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
        }

        const { data: campaign, error } = await withTenant(
            supabase
                .from('campaigns')
                .select('*'),
            tenantId
        )
            .eq('id', id)
            .single();

        if (error || !campaign) {
            return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({ campaign });
    } catch (error: any) {
        console.error('[GET /api/campaigns/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PUT /api/campaigns/[id]
 * Update a campaign scoped by institution_id
 */
export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[PUT /api/campaigns/[id]] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        // Guests cannot update campaigns
        if (user.role === 'guest') {
            return NextResponse.json({ error: 'Guests cannot update campaigns' }, { status: 403 });
        }

        const body = await req.json();
        const updates = body.updates || body; // Support both wrapped and unwrapped updates

        // Prepare update data (mapping common fields)
        const updateData: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.name) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.phase) updateData.phase = updates.phase;
        if (updates.startDate || updates.start_date) updateData.start_date = updates.startDate || updates.start_date;
        if (updates.endDate || updates.end_date) updateData.end_date = updates.endDate || updates.end_date;
        if (updates.driveFolderId) updateData.drive_folder_id = updates.driveFolderId;
        if (updates.members) updateData.members = updates.members;

        const supabase = await getSupabaseFromRequest(req);
        if (!supabase) {
            return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
        }

        const { data: campaign, error } = await withTenant(
            supabase
                .from('campaigns')
                .update(updateData),
            tenantId
        )
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[PUT /api/campaigns/[id]] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ campaign, success: true });
    } catch (error: any) {
        console.error('[PUT /api/campaigns/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * DELETE /api/campaigns/[id]
 * Delete a campaign (Admin/Team only)
 */
export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const user = await verifyUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[DELETE /api/campaigns/[id]] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        // Admin/Team only for deletion
        if (!user.role || !['admin', 'team'].includes(user.role as string)) {
            return NextResponse.json({ error: 'Only admins or team members can delete campaigns' }, { status: 403 });
        }

        const supabase = await getSupabaseFromRequest(req);
        if (!supabase) {
            return NextResponse.json({ error: 'Failed to initialize Supabase' }, { status: 500 });
        }

        const { error } = await withTenant(
            supabase
                .from('campaigns')
                .delete(),
            tenantId
        )
            .eq('id', id);

        if (error) {
            console.error('[DELETE /api/campaigns/[id]] Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DELETE /api/campaigns/[id]] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
