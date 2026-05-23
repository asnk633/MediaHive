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

export interface TaskUser {
    uid: string;
    id?: string; // profile id
    name: string;
    role: string;
    institution_id?: string | number | null;
    department_id?: string | number | null;
    institution_name?: string | null;
    department_name?: string | null;
}

export interface Task {
    smartMetadata?: SmartMetadata;
    // Intelligence Flags (Computed)
    isOverdue?: boolean;
    isDueToday?: boolean;
    isUpcoming?: boolean;

    campaign_id?: string; // Optional link to a Campaign
    drive_folder_id?: string; // Google Drive folder ID for this task
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'todo' | 'in_progress' | 'on_hold' | 'review' | 'done';
    approval_status?: 'pending' | 'approved' | 'correction_requested';
    priority: 'low' | 'medium' | 'high';
    due_date: any; // ISO String / Supabase Timestamptz
    dueDate?: any; // Legacy alias for due_date
    institution_id?: string | number;
    institutionId?: string | number; // Legacy alias for institution_id
    department_id?: string | number;
    departmentId?: string | number; // Legacy alias for department_id
    department?: string;
    on_behalf_of?: any;
    event_id?: string;
    assigned_by: TaskUser;
    created_by: TaskUser;
    assigned_to?: {
        uid: string;
        name: string;
        role?: string; // assignee, reviewer, etc.
        photoURL?: string;
        avatar_url?: string;
        avatarUrl?: string;
    }[];
    assignedTo?: {
        uid: string;
        name: string;
        role?: string;
        photoURL?: string;
        avatar_url?: string;
        avatarUrl?: string;
    }[]; // Legacy alias for assigned_to
    updated_by?: TaskUser;
    updatedBy?: TaskUser; // Legacy alias for updated_by
    created_at: any;
    createdAt?: any; // Legacy alias for created_at
    updated_at?: any;
    updatedAt?: any; // Legacy alias for updated_at
    completed_at?: any;
    completedAt?: any; // Legacy alias for completed_at
    first_deliverable_at?: any;
    completed_by?: {
        uid: string;
        name: string;
    };
    is_demo_data?: boolean;
    media_uploaded?: boolean;
    media_approved?: boolean;
    media_approved_date?: any;
    rating?: {
        stars: number;
        comment?: string;
        rated_by: {
            uid: string;
            name: string;
            role: string;
        };
    };
    rated_at: any;
    files?: TaskFile[];
    subtasks?: {
        id: string;
        title: string;
        completed: boolean;
        created_by_id: string;
        created_at: { seconds: number; nanoseconds: number } | string;
        completed_at?: { seconds: number; nanoseconds: number } | string | null;
    }[];
    activity?: any[];

    // ── Soft Delete ─────────────────────────────────────────
    deleted?: boolean;
    deleted_at?: any;
    deleted_by?: TaskUser;
}

export type TaskFileSection = 'requester-inputs' | 'team-working-files' | 'team-final-exports';

export interface TaskFile {
    id: string; // Drive ID
    name: string;
    mimeType: string;
    url: string; // View/Download link
    uploaded_by: {
        uid: string;
        name: string;
        role: string;
    };
    uploaded_at: string; // ISO String
    section: TaskFileSection;
    show_in_downloads?: boolean; // Controls visibility on Downloads page
    size?: number; // Optional size in bytes
}

export interface AttachmentLog {
    id: string; // uuid
    file_id: string;
    file_name: string;
    action: 'upload' | 'delete' | 'visibility_public' | 'visibility_private';
    performed_by: {
        uid: string;
        name: string;
        role: string;
    };
    timestamp: string; // ISO
}
