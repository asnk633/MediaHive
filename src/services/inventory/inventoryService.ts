import { EquipmentItem, EquipmentBooking, AvailabilityInfo, EquipmentItemSchema, EquipmentBookingSchema } from './inventoryContract';
import { supabase } from '@/lib/supabaseClient';
import { eventBus } from '@/system/events/eventSystem';
import { tenantContext } from '@/lib/auth/tenantContext';
import { TABLES } from '@/lib/dbTables';
import { safeQuery } from '@/lib/safeQuery';

import { offlineDB } from '@/lib/offline/db';

// DTO Mappers
function mapEquipment(row: any): EquipmentItem {
    const item = {
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity ?? 1,
        status: row.status || 'unknown',
        institutionId: row.institution_id,
        unit: row.unit || 'unit',
        isRentable: row.is_rentable ?? false,
        rentalRatePerDay: row.rental_rate_per_day ?? 0,
        serialNumber: row.serial_number,
        purchaseDate: row.purchase_date,
        purchasePrice: row.purchase_price,
        condition: row.condition,
        locationStr: row.location_str,
        description: row.description,
        brand: row.brand,
        model: row.model,
        notes: row.notes,
        remarks: row.remarks,
        imageUrl: row.image_url,
        driveFileId: row.drive_file_id,
        images: row.images,
        threshold: row.threshold ?? 0,
        assetStatus: row.asset_status,
        tenantId: row.tenant_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by
    };
    const result = EquipmentItemSchema.safeParse(item);
    if (!result.success) {
        console.error("[InventoryMapping][Equipment] Validation failed:", result.error.format());
        return item as EquipmentItem;
    }
    return result.data;
}

function mapBooking(row: any): EquipmentBooking {
    const booking = {
        id: row.id,
        equipmentId: row.equipment_id,
        taskId: row.task_id,
        bookedBy: row.booked_by,
        startTime: row.start_time,
        endTime: row.end_time,
        unitsRequested: row.units_requested || 1
    };
    const result = EquipmentBookingSchema.safeParse(booking);
    if (!result.success) {
        console.error("[InventoryMapping][Booking] Validation failed:", result.error.format());
        return booking as EquipmentBooking;
    }
    return result.data;
}

// Row Mappers (CamelCase -> SnakeCase)
function mapEquipToRow(data: Partial<EquipmentItem>): any {
    const row: any = {};
    if (data.name !== undefined) row.name = data.name;
    if (data.category !== undefined) row.category = data.category;
    if (data.quantity !== undefined) row.quantity = data.quantity;
    if (data.status !== undefined) row.status = data.status;
    if (data.unit !== undefined) row.unit = data.unit;
    if (data.isRentable !== undefined) row.is_rentable = data.isRentable;
    if (data.rentalRatePerDay !== undefined) row.rental_rate_per_day = data.rentalRatePerDay;
    if (data.serialNumber !== undefined) row.serial_number = data.serialNumber;
    if (data.purchaseDate !== undefined) row.purchase_date = data.purchaseDate;
    if (data.purchasePrice !== undefined) row.purchase_price = data.purchasePrice;
    if (data.condition !== undefined) row.condition = data.condition;
    if (data.imageUrl !== undefined) row.image_url = data.imageUrl;
    if (data.driveFileId !== undefined) row.drive_file_id = data.driveFileId;
    if (data.images !== undefined) row.images = data.images;
    if (data.threshold !== undefined) row.threshold = data.threshold;
    if (data.assetStatus !== undefined) row.asset_status = data.assetStatus;
    if (data.notes !== undefined) row.notes = data.notes;
    if (data.remarks !== undefined) row.remarks = data.remarks;
    return row;
}

function mapBookingToRow(data: Partial<EquipmentBooking>): any {
    const row: any = {};
    if (data.equipmentId !== undefined) row.equipment_id = data.equipmentId;
    if (data.taskId !== undefined) row.task_id = data.taskId;
    if (data.bookedBy !== undefined) row.booked_by = data.bookedBy;
    if (data.startTime !== undefined) row.start_time = data.startTime;
    if (data.endTime !== undefined) row.end_time = data.endTime;
    if (data.unitsRequested !== undefined) row.units_requested = data.unitsRequested;
    return row;
}

