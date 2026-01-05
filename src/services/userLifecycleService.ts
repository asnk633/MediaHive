import { getFirebaseAuth } from '@/firebase/client';
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
    body: JSON.stringify({ status, updatedBy: adminUserId })
  });
};

// Get users by status for an institution
export const getUsersByStatus = async (
  institutionId: string,
  status?: UserStatus
): Promise<any[]> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return [];
  }

  const queryParams = new URLSearchParams();
  queryParams.append('institutionId', institutionId);
  if (status) queryParams.append('status', status);
  
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

  await apiClient('/api/tasks/reassign', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, adminUserId })
  });
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