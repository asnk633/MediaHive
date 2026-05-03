import { FileService } from '@/services/fileService';
import { Deliverable } from '@/types/deliverable';
import { FileSchema } from '@/domain/schemas/file';

export const DeliverableService = {
    uploadDeliverable: async (
        taskId: string,
        file: File,
        uploader: { uid: string; name: string; role?: string; avatar_url?: string },
        customName?: string,
        isFinal: boolean = false
    ): Promise<Deliverable> => {
        try {
            // 1. Upload to Drive/Supabase via FileService
            const finalFileName = customName?.trim() || file.name;

            const metadata = {
                name: finalFileName,
                type: 'document',
                folder: 'Deliverables',
                subfolder: taskId,
                uploaded_by: uploader.uid,
                uploadedByName: uploader.name,
                uploadedByRole: uploader.role,
                visibility: { mode: 'all' },
                taskId: taskId,
                isFinal: isFinal,
                uploadContext: isFinal ? 'task_final' : 'task_attachment'
            };

            const uploadResult = await FileService.uploadFile(file, metadata as any);

            if (!uploadResult.success) {
                throw new Error('Failed to upload deliverable');
            }

            return {
                id: uploadResult.file_id,
                taskId,
                file_name: finalFileName,
                fileType: file.type,
                fileSize: file.size,
                downloadUrl: uploadResult.viewLink,
                driveFileId: uploadResult.file_id,
                uploaded_by: {
                    ...uploader,
                    role: uploader.role || 'viewer'
                },
                created_at: new Date(),
                version: 1 // Baseline version for unified files
            };

        } catch (error) {
            console.error('[DeliverableService] Upload failed:', error);
            throw error;
        }
    },

    /**
     * Get all deliverables for a task.
     * Maps to the generic files API with taskId filter.
     */
    getDeliverables: async (taskId: string): Promise<Deliverable[]> => {
        try {
            // Use FileService to get task-specific files
            const files = await FileService.getFiles('admin', undefined, undefined, 'all');

            // Filter locally for taskId (or update FileService.getFiles to accept filters)
            // For now, let's assume getFiles might need a filter param or we filter here
            const taskFiles = files.filter((f: any) => {
                // DTO Validation (since FileService returns these)
                const parsed = FileSchema.safeParse(f);
                if (!parsed.success) {
                    console.warn("[DeliverableService] DTO validation failed for file from FileService:", parsed.error);
                }
                return f.taskId === taskId || f.metadata?.taskId === taskId;
            });

            return taskFiles.map((f: any) => ({
                id: f.id,
                taskId: f.taskId || f.metadata?.taskId,
                file_name: f.name,
                fileType: f.fileType,
                fileSize: f.fileSize,
                downloadUrl: f.fileUrl,
                driveFileId: f.driveFileId || f.metadata?.driveFileId,
                uploaded_by: {
                    uid: f.uploaded_by || f.uploadedById,
                    name: f.uploadedByName || 'Team Member',
                    role: 'team' // Provide default role to satisfy interface
                },
                created_at: new Date(f.created_at || Date.now()),
                version: f.version || 1
            }));
        } catch (error) {
            console.error('[DeliverableService] Fetch failed:', error);
            return [];
        }
    }
};
