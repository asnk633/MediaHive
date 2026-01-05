
import { TimestampLike } from '@/types/timestamp';

export type InventoryCondition = 'good' | 'needs_repair' | 'broken' | 'lost' | 'retired';

// Status for availability tracking
export type InventoryStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    purchaseDate: TimestampLike;
    purchasePrice: number;
    condition: InventoryCondition;
    status: InventoryStatus; // New field
    currentHolder?: {        // New field (denormalized)
        uid: string;
        name: string;
        requestId: string;
    };
    imageUrl?: string;       // Public View Link from Drive (Cover Image)
    images?: {               // Multiple images support
        url: string;
        fileId: string;
    }[];
    driveFileId?: string;    // Reference ID (Cover Image)
    serialNumber?: string;
    remarks?: string;

    // Audit Fields
    createdAt: TimestampLike;
    updatedAt: TimestampLike;
    createdBy: {
        uid: string;
        name: string;
    };
}
