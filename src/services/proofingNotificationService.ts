import { apiClient } from '@/lib/apiClient';
import { ProofingStatus } from '@/types/mediaComment';

export const ProofingNotificationService = {
  /**
   * Notify relevant parties when a media file's proofing status changes
   * @param mediaId - The ID of the media file
   * @param mediaName - The name of the media file
   * @param uploaderId - The UID of the media uploader
   * @param status - The new proofing status
   * @param updatedBy - The UID of the user who updated the status
   * @param updatedByName - The display name of the user who updated the status
   */
  notifyProofingStatusChange: async (
    mediaId: string,
    mediaName: string,
    uploaderId: string,
    status: ProofingStatus,
    updatedBy: string,
    updatedByName: string
  ): Promise<void> => {
    try {
      // Call the API to handle the notification logic
      await apiClient('/api/notifications/proofing-status-change', {
        method: 'POST',
        body: JSON.stringify({
          mediaId,
          mediaName,
          uploaderId,
          status,
          updatedBy,
          updatedByName
        })
      });
    } catch (error) {
      console.error('Error sending proofing status notifications:', error);
    }
  }
};