import { apiClient } from '@/lib/apiClient';
import { Deliverable } from '@/types/deliverable';

// Helper function to convert string date to Timestamp if needed
const stringToTimestamp = (dateString: string): any => {
    // This is a placeholder - in a real implementation, we'd properly convert to Timestamp
    // For now, we'll just return the string since the API handles Timestamp conversion
    return new Date(dateString);
};

export const DeliverableService = {
    uploadDeliverable: async (
        taskId: string,
        file: File,
        uploader: { uid: string; name: string; role?: string; avatarUrl?: string },
        customName?: string
    ): Promise<Deliverable> => {
        try {
            // 1. Determine Version Number by fetching existing deliverables for the task
            const existingRaw = await apiClient(`/api/deliverables?taskId=${taskId}`, {
                method: 'GET'
            });
            const existingItems = Array.isArray(existingRaw) ? existingRaw : (existingRaw.deliverables || []);

            let nextVersion = 1;
            let previousId = undefined;

            if (existingItems.length > 0) {
                // Find the highest version number
                const sortedDeliverables = [...existingItems].sort((a: Deliverable, b: Deliverable) =>
                    (b.version || 0) - (a.version || 0)
                );
                const latest = sortedDeliverables[0];
                nextVersion = (latest.version || 0) + 1;
                previousId = latest.id;
            }

            // 2. Upload to Drive via FileService
            // Dynamic import to avoid potential circular deps or just clean structure
            const { FileService } = await import('@/services/fileService');

            // Use custom name if provided, else original filename (prefixed with versioning logic in API/FileService if needed, but here we can set a clean display name)
            const finalFileName = customName?.trim() || file.name;

            const metadata = {
                name: finalFileName, // This becomes the Drive File Name
                type: 'document',
                folder: 'Deliverables',
                subfolder: taskId,
                uploadedBy: uploader.uid,
                uploadedByName: uploader.name,
                uploadedByRole: uploader.role,
                visibility: { mode: 'all' }, // CRITICAL: Public access
                taskId: taskId,
                version: nextVersion
            };

            const uploadResult = await FileService.uploadFile(file, metadata as any);

            if (!uploadResult.success) {
                throw new Error('Failed to upload deliverable to Drive');
            }

            // 3. Save to API
            const newDeliverableData: Omit<Deliverable, 'id' | 'createdAt'> = {
                taskId,
                version: nextVersion,
                fileName: finalFileName, // Use custom name here too
                fileType: file.type,
                fileSize: file.size,
                downloadUrl: uploadResult.viewLink, // Using Drive View Link
                driveFileId: uploadResult.fileId || uploadResult.driveFileId,
                uploadedBy: {
                    ...uploader,
                    role: uploader.role || 'viewer' // Default to viewer if role is missing to satisfy interface
                },
                ...(previousId ? { supersedes: previousId } : {})
            };

            const result = await apiClient('/api/deliverables', {
                method: 'POST',
                body: JSON.stringify({
                    ...newDeliverableData,
                    createdAt: new Date().toISOString() // Send as ISO string to API
                })
            });

            // Return a properly typed Deliverable - the API response should handle Timestamp conversion
            return {
                id: result.id,
                ...newDeliverableData,
                createdAt: result.createdAt ? stringToTimestamp(result.createdAt) : new Date() // Convert to appropriate format
            };

        } catch (error) {
            console.error('[DeliverableService] Upload failed:', error);
            throw error;
        }
    },

    /**
     * Get all deliverables for a task, ordered by version descending (newest first).
     * Strictly reads from API.
     */
    getDeliverables: async (taskId: string): Promise<Deliverable[]> => {
        try {
            const result = await apiClient(`/api/deliverables?taskId=${taskId}`, {
                method: 'GET'
            });

            // API returns the array directly, but we handle {deliverables: []} legacy wrapper just in case
            const items = Array.isArray(result) ? result : (result.deliverables || []);

            return items.map((doc: any) => ({
                id: doc.id,
                ...doc,
                createdAt: doc.createdAt ? stringToTimestamp(doc.createdAt) : new Date()
            }));
        } catch (error) {
            console.error('[DeliverableService] Fetch failed:', error);
            return [];
        }
    }
};