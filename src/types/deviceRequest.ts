
import { TimestampLike } from '@/types/timestamp';
import { InventoryCondition } from './inventory';

export type RequestStatus = 'pending' | 'approved' | 'issued' | 'returned' | 'rejected' | 'cancelled' | 'waiting_inspection';

export interface DeviceRequest {
    id: string;
    requester: {
        uid: string;
        name: string;
        role: 'manager' | 'member' | 'team' | 'guest' | 'admin';
    };

    // What they want
    itemCategory: string; // e.g., "Camera"
    requestedItemId?: string; // Optional (Team might know exactly what they want)
    description?: string; // e.g., "Need the wide lens for a shoot"

    // Duration
    startDate: TimestampLike;
    endDate: TimestampLike;

    // Lifecycle
    status: RequestStatus;

    // Admin Decisions
    assignedItemId?: string; // The actual item given
    assignedItemName?: string; // Denormalized name for display
    adminNotes?: string;

    // Timestamps
    created_at: TimestampLike;
    updated_at: TimestampLike;
    issuedAt?: TimestampLike;
    returnedAt?: TimestampLike;
}

export interface DeviceLog {
    id: string;
    requestId: string;
    inventoryItem: {
        id: string;
        name: string;
        serialNumber?: string;
    };
    user: {
        uid: string;
        name: string;
    };

    issuedAt: TimestampLike;
    expectedReturnAt: TimestampLike;
    returnedAt?: TimestampLike;

    conditionOnIssue: InventoryCondition;
    conditionOnReturn?: InventoryCondition;

    issuedBy: string; // Admin UID
    receivedBy?: string; // Admin UID (who processed the return)
}
