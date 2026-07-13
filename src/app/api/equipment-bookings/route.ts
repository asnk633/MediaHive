// src/app/api/equipment-bookings/route.ts
// Equipment Bookings API - GET bookings & POST new booking with multi-unit conflict check

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/db';
import { equipmentBookings, inventory } from '@/db/schema';
import { eq, and, sql, lt, gt } from 'drizzle-orm';
import { verifyUser } from '@/lib/server/server-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Tenant Security Guard
        const tenantIdStr = user.tenant_id;
        if (!tenantIdStr || tenantIdStr === 'null' || tenantIdStr === 'undefined') {
            console.error(`[GET /api/equipment-bookings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }
        
        const tenantId = parseInt(String(tenantIdStr), 10);
        if (isNaN(tenantId)) {
            return NextResponse.json({ error: 'Invalid tenant context' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const equipmentId = searchParams.get('equipment_id');
        const taskId = searchParams.get('task_id');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        const db = await getDb();

        const conditions = [];

        if (equipmentId) {
            conditions.push(eq(equipmentBookings.equipment_id, equipmentId));
        }
        if (taskId) {
            const parsedTaskId = parseInt(taskId, 10);
            if (!isNaN(parsedTaskId)) {
                conditions.push(eq(equipmentBookings.task_id, parsedTaskId));
            }
        }
        if (start) {
            conditions.push(sql`${equipmentBookings.start_time} >= ${start}`);
        }
        if (end) {
            conditions.push(sql`${equipmentBookings.end_time} <= ${end}`);
        }

        let bookings;
        if (conditions.length > 0) {
            bookings = await db.select()
                .from(equipmentBookings)
                .where(and(eq(equipmentBookings.tenant_id, tenantId), ...conditions));
        } else {
            bookings = await db.select()
                .from(equipmentBookings)
                .where(eq(equipmentBookings.tenant_id, tenantId));
        }

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('[GET /api/equipment-bookings]', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Tenant Security Guard
        const tenantIdStr = user.tenant_id;
        if (!tenantIdStr || tenantIdStr === 'null' || tenantIdStr === 'undefined') {
            console.error(`[POST /api/equipment-bookings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const tenantId = parseInt(String(tenantIdStr), 10);
        if (isNaN(tenantId)) {
            return NextResponse.json({ error: 'Invalid tenant context' }, { status: 403 });
        }

        const body = await req.json();
        const { equipment_id, task_id, start_time, end_time, units_requested = 1 } = body;

        if (!equipment_id || !task_id || !start_time || !end_time) {
            return NextResponse.json(
                { error: 'equipment_id, task_id, start_time, and end_time are required' },
                { status: 400 }
            );
        }

        const parsedEquipmentId = parseInt(String(equipment_id), 10);
        if (isNaN(parsedEquipmentId)) {
            return NextResponse.json({ error: 'Invalid equipment_id' }, { status: 400 });
        }

        const parsedTaskId = parseInt(String(task_id), 10);
        if (isNaN(parsedTaskId)) {
            return NextResponse.json({ error: 'Invalid task_id' }, { status: 400 });
        }

        const unitsReq = Math.max(1, parseInt(String(units_requested), 10) || 1);

        const db = await getDb();

        // --- Fetch total units for this equipment item from inventory ---
        const inventoryItem = await db.select({ quantity: inventory.quantity })
            .from(inventory)
            .where(and(
                eq(inventory.id, parsedEquipmentId),
                eq(inventory.tenantId, tenantId)
            ))
            .limit(1);

        if (inventoryItem.length === 0) {
            return NextResponse.json({ error: 'Item not found in your tenant' }, { status: 404 });
        }

        const totalUnits = inventoryItem[0].quantity;

        // --- Sum up all overlapping bookings' units_requested ---
        // Overlap: existing.start < new.end AND existing.end > new.start
        const overlapResult = await db.select({
            bookedUnits: sql<number>`coalesce(sum(${equipmentBookings.units_requested}), 0)`
        })
        .from(equipmentBookings)
        .where(and(
            eq(equipmentBookings.equipment_id, String(parsedEquipmentId)),
            eq(equipmentBookings.tenant_id, tenantId),
            lt(equipmentBookings.start_time, new Date(end_time).toISOString()),
            gt(equipmentBookings.end_time, new Date(start_time).toISOString())
        ));

        const bookedUnits = Number(overlapResult[0]?.bookedUnits ?? 0);
        const availableUnits = totalUnits - bookedUnits;

        if (unitsReq > availableUnits) {
            return NextResponse.json(
                {
                    error: 'insufficient_units',
                    message: `Only ${availableUnits} of ${totalUnits} unit(s) are available for this time range. You requested ${unitsReq}.`,
                    total_units: totalUnits,
                    booked_units: bookedUnits,
                    available_units: availableUnits,
                },
                { status: 409 }
            );
        }

        const [booking] = await db
            .insert(equipmentBookings)
            .values({
                equipment_id: String(parsedEquipmentId),
                task_id: parsedTaskId,
                booked_by: user.uid,
                tenant_id: tenantId,
                start_time: new Date(start_time).toISOString(),
                end_time: new Date(end_time).toISOString(),
                units_requested: unitsReq,
            })
            .returning();

        return NextResponse.json(booking, { status: 201 });
    } catch (error) {
        console.error('[POST /api/equipment-bookings]', error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
