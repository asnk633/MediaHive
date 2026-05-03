import { apiClient } from '@/lib/apiClient';
import { isFeatureEnabled } from '@/app/featureFlags';

// Define invite structure
export interface Invite {
  id: string;
  email: string;
  role: 'admin' | 'team' | 'guest';
  invitedBy: string; // userId of the admin who created the invite
  institution_id: string; // tenant isolation
  department_id?: string | null;
  name?: string | null; // Added name
  created_at: Date;
  expiresAt: Date;
  used: boolean;
  usedBy?: string; // userId of the user who used the invite
  usedAt?: Date;
}

// Create a new invite
export const createInvite = async (
  email: string,
  role: 'admin' | 'team' | 'guest',
  invitedByUserId: string,
  institution_id: string,
  department_id?: string,
  name: string | null = null
): Promise<string> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  // Validate role
  if (!['admin', 'team', 'guest'].includes(role)) {
    throw new Error('Invalid role. Must be admin, team, or guest');
  }

  const response = await apiClient('/api/invites', {
    method: 'POST',
    body: JSON.stringify({
      email,
      role,
      invitedByUserId,
      institution_id,
      department_id,
      name
    })
  });

  return response.id;
};

// Validate an invite token
export const validateInvite = async (inviteId: string): Promise<Invite | null> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  const response = await apiClient(`/api/invites/${inviteId}/validate`, {
    method: 'GET'
  });

  return response.invite || null;
};

// Use an invite (mark as used)
export const useInvite = async (inviteId: string, userId: string): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  await apiClient(`/api/invites/${inviteId}/use`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

// Get all invites for an institution
export const getInstitutionInvites = async (institution_id: string): Promise<Invite[]> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    return [];
  }

  const response = await apiClient(`/api/invites?institution_id=${institution_id}`, {
    method: 'GET'
  });

  return response.invites || [];
};

// Delete an invite (admin only)
export const deleteInvite = async (inviteId: string): Promise<void> => {
  // Check if feature is enabled
  if (!isFeatureEnabled('inviteAccessLayer')) {
    throw new Error('Invite access layer is not enabled');
  }

  await apiClient(`/api/invites/${inviteId}`, {
    method: 'DELETE'
  });
};
