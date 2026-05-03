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
    const user = await verifyUser(req);
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

    console.log(`[API][TASKS][BULK] Processing ${updates.length} updates for tenant: ${tenantId}`);

    // Add metadata to each update and ensure tenant isolation
    const processedUpdates = updates.map(u => ({
      ...u,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
      updated_by: user.uid,
      // We increment version on the backend via trigger, 
      // but we can also set it here if we want to be explicit.
    }));

    // Use Supabase upsert for bulk processing
    const { data, error } = await supabase
      .from('tasks')
      .upsert(processedUpdates, { onConflict: 'id' })
      .select('id');

    if (error) {
      MonitoringService.error(error, { tenantId, userId: user.uid, updateCount: updates.length });
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      updatedIds: data?.map((d: { id: string }) => d.id) || []
    });

  } catch (error: any) {
    console.error('[API][TASKS][BULK] Critical Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: error.details || null
    }, { status: 500 });
  }
}
