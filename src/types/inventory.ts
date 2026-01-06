
import { TimestampLike } from '@/types/timestamp';

export type InventoryCondition = 'good' | 'needs_repair' | 'broken' | 'lost' | 'retired';

// Status for availability tracking
// Status for availability tracking (Legacy/Asset)
export type InventoryAssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

// Legacy Asset Interface (for Device Requests)
export interface InventoryAsset {
    id: string;
    name: string;
    category: string;
    purchaseDate: TimestampLike;
    purchasePrice: number;
    condition: InventoryCondition;
    status: InventoryAssetStatus;
    currentHolder?: {
        uid: string;
        name: string;
        requestId: string;
    };
    imageUrl?: string;
    images?: {
        url: string;
        fileId: string;
    }[];
    driveFileId?: string;
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

// New Consumable/Stock Inventory Interface (Phase 1)
export type InventoryStatus = 'ok' | 'low' | 'out';

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    threshold: number;
    status: InventoryStatus;

    // Audit Fields
    createdAt: string; // ISO String from API
    updatedAt: string; // ISO String from API
    createdBy: string; // uid
    purchaseDate?: string; // Optional ISO String
}

export interface InventoryApiResponse {
    items: InventoryItem[];
    meta: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
