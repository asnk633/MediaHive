import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { v4 as uuidv4 } from 'uuid';
import { VersioningAuditService } from '@/services/versioningAuditService';
import { MediaAutomationService } from '@/services/mediaAutomationService';
export const MediaVersioningService = {
  /**
   * Get all versions of a media file
   * @param versionGroupId - The version group ID
   * @returns Array of all versions ordered by version number
   */
  getVersions: async (versionGroupId: string): Promise<ExtendedDriveFile[]> => {
    try {
      const response = await apiClient(`/api/media-versions?versionGroupId=${versionGroupId}`, {
        method: 'GET'
      });
      
      return response.versions || [];
    } catch (error) {
      console.error('Error fetching media versions:', error);
      return [];
    }
  },

  /**
   * Get the active version of a media file
   * @param versionGroupId - The version group ID
   * @returns The active version or null if not found
   */
  getActiveVersion: async (versionGroupId: string): Promise<ExtendedDriveFile | null> => {
    try {
      const response = await apiClient(`/api/media-versions/active?versionGroupId=${versionGroupId}`, {
        method: 'GET'
      });
      
      return response.version || null;
    } catch (error) {
      console.error('Error fetching active media version:', error);
      return null;
    }
  },

  /**
   * Upload a new version of a media file
   * @param fileData - The new file data
   * @param originalFile - The original file to create a new version of
   * @param uploadedBy - UID of the user uploading
   * @param uploadedByName - Name of the user uploading
   * @param uploadedByRole - Role of the user uploading
   * @returns The newly created file version
   */
  uploadNewVersion: async (
    fileData: Partial<ExtendedDriveFile>,
    originalFile: ExtendedDriveFile,
    uploadedBy: string,
    uploadedByName: string,
    uploadedByRole: string
  ): Promise<ExtendedDriveFile | null> => {
    try {
      // Validate user role - only admin and team members can upload versions
      if (uploadedByRole !== 'admin' && uploadedByRole !== 'team') {
        console.error('Unauthorized: Only admin and team members can upload new versions');
        return null;
      }

      const response = await apiClient('/api/media-versions', {
        method: 'POST',
        body: JSON.stringify({
          fileData,
          originalFileId: originalFile.id,
          versionGroupId: originalFile.versionGroupId || originalFile.id,
          uploadedBy,
          uploadedByName,
          uploadedByRole: originalFile.uploadedByRole
        })
      });
      
      return response.version || null;
    } catch (error) {
      console.error('Error uploading new media version:', error);
      return null;
    }
  },
  /**
   * Get only active versions for display in galleries
   * @returns Array of active versions only
   */
  getActiveVersionsOnly: async (): Promise<ExtendedDriveFile[]> => {
    try {
      const response = await apiClient('/api/media-versions/active', {
        method: 'GET'
      });
      
      return response.versions || [];
    } catch (error) {
      console.error('Error fetching active media versions:', error);
      return [];
    }
  }
};