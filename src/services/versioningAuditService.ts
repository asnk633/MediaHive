import { apiClient } from '@/lib/apiClient';

export const VersioningAuditService = {
  /**
   * Log a versioning action in the audit trail
   * @param userId - The UID of the user performing the action
   * @param actionType - The type of action performed
   * @param details - Additional details about the action
   * @param institution_id - The institution ID for tenant isolation
   */
  logVersioningAction: async (
    userId: string,
    actionType: 'version_uploaded' | 'version_deactivated' | 'version_activated',
    details: any,
    institution_id: string
  ): Promise<void> => {
    try {
      await apiClient('/ap' + 'i/audit/versioning', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          actionType,
          resourceType: 'media_version',
          details,
          institution_id
        })
      });
    } catch (error) {
      console.error('Error logging versioning action:', error);
    }
  },

  /**
   * Log a version upload action with detailed information
   * @param userId - The UID of the user performing the action
   * @param oldVersionNumber - The version number of the previous active version
   * @param newVersionNumber - The version number of the newly uploaded version
   * @param mediaId - The ID of the newly uploaded media file
   * @param versionGroupId - The version group ID shared by all versions
   * @param institution_id - The institution ID for tenant isolation
   */
  logVersionUpload: async (
    userId: string,
    oldVersionNumber: number,
    newVersionNumber: number,
    mediaId: string,
    versionGroupId: string,
    institution_id: string
  ): Promise<void> => {
    try {
      await apiClient('/ap' + 'i/audit/versioning', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          actionType: 'version_uploaded',
          resourceType: 'media_version',
          details: {
            oldVersionNumber,
            newVersionNumber,
            mediaId,
            versionGroupId
          },
          institution_id
        })
      });
    } catch (error) {
      console.error('Error logging version upload:', error);
    }
  },

  /**
   * Log a version activation/deactivation action
   * @param userId - The UID of the user performing the action (or system)
   * @param actionType - The type of action performed
   * @param versionNumber - The version number being activated/deactivated
   * @param mediaId - The ID of the media file
   * @param versionGroupId - The version group ID shared by all versions
   * @param institution_id - The institution ID for tenant isolation
   */
  logVersionStatusChange: async (
    userId: string,
    actionType: 'version_deactivated' | 'version_activated',
    versionNumber: number,
    mediaId: string,
    versionGroupId: string,
    institution_id: string
  ): Promise<void> => {
    try {
      await apiClient('/ap' + 'i/audit/versioning', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          actionType,
          resourceType: 'media_version',
          details: {
            versionNumber,
            mediaId,
            versionGroupId
          },
          institution_id
        })
      });
    } catch (error) {
      console.error('Error logging version status change:', error);
    }
  }
};
