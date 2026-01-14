import { TaskRating } from './taskRating';

export interface SmartMetadata {
    inferredStage: 'shoot' | 'edit' | 'review' | 'publish' | 'general' | 'intake';
    isStale: boolean;
    daysInStatus: number;
    urgencyScore: number; // 0-100 derived from due date & priority
    normalizedProvenance: string; // "System (Legacy)" or valid name
    needsAttention: boolean;
    isBlocked: boolean;
}

export type TaskStatus = Task['status'];
export type TaskPriority = Task['priority'];

export interface Task {
    smartMetadata?: SmartMetadata;
    campaignId?: string; // Optional link to a Campaign
    driveFolderId?: string; // Google Drive folder ID for this task
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'todo' | 'in_progress' | 'on_hold' | 'review' | 'done';
    approvalStatus?: 'pending' | 'approved' | 'correction_requested';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDate: any; // Firestore Timestamp
    /**
     * @deprecated Use departmentId or institutionId instead.
     * Kept for audit/debug of legacy tasks.
     * Do not write to this field.
     */
    department?: string;
    institutionId?: string | number;
    departmentId?: string | number;
    eventId?: string;
    assignedBy: {
        uid: string;
        name: string;
        role: string;
    };
    createdBy: {
        uid: string;
        name: string;
        role: string;
    };
    assignedTo?: {
        uid: string;
        name: string;
        photoURL?: string;
        avatarUrl?: string; // Firestore-hosted URL
        // role is optional here
    }[];
    updatedBy?: {
        uid: string;
        name: string;
        role: string;
    };
    createdAt: any;
    updatedAt?: any;
    completedAt?: any;
    firstDeliverableAt?: any; // Timestamp of first deliverable upload
    completedBy?: {
        uid: string;
        name: string;
    };
    isDemoData?: boolean;
    mediaUploaded?: boolean;
    mediaApproved?: boolean;
    mediaApprovedDate?: any; // Timestamp
    rating?: {
        stars: number;
        comment?: string;
        ratedBy: {
            uid: string;
            name: string;
            role: string;
        };
    };
    ratedAt: any; // Timestamp
    files?: TaskFile[];
}

export type TaskFileSection = 'requester-inputs' | 'team-working-files' | 'team-final-exports';

export interface TaskFile {
    id: string; // Drive ID
    name: string;
    mimeType: string;
    url: string; // View/Download link
    uploadedBy: {
        uid: string;
        name: string;
        role: string;
    };
    uploadedAt: string; // ISO String
    section: TaskFileSection;
    showInDownloads?: boolean; // Controls visibility on Downloads page
    size?: number; // Optional size in bytes
}

export interface AttachmentLog {
    id: string; // uuid
    fileId: string;
    fileName: string;
    action: 'upload' | 'delete' | 'visibility_public' | 'visibility_private';
    performedBy: {
        uid: string;
        name: string;
        role: string;
    };
    timestamp: string; // ISO
}
