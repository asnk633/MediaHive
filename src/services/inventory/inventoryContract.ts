import { z } from 'zod';

// Helper: coerce Postgres numeric strings ("1500.00") to JS number, or accept null/undefined
const coerceNumber = z.preprocess(
    (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
    z.number().optional().nullable()
);

export const EquipmentItemSchema = z.object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    category: z.string(),
    quantity: coerceNumber.transform((v) => v ?? 0),
    status: z.string(),
    // institution_id is NOT NULL in schema but may be missing in legacy rows — make optional
    institutionId: z.union([z.string(), z.number()]).optional().nullable(),
    unit: z.string(),
    isRentable: z.boolean().optional().default(false),
    // Postgres numeric → string in JS — coerce to number
    rentalRatePerDay: coerceNumber.transform((v) => v ?? 0),
    serialNumber: z.string().optional().nullable(),
    purchaseDate: z.string().optional().nullable(),
    purchasePrice: coerceNumber,
    condition: z.string().optional().nullable(),
    locationStr: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    imageUrl: z.string().optional().nullable(),
    driveFileId: z.string().optional().nullable(),
    images: z.array(z.any()).optional().nullable(),
    brand: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    assetStatus: z.string().optional().nullable(),
    threshold: coerceNumber.transform((v) => v ?? 0),
    tenantId: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
});

export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

export const EquipmentBookingSchema = z.object({
    id: z.string(),
    equipmentId: z.string().optional().nullable(),
    taskId: z.string().optional().nullable(),
    bookedBy: z.string().optional().nullable(),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    unitsRequested: z.number().optional().default(1),
    tenantId: z.string().optional().nullable(),
});

export type EquipmentBooking = z.infer<typeof EquipmentBookingSchema>;

export const InventoryRequestSchema = z.object({
    id: z.union([z.string(), z.number()]),
    itemId: z.union([z.string(), z.number()]),
    itemName: z.string(),
    requestedBy: z.string(),
    requestedByRole: z.string(),
    purpose: z.string(),
    institutionId: z.union([z.string(), z.number()]).optional().nullable(),
    status: z.string(),
    tenantId: z.string().optional().nullable(),
    createdAt: z.string(),
});

export type InventoryRequestClean = z.infer<typeof InventoryRequestSchema>;

export const InventoryIssueSchema = z.object({
    id: z.union([z.string(), z.number()]),
    itemId: z.union([z.string(), z.number()]),
    itemName: z.string(),
    issuedToUserId: z.string(),
    issuedToRole: z.string(),
    issuedBy: z.string(),
    institutionId: z.union([z.string(), z.number()]).optional().nullable(),
    status: z.string(),
    conditionOut: z.string(),
    conditionIn: z.string().optional().nullable(),
    issuedAt: z.string(),
    expectedReturnAt: z.string(),
    returnedAt: z.string().optional().nullable(),
    issuedToDeptId: z.union([z.string(), z.number()]).optional().nullable(),
    tenantId: z.string().optional().nullable(),
});

export type InventoryIssueClean = z.infer<typeof InventoryIssueSchema>;

export interface AvailabilityInfo {
    available: number;
    total: number;
    conflicts?: any[];
}
