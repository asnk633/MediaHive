import { DriveFile, FileVisibility } from '@/types/file';
import { apiClient, apiDelete } from '@/lib/apiClient';

export const FileService = {
    // Fetch files based on user role and visibility
    getFiles: async (userRole: string, userDepartment?: string | number | null, userInstitution?: string | number | null, scope: 'all' | 'downloads' = 'all'): Promise<DriveFile[]> => {
        try {
            const response = await apiClient<{ files: DriveFile[] }>(`/api/files?scope=${scope}`);
            return response.files || [];
        } catch (error) {
            console.error('FileService.getFiles error:', error);
            return [];
        }
    },

    uploadFile: async (file: File, metadata: Partial<DriveFile>, retries = 2) => {
        const attempt = async (remaining: number): Promise<any> => {
            try {
                const formData = new FormData();
                formData.append('metadata', JSON.stringify(metadata));
                formData.append('file', file);

                return await apiClient<{ success: boolean; file_id: string; viewLink: string; downloadLink: string }>('/api/files/upload', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Upload-Metadata': JSON.stringify(metadata)
                    }
                });
            } catch (error) {
                if (remaining > 0) {
                    console.warn(`[FileService] Upload failed, retrying... (${remaining} left)`);
                    await new Promise(r => setTimeout(r, 1000));
                    return attempt(remaining - 1);
                }
                throw error;
            }
        };

        return attempt(retries);
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
