import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, getSupabaseAdmin } from '@/lib/verifyUser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { authorized, user, response } = await verifyAdmin(request);
        if (!authorized) return response;
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!user.tenant_id) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('settings')
            .eq('id', user.tenant_id)
            .single();

        if (error) throw error;

        const settings = tenant?.settings || {};
        const featureOverrides = settings.featureOverrides || {};

        return NextResponse.json({ featureOverrides });
    } catch (error: any) {
        console.error('[GET Features Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { authorized, user, response } = await verifyAdmin(request);
        if (!authorized) return response;
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!user.tenant_id) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        const body = await request.json();
        const { featureOverrides } = body;

        if (!featureOverrides || typeof featureOverrides !== 'object') {
            return NextResponse.json({ error: 'Invalid featureOverrides data' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // 1. Fetch current settings to avoid overwriting other keys
        const { data: tenant, error: fetchError } = await supabase
            .from('tenants')
            .select('settings')
            .eq('id', user.tenant_id)
            .single();

        if (fetchError) throw fetchError;

        const currentSettings = tenant?.settings || {};
        
        // 2. Merge overrides
        const updatedSettings = {
            ...currentSettings,
            featureOverrides: {
                ...(currentSettings.featureOverrides || {}),
                ...featureOverrides
            }
        };

        // 3. Save back
        const { error: updateError } = await supabase
            .from('tenants')
            .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
            .eq('id', user.tenant_id);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, featureOverrides: updatedSettings.featureOverrides });
    } catch (error: any) {
        console.error('[PUT Features Error]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
