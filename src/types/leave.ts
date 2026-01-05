import { TimestampLike } from '@/types/timestamp';

export type LeaveType = 'casual' | 'sick' | 'planned' | 'emergency' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'archived';

export interface LeaveRequest {
    id: string;

    // Request Details
    type: LeaveType;
    startDate: TimestampLike;
    endDate: TimestampLike;
    totalDays: number; // Auto-calculated
    reason: string;

    // Status
    status: LeaveStatus;

    // Requester Info
    requestedBy: {
        uid: string;
        name: string;
        department: string;
        photoURL?: string;
    };
    requestedAt: TimestampLike;

    // Admin Action
    reviewedBy?: {
        uid: string;
        name: string;
    };
    reviewedAt?: TimestampLike;
    rejectionReason?: string; // Required if rejected

    // Metadata
    calendarEventId?: string; // For Phase 2 calendar integration
    updatedAt: TimestampLike;
    archivedAt?: TimestampLike;
}

// Form data type (for submission)
export type LeaveRequestFormData = Omit<LeaveRequest, 'id' | 'status' | 'requestedAt' | 'updatedAt' | 'totalDays'> & {
    totalDays?: number; // Optional during form fill, calculated before submit
};

// Admin action types
export interface ApproveLeaveData {
    requestId: string;
    adminUid: string;
    adminName: string;
}

export interface RejectLeaveData {
    requestId: string;
    adminUid: string;
    adminName: string;
    reason: string;
}

// Leave type display names
export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    casual: 'Casual Leave',
    sick: 'Sick Leave',
    planned: 'Planned Leave',
    emergency: 'Emergency Leave',
    other: 'Other'
};

// Status display config
export const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', icon: '🟡' },
    approved: { label: 'Approved', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', icon: '✅' },
    rejected: { label: 'Rejected', color: 'text-red-500 bg-red-500/10 border-red-500/20', icon: '❌' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500 bg-gray-500/10 border-gray-500/20', icon: '⚫' },
    archived: { label: 'Archived', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', icon: '📦' }
};

// Minimum notice periods (in days)
export const MINIMUM_NOTICE: Record<LeaveType, number> = {
    casual: 1,
    sick: 0, // Can be same day
    planned: 3,
    emergency: 0,
    other: 1
};
