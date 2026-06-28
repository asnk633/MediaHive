import { NextResponse } from 'next/server';
import { verifyUser, getSupabaseAdmin } from '@/lib/verifyUser';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await req.json();
    console.log(`[API][TASKS] PUT /api/tasks/${id} | User: ${user.uid} | Body keys: ${Object.keys(body).join(', ')}`);

    const { client_timestamp, idempotency_key: bodyIdempotencyKey, force, ...updates } = body;
    const idempotency_key = bodyIdempotencyKey || req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key') || undefined;

    const tenantId = user.tenant_id || user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 403 });
    }

    // Use admin client — verifyUser already confirmed identity (cookie or Bearer token)
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check Idempotency Key
    if (idempotency_key) {
      const { data: existingMutation, error: checkError } = await supabaseAdmin
        .from('processed_mutations')
        .select('resolved_at')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMutation) {
        // Already processed — return current task
        const { data: currentTask } = await supabaseAdmin.from('tasks').select('*').eq('id', id).single();
        return NextResponse.json({ success: true, task: currentTask, status: 'already_processed' });
      }
    }

    // 2. Fetch current task to check for conflicts
    const { data: serverTask, error: fetchError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!serverTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Strip non-editable fields the mobile may send (full task JSON)
    // Do this BEFORE conflict check so only meaningful fields are compared
    const ALLOWED_UPDATE_KEYS = new Set([
      'title', 'description', 'status', 'priority', 'due_date', 'completed_at',
      'on_behalf_of', 'files', 'department', 'event_id', 'department_id',
      'institution_id', 'campaign_id',
    ]);
    const filteredUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (ALLOWED_UPDATE_KEYS.has(k)) filteredUpdates[k] = v;
    }

    // 3. Conflict Detection & Resolution (Field-Level Last-Write-Wins)
    let updated_by_server = false;
    const finalUpdates = { ...filteredUpdates };

    if (client_timestamp && !force) {
      const serverTime = new Date(serverTask.updated_at).getTime();
      const clientTime = new Date(client_timestamp).getTime();

      console.log(`[API][TASKS] Conflict check | server_updated_at: ${serverTask.updated_at} (${serverTime}) | client_timestamp: ${client_timestamp} (${clientTime}) | isConflict: ${serverTime > clientTime}`);

      if (serverTime > clientTime) {
        // Server version is newer: resolve conflicts field-by-field (LWW)
        for (const key of Object.keys(filteredUpdates)) {
          if (JSON.stringify(filteredUpdates[key]) !== JSON.stringify(serverTask[key])) {
            // Overlapping edit where local differs from server: discard client edit (server wins)
            delete finalUpdates[key];
            updated_by_server = true;
          }
        }
        console.log(`[API][TASKS] Auto-resolved conflict | updated_by_server: ${updated_by_server}`);
      }
    }

    // 4. Apply update with filtered payload
    const finalPayload = {
      ...finalUpdates,
      updated_by: user.uid,
    };

    console.log(`[API][TASKS] Applying update | keys: ${Object.keys(finalPayload).join(', ')}`);

    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(finalPayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Log Idempotency Key
    if (idempotency_key) {
      const { error: insertError } = await supabaseAdmin
        .from('processed_mutations')
        .insert({
          idempotency_key,
          entity_id: id,
          resolved_at: new Date().toISOString(),
        });
      if (insertError) {
        console.warn(`[API][TASKS] Failed to log idempotency key ${idempotency_key}:`, insertError);
      }
    }

    console.log(`[API][TASKS] ✅ Update success for task ${id}`);
    return NextResponse.json({ success: true, task: updatedTask, updated_by_server });
  } catch (error: any) {
    console.error('[API][TASKS] PUT Error:', error?.message || error, error?.details || '');
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
    }, { status: 500 });
  }
}
