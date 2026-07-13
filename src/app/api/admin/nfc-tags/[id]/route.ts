import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.tagName !== undefined) updateData.tagName = body.tagName;
    if (body.tagId !== undefined) updateData.tagId = body.tagId;
    if (body.tagType !== undefined) updateData.tagType = body.tagType;
    if (body.latitude !== undefined) updateData.latitude = Number(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = Number(body.longitude);
    if (body.radius !== undefined) updateData.radius = Number(body.radius);
    if (body.active !== undefined) updateData.active = Boolean(body.active);
    if (body.campusId !== undefined) updateData.campusId = body.campusId;
    if (body.campusName !== undefined) updateData.campusName = body.campusName;
    if (body.wifiSsids !== undefined) updateData.wifi_ssids = body.wifiSsids;
    if (body.accuracy !== undefined) updateData.accuracy = body.accuracy !== null ? Number(body.accuracy) : 0;

    const supabase = getSupabaseAdmin();
    const { data: updated, error } = await supabase
      .from('nfc_tags')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'NFC tag not found' }, { status: 404 });
      }
      console.error('[PUT /api/admin/nfc-tags/[id]] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to update NFC tag: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error('[PUT /api/admin/nfc-tags/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('nfc_tags')
      .update({
        active: false,
        deletedAt: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/nfc-tags/[id]] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to delete NFC tag: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'NFC tag soft-deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[DELETE /api/admin/nfc-tags/[id]] Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
