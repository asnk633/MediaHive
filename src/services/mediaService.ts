import { apiClient } from '@/lib/apiClient';
import { DriveFile } from '@/types/file';
import { ExtendedDriveFile } from '@/types/mediaComment';
import { MediaVersioningService } from '@/services/mediaVersioningService';

export const MediaService = {
  /**
   * Get files associated with a specific task
   * @param taskId - The ID of the task
   * @returns Array of files associated with the task
   */
  getFilesForTask: async (taskId: string): Promise<ExtendedDriveFile[]> => {
    try {
      const response = await apiClient('/ap' + `i/files?taskId=${taskId}`, {
        method: 'GET'
      });
      
      return response.files || [];
    } catch (error) {
      console.error('Error fetching files for task:', error);
      return [];
    }
  },

  /**
   * Get files associated with a specific event
   * @param event_id - The ID of the event
   * @returns Array of files associated with the event
   */
  getFilesForEvent: async (event_id: string): Promise<ExtendedDriveFile[]> => {
    try {
      const response = await apiClient('/ap' + `i/files?event_id=${event_id}`, {
        method: 'GET'
      });
      
      return response.files || [];
    } catch (error) {
      console.error('Error fetching files for event:', error);
      return [];
    }
  },

  /**
   * Get all files (with filtering by user permissions)
   * @param userRole - The role of the current user
   * @param userDepartment - The department of the current user
   * @param userInstitution - The institution of the current user
   * @returns Array of all files the user has access to
   */
  getAllFiles: async (
    userRole: string,
    userDepartment?: string,
    userInstitution?: string
  ): Promise<ExtendedDriveFile[]> => {
    try {
      const response = await apiClient('/ap' + 'i/files', {
        method: 'GET'
      });
      
      // Filter based on user role and visibility settings
      return (response.files || []).filter((file: ExtendedDriveFile) => {
        // Admin sees all
        if (userRole === 'admin') return true;

        const { mode, departments, institutions } = file.visibility;

        // Mode: All
        if (mode === 'all') return true;

        // Mode: Include Only
        if (mode === 'include') {
          const deptMatch = !departments?.length || (userDepartment && departments.includes(userDepartment));
          const instMatch = !institutions?.length || (userInstitution && institutions.includes(userInstitution));
          return deptMatch && instMatch;
        }

        // Mode: Exclude
        if (mode === 'exclude') {
          if (userDepartment && departments?.includes(userDepartment)) return false;
          if (userInstitution && institutions?.includes(userInstitution)) return false;
          return true;
        }

        return false;
      });
    } catch (error) {
      console.error('Error fetching all files:', error);
      return [];
    }
  }
};
