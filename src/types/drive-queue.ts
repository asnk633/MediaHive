// @ts-nocheck

export interface DriveQueueItem {
    id: string; // Firestore Doc ID
    driveFileId: string;
    name: string;
    mimeType: string;
    size: number;
    webViewLink: string;
    thumbnailLink?: string;
    uploaded_by: string; // "Drive User" or email if available
    detectedAt: Timestamp | Date;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
    processedAt?: Timestamp | Date;
    processedBy?: string; // Admin UID
}
