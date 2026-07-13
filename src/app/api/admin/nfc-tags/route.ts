import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    // Query Supabase directly — NFC tags are stored in the remote DB
    const supabase = getSupabaseAdmin();
    const { data: tags, error } = await supabase
      .from('nfc_tags')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/nfc-tags] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to fetch NFC tags: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(tags || [], { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/admin/nfc-tags] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { tagName, tagId, tagType, latitude, longitude, radius, campusId, campusName, wifiSsids, accuracy } = body;

    // Validate presence of required fields
    if (!tagName || !tagId || !tagType || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tagName, tagId, tagType, latitude, longitude are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const newTag = {
      id: randomUUID(),
      tagName,
      tagId,
      tagType,
      latitude: Number(latitude),
      longitude: Number(longitude),
      radius: radius !== undefined ? Number(radius) : 50.0,
      active: true,
      createdAt: new Date().toISOString(),
      campusId: campusId || null,
      campusName: campusName || null,
      wifi_ssids: wifiSsids || null,
      accuracy: accuracy !== undefined ? Number(accuracy) : 0,
    };

    const { data: inserted, error } = await supabase
      .from('nfc_tags')
      .insert(newTag)
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/nfc-tags] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to create NFC tag: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/nfc-tags] Error:', error.message);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
