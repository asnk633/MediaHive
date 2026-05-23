
import { TimestampLike } from '@/types/timestamp';

export type InventoryCondition = 'Good' | 'Fair' | 'Poor' | 'Damaged' | string;

// Status for availability tracking
// Status for availability tracking (Legacy/Asset)
export type InventoryAssetStatus = 'Available' | 'In Use' | 'Maintenance' | 'Retired' | string;

export const INVENTORY_CATEGORIES = [
    'Cameras & Accessories',
    'Networking & Power Cables',
    'Audio & Sound Systems',
    'Office & Studio Gear',
    'General Asset'
] as const;

export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export const INVENTORY_GUIDE: Record<InventoryCategory, string> = {
    'Cameras & Accessories': 'Camera bodies, action cameras (GoPro), drones, lenses, filters, lens adapters, lens cleaning kits.',
    'Networking & Power Cables': 'Data cables (HDMI, USB, RJ45), power strips, routers, switches, battery bricks, V-mount, extension cords.',
    'Audio & Sound Systems': 'Microphones (lavalier, shotgun, wireless), audio recorders, speakers, headphones, audio mixers.',
    'Office & Studio Gear': 'Keyboards, mice, monitors, stands, studio backdrops, apple boxes, production tables, transport cases.',
    'General Asset': 'Any general equipment, consumables, or miscellaneous tools.'
};

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
        file_id: string;
    }[];
    driveFileId?: string;
    serialNumber?: string;
    remarks?: string;

    // Audit Fields
    created_at: TimestampLike;
    updated_at: TimestampLike;
    created_by: {
        uid: string;
        name: string;
    };
    version?: number;
}

// New Consumable/Stock Inventory Interface (Phase 1)
export type InventoryStatus = 'ok' | 'low' | 'out';

export interface InventoryItem {
    id: string | number;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    threshold: number;
    status: InventoryStatus | string; // Allow string for legacy/asset status

    // Extended Asset Fields
    imageUrl?: string;
    images?: {
        url: string;
        file_id: string;
    }[]; // Multi-image support
    driveFileId?: string;
    condition?: InventoryCondition;
    serialNumber?: string;
    remarks?: string;
    purchasePrice?: number;
    brand?: string;
    model?: string;
    assetStatus?: InventoryAssetStatus;
    locationStr?: string;
    notes?: string;

    // Audit Fields
    createdAt: string; // ISO String from API
    updatedAt: string; // ISO String from API
    createdBy: string; // uid
    purchaseDate?: string; // Optional ISO String
    version?: number;
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

// Phase 6: Requests & Issuance
export interface InventoryRequest {
    id: string | number;
    itemId: string | number;
    itemName: string;
    requestedBy: string; // uid
    requestedByRole: 'member' | 'team' | 'admin';
    purpose: string;
    institutionId: string | number;
    status: 'pending' | 'approved' | 'rejected' | 'issued';

    // Audit
    createdAt: any;
    approvedAt?: any;
    approvedBy?: string;
    rejectionReason?: string;
    issuedIssueId?: string; // Link to the issue record
}

export interface InventoryIssue {
    id: string | number;
    itemId: string | number;
    itemName: string;
    issuedToUserId: string;
    issuedToRole: 'member' | 'team';
    issuedBy: string; // uid

    issuedFor: {
        institution_id?: string | number;
        projectNote?: string;
    };

    conditionOut: InventoryCondition;
    conditionIn?: InventoryCondition;
    returnRemarks?: string; // Mandatory if broken/lost

    status: 'issued' | 'returned';

    // Dates
    issuedAt: any;
    expectedReturnAt: string; // ISO
    returnedAt?: any;
    institutionId: string | number;

    // Notification State
    reminded24h?: boolean;
    overdueNotified?: boolean;
    escalationNotified?: boolean;
}
