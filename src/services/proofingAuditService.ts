import { ProofingStatus } from '@/types/mediaComment';
import { apiClient } from '@/lib/apiClient';

export const ProofingAuditService = {
  /**
   * Log a proofing action in the audit trail
   * @param userId - The UID of the user performing the action
   * @param mediaId - The ID of the media file
   * @param actionType - The type of action performed
   * @param details - Additional details about the action
   * @param institution_id - The institution ID for tenant isolation
   */
  logProofingAction: async (
    userId: string,
    mediaId: string,
    actionType: 'comment_added' | 'status_approved' | 'status_changes_requested' | 'status_updated',
    details: any,
    institution_id: string
  ): Promise<void> => {
    try {
      await apiClient('/api/audit/proofing', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          action: actionType,
          resourceType: 'media',
          resourceId: mediaId,
          details: JSON.stringify(details),
          institution_id,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error logging proofing action:', error);
    }
  }
};
