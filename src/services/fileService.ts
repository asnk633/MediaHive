import { DriveFile, FileVisibility } from '@/types/file';
import { apiClient, apiDelete } from '@/lib/apiClient';

export const FileService = {
    // Fetch files based on user role and visibility
    getFiles: async (userRole: string, userDepartment?: string, userInstitution?: string, scope: 'all' | 'downloads' = 'all'): Promise<DriveFile[]> => {
        try {
            const response = await apiClient<{ files: DriveFile[] }>(`/api/files?scope=${scope}`);
            return response.files || [];
        } catch (error) {
            console.error('FileService.getFiles error:', error);
            return [];
        }
    },

    uploadFile: async (file: File, metadata: Partial<DriveFile>) => {
        const formData = new FormData();
        formData.append('metadata', JSON.stringify(metadata));
        formData.append('file', file);

        // Use apiClient to ensure proper base URL handling for Android
        const response = await apiClient<{ success: boolean; fileId: string; viewLink: string; downloadLink: string }>('/api/files/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Upload-Metadata': JSON.stringify(metadata) // Backup for busboy ordering issues
            }
        });

        return response;
    },

    deleteFile: async (id: string) => {
        try {
            await apiDelete(`/api/files/${id}`);
            return { success: true };
        } catch (error) {
            console.error('FileService.deleteFile error:', error);
            throw error;
        }
    }
};
