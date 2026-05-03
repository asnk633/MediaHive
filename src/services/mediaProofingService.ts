import { apiClient } from '@/lib/apiClient';
import { ProofingStatus, ExtendedDriveFile } from '@/types/mediaComment';

export const MediaProofingService = {
  /**
   * Update the proofing status of a media file
   * @param mediaId - The ID of the media file
   * @param status - The new proofing status
   * @param updated_by - The UID of the user updating the status
   * @param updatedByName - The display name of the user updating the status
   * @returns Boolean indicating success
   */
  updateProofingStatus: async (
    mediaId: string,
    status: ProofingStatus,
    updated_by: string,
    updatedByName: string
  ): Promise<boolean> => {
    try {
      // Get the current media file data before updating
      const currentMediaData = await apiClient(`/api/files/${mediaId}`, {
        method: 'GET'
      }) as ExtendedDriveFile;

      await apiClient(`/api/files/${mediaId}/proofing-status`, {
        method: 'PATCH',
        body: JSON.stringify({
          proofingStatus: status,
          proofingStatusUpdatedAt: new Date().toISOString(), // Send as ISO string
          proofingStatusUpdatedBy: updated_by,
          proofingStatusUpdatedByName: updatedByName
        })
      });

      return true;
    } catch (error) {
      console.error('Error updating media proofing status:', error);
      return false;
    }
  }
};
