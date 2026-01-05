import { DriveFile, FileVisibility } from '@/types/file';
import { apiClient, apiDelete } from '@/lib/apiClient';

export const FileService = {
    // Fetch files based on user role and visibility
    getFiles: async (userRole: string, userDepartment?: string, userInstitution?: string): Promise<DriveFile[]> => {
        try {
            const response = await apiClient<{ files: DriveFile[] }>('/api/files');
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

        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Upload-Metadata': JSON.stringify(metadata) // Backup for busboy ordering issues
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();
        return result;
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
