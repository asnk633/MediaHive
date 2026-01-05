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
    department: string;
    institutionId?: number;
    departmentId?: number;
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
        ratedAt: any; // Timestamp
    };
}