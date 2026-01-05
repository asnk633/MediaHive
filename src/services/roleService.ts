import { apiPost } from '@/lib/apiClient';

export interface RoleUpdateData {
  targetUid: string;
  newRole: string;
}

export interface RoleUpdateResult {
  success: boolean;
  message: string;
}

export const updateRole = async (targetUid: string, newRole: string): Promise<RoleUpdateResult> => {
  try {
    const result = await apiPost<RoleUpdateResult>('/api/admin/change-role', { targetUid, newRole });
    return result;
  } catch (error) {
    console.error('Error updating role via API:', error);
    throw error;
  }
};