
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
    'Camera Support & Stabilization',
    'Lenses & Optics',
    'Grip & Rigging',
    'Power & Batteries',
    'Media & Storage',
    'Computing & Monitoring',
    'Production Consumables',
    'Transport & Cases',
    'Studio Infrastructure'
] as const;

export type InventoryCategory = typeof INVENTORY_CATEGORIES[number];

export const INVENTORY_GUIDE: Record<InventoryCategory, string> = {
    'Camera': 'Camera bodies, action cameras (GoPro), drones, camcorders.',
    'Audio': 'Microphones (lavalier, shotgun, handheld), audio recorders, mixers, headphones.',
    'Lights': 'LED panels, COB lights, tube lights, softboxes, ring lights.',
    'Cables': 'Video (HDMI, SDI), Audio (XLR, AUX), Data (USB, Thunderbolt), Power (Extension cords).',
    'Camera Support & Stabilization': 'Tripods, monopods, fluid heads, gimbals, shoulder rigs, sliders.',
    'Lenses & Optics': 'Prime lenses, zoom lenses, ND filters, lens adapters, lens cleaning kits.',
    'Grip & Rigging': 'Light stands, C-stands, clamps, sandbags, apple boxes, frames/flags.',
    'Power & Batteries': 'Camera batteries, V-mount/Gold mount bricks, AA/AAA batteries, battery chargers, AC adapters, power strips.',
    'Media & Storage': 'SD cards, CFexpress cards, external SSDs, hard drives, card readers.',
    'Computing & Monitoring': 'Field monitors, wireless video transmitters, laptops, iPads.',
    'Production Consumables': 'Gaffer tape, gels, canned air, lens wipes.',
    'Transport & Cases': 'Hard cases (Pelican), soft bags, backpacks, equipment carts.',
    'Studio Infrastructure': 'Backdrops (paper/muslin), green screens, sound blankets, studio furniture.'
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
    status: InventoryStatus | string; // Allow string for legacy/asset status

    // Extended Asset Fields
    imageUrl?: string;
    driveFileId?: string;
    condition?: InventoryCondition;
    serialNumber?: string;
    remarks?: string;
    purchasePrice?: number;
    assetStatus?: InventoryAssetStatus;

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
