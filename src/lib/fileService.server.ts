import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { DriveFile } from '@/types/file';

/**
 * Server-only implementation of FileService logic
 */
export const FileServiceServer = {
    // Fetch files based on filters (Server-side)
    getFiles: async (filters: { taskId?: string; eventId?: string; limit?: number }): Promise<DriveFile[]> => {
        try {
            let filesQuery = adminDb.collection('files').orderBy('createdAt', 'desc');

            if (filters.taskId) {
                filesQuery = adminDb.collection('files').where('taskId', '==', filters.taskId);
            } else if (filters.eventId) {
                filesQuery = adminDb.collection('files').where('eventId', '==', filters.eventId);
            }

            const limit = filters.limit || 50;
            const snapshot = await filesQuery.limit(limit).get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name,
                    type: data.type,
                    mimeType: data.mimeType,
                    driveFileId: data.driveFileId,
                    viewLink: data.viewLink,
                    downloadLink: data.downloadLink,
                    uploadedBy: data.uploadedBy,
                    uploadedByRole: data.uploadedByRole,
                    uploadedByName: data.uploadedByName,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                    visibility: data.visibility || { mode: 'all' },
                    department: data.department,
                    institution: data.institution,
                    folder: data.folder,
                    path: data.path,
                    module: data.module,
                    taskId: data.taskId,
                    eventId: data.eventId
                } as any;
            });
        } catch (error) {
            console.error('FileServiceServer.getFiles error:', error);
            throw error;
        }
    }
};
