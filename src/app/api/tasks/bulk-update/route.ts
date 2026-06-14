import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { verifyUser } from '@/lib/verifyUser';
import { MonitoringService } from '@/services/monitoringService';

/**
 * POST /api/tasks/bulk-update
 * Processes batch updates for multiple tasks atomically.
 */
export async function POST(req: Request) {
  try {
    const [user, userVerificationPromise] = await Promise.all([verifyUser(req), new Promise(resolve => setTimeout(resolve, 100))]);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { updates } = await req.json();

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'Invalid payload: updates must be a non-empty array' }, { status: 400 });
    }

    const tenantId = user.tenant_id || user.tenantId;
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
    }

    // console.log(`[API][TASKS][BULK] Processing ${updates.length} updates for tenant: ${tenantId}`);

    const ids = updates.map(u => u.id).filter(id => id !== undefined && id !== null && typeof id === 'string');
    
    // 1. Fetch current versions from DB
    const { data: currentRecords, error: fetchError } = await supabase
      .from('tasks')
      .select('id, version')
      .in('id', ids);

    if (fetchError) throw fetchError;

    const versionMap = new Map(currentRecords?.map((r: any) => [r.id, r.version]) || []);
    const conflicts: any[] = [];
    const validUpdates: any[] = [];

    // 2. Perform Version Check (OCC)
    for (const update of updates) {
      const task = await supabase.from('tasks').select('*').eq('id', update.id).single();
if (!task || !task.data) {
  console.warn(`[API][TASKS][BULK] Task not found for id: ${update.id}`);
  continue;
}
const serverVersion = task.data.version;
if (update.owner_id !== user.uid) {
  console.warn(`[API][TASKS][BULK] Unauthorized update attempt by user ${user.uid} on task ${update.id}`);
  conflicts.push({
    id: update.id,
    error: 'UNAUTHORIZED_UPDATE'
  });
  continue;
}
      
      // If version is provided, it MUST match the server version
      if (update.version !== undefined && serverVersion !== undefined && update.version !== serverVersion) {
        // console.warn(`[API][TASKS][BULK] ⚔️ Version conflict for task ${update.id}. Server: ${serverVersion}, Payload: ${update.version}`);
        conflicts.push({ 
          id: update.id, 
          serverVersion, 
          payloadVersion: update.version,
          error: 'VERSION_CONFLICT'
        });
        continue;
      }

      validUpdates.push({
        ...update,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
        updated_by: user.uid,
      });
    }

    if (conflicts.length > 0 && validUpdates.length === 0) {
      return NextResponse.json({ 
        error: 'All updates failed due to version conflicts', 
        conflicts 
      }, { status: 409 });
    }

    // 3. Process Valid Updates
    const { data, error } = await supabase
      .from('tasks')
      .upsert(validUpdates, { onConflict: 'id' })
      .select('id');

    if (error) {
      MonitoringService.error(error, { tenantId, userId: user.uid, updateCount: validUpdates.length });
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      updatedIds: data?.map((d: { id: string }) => d.id) || [],
      conflicts: conflicts.length > 0 ? conflicts : undefined
    }, { status: conflicts.length > 0 ? 207 : 200 }); // 207 Multi-Status if partial success

  } catch (error: any) {
    // // console.error('[API][TASKS][BULK] Critical Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: error.details || null
    }, { status: 500 });
  }
}
