import { TimestampLike } from '@/types/timestamp';

export interface Deliverable {
    id: string;
    taskId: string;
    version: number;
    file_name: string;
    fileType: string;
    fileSize: number;
    downloadUrl: string; // Firestore-hosted signed/public URL
    driveFileId?: string; // Google Drive file ID for preview/view links
    uploaded_by: {
        uid: string;
        name: string;
        role: string;
        avatar_url?: string;
    };
    created_at: TimestampLike;
    supersedes?: string; // ID of the previous version
}