export const inventoryService = {
    // READ: Get all items
    async getEquipment(params: { limit?: number; category?: string; institutionId?: string } = {}): Promise<EquipmentItem[]> {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from(TABLES.INVENTORY)
            .select('*')
            .eq('tenant_id', tenantId);

        if (params.limit) query = query.limit(params.limit);
        if (params.category) query = query.eq('category', params.category);
        if (params.institutionId) query = query.eq('institution_id', params.institutionId);

        const { data, error } = await safeQuery(() => query) as { data: any[]; error: any };
        const cacheKey = params.institutionId ? `inventory:${params.institutionId}` : 'inventory';

        if (error) {
            console.warn("[InventoryService] Error fetching equipment, checking cache:", error);
            const cached = await offlineDB.getCache<any[]>(cacheKey);
            return (cached || []).map(mapEquipment);
        }

        if (data) {
            await offlineDB.setCache(cacheKey, data);
        }

        return ((data as any[]) || []).map(mapEquipment);
    },

    // Legacy alias for compatibility
    async getAll(): Promise<EquipmentItem[]> {
        return this.getEquipment();
    },

    async getById(id: string): Promise<EquipmentItem | null> {
        try {
            const { tenantId } = await tenantContext();

            const { data, error } = await safeQuery(() => supabase
                .from(TABLES.INVENTORY)
                .select('*')
                .eq('id', id)
                .eq('tenant_id', tenantId)
                .single()
            ) as { data: any; error: any };

            if (error) throw error;
            return data ? mapEquipment(data) : null;
        } catch (error) {
            console.warn(`[InventoryService] Error fetching item ${id}, checking cache:`, error);
            // Check all inventory caches if institutionId unknown
            const cached = await offlineDB.getCache<any[]>('inventory');
            const item = cached?.find(i => i.id === id);
            return item ? mapEquipment(item) : null;
        }
    },

    async create(data: Partial<EquipmentItem>): Promise<string> {
        const { tenantId, userId } = await tenantContext();

        const { data: newItem, error } = await safeQuery(() => supabase
            .from(TABLES.INVENTORY)
            .insert([{
                ...mapEquipToRow(data),
                tenant_id: tenantId,
                created_by: userId,
                updated_at: new Date().toISOString(),
                created_at: new Date().toISOString()
            }])
            .select()
            .single()
        );

        if (error) throw error;

        const mapped = mapEquipment(newItem);
        eventBus.emit('inventory.updated', { itemId: String(mapped.id), quantity: mapped.quantity });
        return String(mapped.id);
    },

    async update(id: string, data: Partial<EquipmentItem>): Promise<void> {
        const { tenantId } = await tenantContext();

        const { error } = await safeQuery(() => supabase
            .from(TABLES.INVENTORY)
            .update({
                ...mapEquipToRow(data),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('tenant_id', tenantId)
        );

        if (error) throw error;

        if (data.quantity !== undefined) {
            eventBus.emit('inventory.updated', { itemId: id, quantity: data.quantity });
        }
    },

    async delete(id: string): Promise<void> {
        const { tenantId } = await tenantContext();

        const { error } = await safeQuery(() => supabase
            .from(TABLES.INVENTORY)
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId)
        );

        if (error) throw error;
    },

    async getBookings(params: { taskId?: string; equipmentId?: string } = {}): Promise<EquipmentBooking[]> {
        const { tenantId } = await tenantContext();

        let query = supabase
            .from(TABLES.EQUIPMENT_BOOKINGS)
            .select('*')
            .eq('tenant_id', tenantId);

        if (params.taskId) query = query.eq('task_id', params.taskId);
        if (params.equipmentId) query = query.eq('equipment_id', params.equipmentId);

        const { data, error } = await safeQuery(() => query) as { data: any[]; error: any };
        if (error) {
            console.error("[InventoryService] Error fetching bookings:", error);
            return [];
        }

        return ((data as any[]) || []).map(mapBooking);
    },

    async checkAvailability(equipmentId: string, startTimeString: string, endTimeString: string): Promise<AvailabilityInfo> {
        const [bookings, equipment] = await Promise.all([
            this.getBookings({ equipmentId }),
            this.getById(equipmentId)
        ]);

        if (!equipment) return { available: 0, total: 0 };
        const total = equipment.quantity ?? 1;

        const start = new Date(startTimeString).getTime();
        const end = new Date(endTimeString).getTime();

        const conflicts = bookings
            .filter(b => {
                if (!b.startTime || !b.endTime) return false;
                const bStart = new Date(b.startTime).getTime();
                const bEnd = new Date(b.endTime).getTime();
                return bStart < end && bEnd > start;
            });

        const overlapBooked = conflicts.reduce((sum, b) => sum + (b.unitsRequested), 0);

        return {
            available: Math.max(0, total - overlapBooked),
            total,
            conflicts
        };
    },

    async getUpcomingBookings(days: number = 7): Promise<EquipmentBooking[]> {
        const { tenantId } = await tenantContext();
        const now = new Date();
        const future = new Date();
        future.setDate(now.getDate() + days);

        const { data, error } = await safeQuery(() => supabase
            .from(TABLES.EQUIPMENT_BOOKINGS)
            .select(`*, inventory:${TABLES.INVENTORY}!inner(name)`)
            .eq('tenant_id', tenantId)
            .gte('start_time', now.toISOString())
            .lte('start_time', future.toISOString())
            .order('start_time', { ascending: true })
        ) as { data: any[]; error: any };

        if (error) {
            console.error("[InventoryService] Error fetching upcoming bookings:", error);
            return [];
        }

        // We might need to flatten or map names if used in widget
        return ((data as any[]) || []).map(mapBooking);
    },

    async createBooking(booking: Partial<EquipmentBooking>): Promise<EquipmentBooking> {
        const { tenantId, userId } = await tenantContext();

        const { data, error } = await safeQuery(() => supabase
            .from(TABLES.EQUIPMENT_BOOKINGS)
            .insert([{
                ...mapBookingToRow(booking),
                tenant_id: tenantId,
                booked_by: userId
            }])
            .select()
            .single()
        );

        if (error) throw error;
        return mapBooking(data);
    },

    async createRequest(request: any): Promise<{ id: string }> {
        const { tenantId, userId } = await tenantContext();

        const { data, error } = await safeQuery(() => supabase
            .from(TABLES.INVENTORY_REQUESTS)
            .insert([{
                ...request,
                tenant_id: tenantId,
                user_id: userId,
                created_at: new Date().toISOString()
            }])
            .select()
            .single()
        ) as { data: any; error: any };

        if (error) throw error;
        return { id: data.id };
    }
};
