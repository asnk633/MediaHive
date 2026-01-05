import { apiClient } from '@/lib/apiClient';
import { ProofingStatus, ExtendedDriveFile } from '@/types/mediaComment';
import { MediaAutomationService } from '@/services/mediaAutomationService';

export const MediaProofingService = {
  /**
   * Update the proofing status of a media file
   * @param mediaId - The ID of the media file
   * @param status - The new proofing status
   * @param updatedBy - The UID of the user updating the status
   * @param updatedByName - The display name of the user updating the status
   * @returns Boolean indicating success
   */
  updateProofingStatus: async (
    mediaId: string,
    status: ProofingStatus,
    updatedBy: string,
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
          proofingStatusUpdatedBy: updatedBy,
          proofingStatusUpdatedByName: updatedByName
        })
      });
      
      // If the status is approved, notify relevant parties
      if (status === 'approved') {
        MediaAutomationService.notifyMediaApproved(
          { ...currentMediaData, id: mediaId, proofingStatus: status },
          updatedBy
        );
        
        // Also check for final approval
        MediaAutomationService.notifyFinalApproval(
          { ...currentMediaData, id: mediaId, proofingStatus: status },
          updatedBy
        );
        
        // PHASE 6.2 — Media Approved → Task Ready Signal
        // If this media file is linked to a task, notify that the task may be ready
        if (currentMediaData.taskId) {
          try {
            // Import the TaskAutomationService dynamically to avoid circular dependencies
            const { TaskAutomationService } = await import('@/services/taskAutomationService');
            TaskAutomationService.notifyTaskReady(currentMediaData.taskId, updatedBy);
          } catch (automationErr) {
            console.error('Failed to trigger task automation for media approval', automationErr);
            // Don't fail the approval just because automation failed
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating media proofing status:', error);
      return false;
    }
  }
};