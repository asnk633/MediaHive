import { NextResponse } from 'next/server';
import { verifyUser } from '@/lib/server/server-utils';
import { getSupabaseAdmin } from '@/lib/verifyUser';
import { TABLES } from '@/lib/dbTables';

export async function GET(req: Request) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleContext = searchParams.get('roleContext') || user.role;

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('dashboard_layouts')
      .select('layout_json')
      .eq('user_id', user.uid)
      .eq('role_context', roleContext)
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is not found
      throw error;
    }

    return NextResponse.json({ layout: data?.layout_json ? JSON.parse(data.layout_json) : null });
  } catch (error: any) {
    console.error('[Dashboard Layout GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard layout', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { layout, roleContext = user.role } = body;

    if (!layout) {
      return NextResponse.json({ error: 'Layout is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Check if layout exists
    const { data: existing } = await supabaseAdmin
      .from('dashboard_layouts')
      .select('id')
      .eq('user_id', user.uid)
      .eq('role_context', roleContext)
      .eq('tenant_id', user.tenant_id)
      .single();

    let resultError;
    if (existing) {
      const { error } = await supabaseAdmin
        .from('dashboard_layouts')
        .update({ layout_json: JSON.stringify(layout), updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      resultError = error;
    } else {
      const { error } = await supabaseAdmin
        .from('dashboard_layouts')
        .insert({
          user_id: user.uid,
          role_context: roleContext,
          layout_json: JSON.stringify(layout),
          tenant_id: user.tenant_id,
        });
      resultError = error;
    }

    if (resultError) throw resultError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Dashboard Layout POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to save dashboard layout', details: error.message },
      { status: 500 }
    );
  }
}
