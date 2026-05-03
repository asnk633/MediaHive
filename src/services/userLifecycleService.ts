import { apiClient } from '@/lib/apiClient';
import { isFeatureEnabled } from '@/app/featureFlags';

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

  await apiClient(`/api/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, updated_by: adminUserId })
  });
};

// Get users by institutional ID, role, and department ID
export async function getUsersByStatus(
  institution_id: string,
  role?: string,
  department_id?: string
): Promise<any[]> {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return [];
  }

  const queryParams = new URLSearchParams();
  queryParams.append('institution_id', institution_id);
  if (role) queryParams.append('role', role);
  if (department_id) queryParams.append('department_id', department_id);

  const response = await apiClient(`/api/users?${queryParams.toString()}`, {
    method: 'GET'
  });

  return response.users || [];
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

  // TODO: Implement native Supabase task reassignment logic instead of API route.
  // This will require an RPC call or admin client privileges to bypass RLS for other users.
  console.log(`[Task Reassignment Placeholder] Reassigning tasks from ${fromUserId} to ${toUserId}`);
};

// Reassign events from a disabled user to another user
export const reassignEvents = async (
  fromUserId: string,
  toUserId: string,
  adminUserId: string
): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  await apiClient('/api/events/reassign', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, adminUserId })
  });
};

// Reassign media from a disabled user to another user
export const reassignMedia = async (
  fromUserId: string,
  toUserId: string,
  adminUserId: string
): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  await apiClient('/api/media/reassign', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, adminUserId })
  });
};

// Get orphaned items (tasks, events, media) assigned to a disabled user
export const getOrphanedItems = async (
  userId: string
): Promise<{ tasks: any[], events: any[], media: any[] }> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return { tasks: [], events: [], media: [] };
  }

  const response = await apiClient(`/api/users/${userId}/orphaned-items`, {
    method: 'GET'
  });

  return response.items || { tasks: [], events: [], media: [] };
};
