// @ts-nocheck
import { verifyUser } from '@/lib/server-utils';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { hasRole } from '@/lib/permissions';
import { logEventCreated, logEventDeleted } from '@/app/api/_lib/audit';

export const dynamic = 'force-dynamic';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single event fetch
    if (id) {
      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(event, { status: 200 });
    }

    // List events with filtering
    let query = supabase.from('events').select('*');

    // Filter by tenant/institution
    if (user.institution_id) {
      query = query.eq('institution_id', user.institution_id);
    }

    // Non-admin users only see approved events
    if (user.role !== 'admin') {
      query = query.eq('approval_status', 'approved');
    }

    // Date Range Filtering
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (startDate && endDate) {
      query = query.gte('start_at', startDate).lte('start_at', endDate);
      query = query.order('start_at', { ascending: true });
      query = query.limit(1000);
    } else {
      query = query.order('start_at', { ascending: false });
      const limitParam = parseInt(searchParams.get('limit') || '50', 10);
      const safeLimit = Math.min(Math.max(limitParam, 1), 100);
      query = query.limit(safeLimit);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Events GET error:', error);
      throw error;
    }

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create events
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
    }

    if (!body.start_at) {
      return NextResponse.json({ error: 'Start date (start_at) is required' }, { status: 400 });
    }

    // Admin events are auto-approved, others need approval
    const initialStatus = user.role === 'admin' ? 'approved' : 'pending';

    // Explicitly handle "On Behalf Of" data
    const on_behalf_of = body.on_behalf_of || null;
    const organizer = body.organizer || null;

    // Default created_by is the authenticated user
    const created_by = {
      uid: user.uid,
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      role: user.role
    };

    const institution_id = body.institution_id || user.institution_id;
    const department_id = body.department_id || user.department_id || null;

    // Prepare event data for Supabase
    const eventData = {
      ...body,
      status: initialStatus, // Legacy field for compat
      approval_status: initialStatus,
      created_by,
      on_behalf_of,
      organizer,
      institution_id,
      department_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Ensure media_coverage is an array
    if (eventData.media_coverage && !Array.isArray(eventData.media_coverage)) {
      eventData.media_coverage = [eventData.media_coverage];
    } else if (!eventData.media_coverage) {
      eventData.media_coverage = [];
    }

    const { data: createdEvent, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      console.error('Event POST insert error:', error);
      throw error;
    }

    // Log audit event
    await logEventCreated(
      user.uid,
      user.tenantId || 1,
      createdEvent.id,
      { title: body.title, status: initialStatus }
    );

    return NextResponse.json({ data: createdEvent }, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete events
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if event exists and if user has permission
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only creator or admin can delete
    // Note: checking created_by object from JSONB
    if (existingEvent.created_by?.uid !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Log audit event
    try {
      await logEventDeleted(
        user.uid,
        user.tenantId || 1,
        id
      );
    } catch (auditError) {
      console.error('Audit logging failed for DELETE event:', auditError);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
