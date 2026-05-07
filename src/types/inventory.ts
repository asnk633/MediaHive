
import { TimestampLike } from '@/types/timestamp';

export type InventoryCondition = 'good' | 'needs_repair' | 'broken' | 'lost' | 'retired';

// Status for availability tracking
// Status for availability tracking (Legacy/Asset)
export type InventoryAssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

export const INVENTORY_CATEGORIES = [
    'Camera',
    'Audio',
    'Lights',
    'Cables',
    'Lens',
    'IT',
    'Furniture',
    'Decoration',
    'Camera Support & Stabilization',
    'Lenses & Optics',
    'Grip & Rigging',
    'Power & Batteries',
    'Media & Storage',
    'Computing & Monitoring',
    'Production Consumables',
    'Transport & Cases',
    'Studio Infrastructure',
    'Other'
] as const;

export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export const INVENTORY_GUIDE: Record<InventoryCategory, string> = {
    'Camera': 'Camera bodies, action cameras (GoPro), drones, camcorders.',
    'Audio': 'Microphones (lavalier, shotgun, handheld), audio recorders, mixers, headphones.',
    'Lights': 'LED panels, COB lights, tube lights, softboxes, ring lights.',
    'Cables': 'Video (HDMI, SDI), Audio (XLR, AUX), Data (USB, Thunderbolt), Power (Extension cords).',
    'Lens': 'Prime lenses, zoom lenses, macro lenses, and lens adapters.',
    'IT': 'Laptops, tablets, networking equipment, and software licenses.',
    'Furniture': 'Studio chairs, desks, posing stools, and production tables.',
    'Decoration': 'Props, artificial plants, rugs, and background decorative elements.',
    'Camera Support & Stabilization': 'Tripods, monopods, fluid heads, gimbals, shoulder rigs, sliders.',
    'Lenses & Optics': 'Specialized optics, ND filters, lens cleaning kits, and glass filters.',
    'Grip & Rigging': 'Light stands, C-stands, clamps, sandbags, apple boxes, frames/flags.',
    'Power & Batteries': 'Camera batteries, V-mount/Gold mount bricks, AA/AAA batteries, chargers, AC adapters.',
    'Media & Storage': 'SD cards, CFexpress cards, external SSDs, hard drives, card readers.',
    'Computing & Monitoring': 'Field monitors, wireless video transmitters, laptops, iPads.',
    'Production Consumables': 'Gaffer tape, gels, canned air, lens wipes.',
    'Transport & Cases': 'Hard cases (Pelican), soft bags, backpacks, equipment carts.',
    'Studio Infrastructure': 'Backdrops (paper/muslin), green screens, sound blankets, studio furniture.',
    'Other': 'Any miscellaneous items that do not fit into the above categories.'
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
