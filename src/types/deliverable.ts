import { TimestampLike } from '@/types/timestamp';

export interface Deliverable {
    id: string;
    taskId: string;
    version: number;
    fileName: string;
    fileType: string;
    fileSize: number;
    downloadUrl: string; // Firestore-hosted signed/public URL
    driveFileId?: string; // Google Drive file ID for preview/view links
    uploadedBy: {
        uid: string;
        name: string;
        role: string;
        avatarUrl?: string;
    };
    createdAt: TimestampLike;
    supersedes?: string; // ID of the previous version
}
