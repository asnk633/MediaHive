import { supabase } from '@/lib/supabaseClient';
import { isFeatureEnabled } from '@/app/featureFlags';
import { apiClient } from '@/lib/apiClient';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';
import { MonitoringService } from '@/services/monitoringService';

// Define user status
export type UserStatus = 'active' | 'disabled' | 'pending';

// Update user status (soft-disable)
export const updateUserStatus = async (
  userId: string,
  status: UserStatus,
  adminUserId: string
): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  const { tenantId } = await tenantContext();

  const { error } = await safeQuery(() => supabase
    .from(TABLES.USERS)
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .eq('tenant_id', tenantId)
  );

  if (error) {
    console.error(`[updateUserStatus] Error updating user ${userId}:`, error);
    throw error;
  }
};

// Get users by institutional ID, role, and department ID
export async function getUsersByStatus(
  institution_id: string | number,
  role?: string,
  department_id?: string | number
): Promise<any[]> {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return [];
  }

  const { tenantId } = await tenantContext();

  let query = supabase
    .from(TABLES.USERS)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('institution_id', institution_id);

  if (role) query = query.eq('role', role);
  if (department_id) query = query.eq('department_id', department_id);

  const { data, error } = await safeQuery(() => query) as { data: any[]; error: any };

  if (error) {
    console.error('[getUsersByStatus] Error fetching users:', error);
    return [];
  }

  return (data as any[]) || [];
};

// Reassign tasks from a disabled user to another user
export const reassignTasks = async (
  fromUserId: string,
  toUserId: string,
  adminUserId: string
): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  const { tenantId } = await tenantContext();

  // 1. Find all tasks where fromUser is assigned (via relational table)
  const { data: assignments, error: fetchError } = await safeQuery(() => supabase
    .from('task_assignments')
    .select('task_id')
    .eq('user_id', fromUserId)
    .eq('tenant_id', tenantId)
  );

  if (fetchError) throw fetchError;
  if (!(assignments as any[])?.length) return;
  const taskIds = (assignments as any[]).map(a => a.task_id);

  // 2. Remove fromUser from all affected tasks
  const { error: removeError } = await safeQuery(() => supabase
    .from('task_assignments')
    .delete()
    .eq('user_id', fromUserId)
    .eq('tenant_id', tenantId)
  );

  if (removeError) throw removeError;

  // 3. Assign toUser to all affected tasks (upsert for idempotency)
  const newAssignments = taskIds.map(taskId => ({
    task_id: taskId,
    user_id: toUserId,
    tenant_id: tenantId,
    role: 'assignee',
  }));

  const { error: insertError } = await safeQuery(() => supabase
    .from('task_assignments')
    .upsert(newAssignments, { onConflict: 'task_id,user_id' })
  );

  if (insertError) throw insertError;

  MonitoringService.info('userLifecycle.reassign', {
    from: fromUserId,
    to: toUserId,
    task_count: taskIds.length,
  });
};

// Reassign events from a disabled user to another user
export const reassignEvents = async (
  fromUserId: string,
  toUserId: string,
  adminUserId: string
): Promise<void> => {
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  const { tenantId } = await tenantContext();

  const { error } = await safeQuery(() => supabase
    .from(TABLES.EVENTS)
    .update({ created_by: toUserId })
    .eq('created_by', fromUserId)
    .eq('tenant_id', tenantId)
  );

  if (error) throw error;
};

// Reassign media from a disabled user to another user
export const reassignMedia = async (
  fromUserId: string,
  toUserId: string,
  adminUserId: string
): Promise<void> => {
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  const { tenantId } = await tenantContext();

  const { error } = await safeQuery(() => supabase
    .from(TABLES.MEDIA)
    .update({ user_id: toUserId })
    .eq('user_id', fromUserId)
    .eq('tenant_id', tenantId)
  );

  if (error) throw error;
};

// Get orphaned items (tasks, events, media) assigned to a disabled user
export const getOrphanedItems = async (
  userId: string
): Promise<{ tasks: any[], events: any[], media: any[] }> => {
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return { tasks: [], events: [], media: [] };
  }

  const { tenantId } = await tenantContext();

  const [tasksRes, eventsRes, mediaRes] = await Promise.all([
    safeQuery(() => supabase
      .from(TABLES.TASKS)
      .select(`
        *,
        task_assignments!inner(user_id)
      `)
      .eq('tenant_id', tenantId)
      .eq('task_assignments.user_id', userId)
    ),
    safeQuery(() => supabase.from(TABLES.EVENTS).select('*').eq('tenant_id', tenantId).eq('created_by', userId)),
    safeQuery(() => supabase.from(TABLES.MEDIA).select('*').eq('tenant_id', tenantId).eq('user_id', userId))
  ]);

  return {
    tasks: (tasksRes.data as any[]) || [],
    events: (eventsRes.data as any[]) || [],
    media: (mediaRes.data as any[]) || []
  };
};
