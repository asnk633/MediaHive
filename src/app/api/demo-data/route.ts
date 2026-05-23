import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/verifyUser';
import { TABLES } from '@/lib/dbTables';
import { v4 as uuidv4 } from 'uuid';

// Force dynamic execution for API route
export const dynamic = 'force-dynamic';

/**
 * GET /api/demo-data
 * Check if demo data exists for the current user's tenant
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseFromRequest(req);
    if (!supabase) {
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    const tenantId = user.tenant_id || user.tenantId || '1';

    // Check tasks count where is_demo_data is true
    const { count: taskCount, error: taskError } = await supabase
      .from(TABLES.TASKS)
      .select('id', { count: 'exact', head: true })
      .eq('is_demo_data', true)
      .eq('tenant_id', tenantId);

    if (taskError) throw taskError;

    // Check events count where is_demo_data is true
    const { count: eventCount, error: eventError } = await supabase
      .from(TABLES.EVENTS)
      .select('id', { count: 'exact', head: true })
      .eq('is_demo_data', true)
      .eq('tenant_id', tenantId);

    if (eventError) throw eventError;

    const hasDemoData = (taskCount || 0) > 0 || (eventCount || 0) > 0;

    return NextResponse.json({
      hasDemoData,
      demoDataCounts: {
        tasks: taskCount || 0,
        events: eventCount || 0,
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('[GET /api/demo-data] Error:', error);
    return NextResponse.json({
      error: 'Failed to check demo data status',
      details: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * POST /api/demo-data
 * Seed or purge demo data based on action parameter
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseFromRequest(req);
    if (!supabase) {
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    const tenantId = user.tenant_id || user.tenantId || '1';
    const institutionId = user.institution_id || '1';

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty
    }

    // Default action to 'generate' if POST is called without explicit action
    const action = body.action || 'generate';

    if (action === 'delete') {
      // 1. Purge all demo tasks and events
      const { error: taskDeleteError } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('is_demo_data', true)
        .eq('tenant_id', tenantId);

      if (taskDeleteError) throw taskDeleteError;

      const { error: eventDeleteError } = await supabase
        .from(TABLES.EVENTS)
        .delete()
        .eq('is_demo_data', true)
        .eq('tenant_id', tenantId);

      if (eventDeleteError) throw eventDeleteError;

      return NextResponse.json({
        success: true,
        message: 'Demo workspace data deleted successfully'
      }, { status: 200 });
    }

    // Generate action
    // 2. Clean up any existing demo data first to prevent duplicate seeds
    await supabase.from(TABLES.TASKS).delete().eq('is_demo_data', true).eq('tenant_id', tenantId);
    await supabase.from(TABLES.EVENTS).delete().eq('is_demo_data', true).eq('tenant_id', tenantId);

    const now = new Date();

    // 3. Build mock tasks
    const demoTasks = [
      {
        id: uuidv4(),
        title: "Botanical Symposium Coverage (Demo)",
        description: "Coordinate B-Roll film crew schedules, prep the master wireless audio receiver, and verify external microphone battery channels ahead of opening keynote address.",
        status: "todo",
        priority: "high",
        due_date: new Date(now.getTime() + 86400000 * 3).toISOString(), // 3 days from now
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        updated_by: user.uid,
        is_demo_data: true,
        is_archived: false,
        version: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: "Drone Footage Capture - Terrace Meadows (Demo)",
        description: "Perform flight safety briefing and air space visual clearance checks. Film high-resolution 4K B-roll footage of the upper terraced flower beds during golden hour.",
        status: "in_progress",
        priority: "medium",
        due_date: new Date(now.getTime() + 86400000 * 5).toISOString(), // 5 days from now
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        updated_by: user.uid,
        is_demo_data: true,
        is_archived: false,
        version: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: "Review Social Impact Video Cut (Demo)",
        description: "Perform final cut review of the 'Feed the Needy' project short-film. Ensure dynamic subtitles are aligned and audio voiceover is balanced with background tracks.",
        status: "review",
        priority: "high",
        due_date: new Date(now.getTime() + 86400000 * 2).toISOString(), // 2 days from now
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        updated_by: user.uid,
        is_demo_data: true,
        is_archived: false,
        version: 1,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: "Q1 Campaign B-Roll Organization (Demo)",
        description: "Sort, tag metadata, and catalog all footage deliverables from the Q1 campaign into the media archives folder on general cloud storage.",
        status: "done",
        priority: "low",
        due_date: new Date(now.getTime() - 86400000 * 2).toISOString(), // 2 days ago
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        updated_by: user.uid,
        is_demo_data: true,
        is_archived: false,
        version: 1,
        created_at: new Date(now.getTime() - 86400000 * 10).toISOString(),
        updated_at: now.toISOString(),
      }
    ];

    // 4. Insert mock tasks
    const { error: taskInsertError } = await supabase
      .from(TABLES.TASKS)
      .insert(demoTasks);

    if (taskInsertError) throw taskInsertError;

    // 5. Build mock events
    const demoEvents = [
      {
        id: uuidv4(),
        title: "Symposium Live Broadcast Session (Demo)",
        description: "Live-stream broadcast of the opening keynote session of the Annual Botanical Symposium.",
        start_time: new Date(now.getTime() + 86400000 * 3 + 3600000 * 2).toISOString(), // 3 days from now, afternoon
        end_time: new Date(now.getTime() + 86400000 * 3 + 3600000 * 4).toISOString(),
        approval_status: "approved",
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        is_demo_data: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: uuidv4(),
        title: "Drone Pre-Flight Safety Briefing (Demo)",
        description: "Operational briefing for the crew covering airspace safety limits and coordinate targets.",
        start_time: new Date(now.getTime() + 86400000 * 5).toISOString(), // 5 days from now
        end_time: new Date(now.getTime() + 86400000 * 5 + 3600000).toISOString(),
        approval_status: "approved",
        tenant_id: tenantId,
        institution_id: institutionId,
        created_by: user.uid,
        is_demo_data: true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    ];

    // 6. Insert mock events
    const { error: eventInsertError } = await supabase
      .from(TABLES.EVENTS)
      .insert(demoEvents);

    if (eventInsertError) throw eventInsertError;

    return NextResponse.json({
      success: true,
      message: 'Demo workspace data generated successfully',
      data: {
        tasksCreated: demoTasks.length,
        eventsCreated: demoEvents.length
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('[POST /api/demo-data] Error:', error);
    return NextResponse.json({
      error: 'Failed to process demo data action',
      details: error.message || String(error)
    }, { status: 500 });
  }
}

/**
 * DELETE /api/demo-data
 * Delete all demo data for the current user's tenant
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseFromRequest(req);
    if (!supabase) {
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    const tenantId = user.tenant_id || user.tenantId || '1';

    const { error: taskDeleteError } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('is_demo_data', true)
      .eq('tenant_id', tenantId);

    if (taskDeleteError) throw taskDeleteError;

    const { error: eventDeleteError } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('is_demo_data', true)
      .eq('tenant_id', tenantId);

    if (eventDeleteError) throw eventDeleteError;

    return NextResponse.json({
      success: true,
      message: 'Demo workspace data deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[DELETE /api/demo-data] Error:', error);
    return NextResponse.json({
      error: 'Failed to delete demo data',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
