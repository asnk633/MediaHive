// @ts-nocheck
// src/app/api/equipment-bookings/route.ts
// Equipment Bookings API - GET bookings & POST new booking with multi-unit conflict check

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { equipmentBookings } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyUser } from '@/lib/server/server-utils';
import { withTenant } from '@/lib/tenantQuery';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyUser(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Tenant Security Guard
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[GET /api/equipment-bookings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const equipmentId = searchParams.get('equipment_id');
        const taskId = searchParams.get('task_id');
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        let query = db.select().from(equipmentBookings);
        const conditions = [];

        if (equipmentId) {
            conditions.push(eq(equipmentBookings.equipment_id, equipmentId));
        }
        if (taskId) {
            conditions.push(eq(equipmentBookings.task_id, taskId));
        }
        if (start) {
            conditions.push(sql`${equipmentBookings.start_time} >= ${start}`);
        }
        if (end) {
            conditions.push(sql`${equipmentBookings.end_time} <= ${end}`);
        }

        if (conditions.length > 0) {
            query = query.where(and(eq(equipmentBookings.tenant_id, tenantId), ...conditions));
        } else {
            query = query.where(eq(equipmentBookings.tenant_id, tenantId));
        }

        const bookings = await query;
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
        const tenantId = user.tenant_id;
        if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
            console.error(`[POST /api/equipment-bookings] ❌ Missing tenant context for user: ${user.uid}`);
            return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
        }

        const body = await req.json();
        const { equipment_id, task_id, start_time, end_time, units_requested = 1 } = body;

        if (!equipment_id || !task_id || !start_time || !end_time) {
            return NextResponse.json(
                { error: 'equipment_id, task_id, start_time, and end_time are required' },
                { status: 400 }
            );
        }

        const unitsReq = Math.max(1, parseInt(units_requested, 10) || 1);

        // --- Fetch total units for this equipment item from inventory ---
        const inventoryResult = await db.execute(
            sql`SELECT quantity FROM inventory 
                WHERE id = ${equipment_id}::uuid 
                AND tenant_id = ${tenantId}::uuid 
                LIMIT 1`
        );
        const totalUnits = parseInt(inventoryResult.rows?.[0]?.quantity ?? '0', 10);

        if (inventoryResult.rows.length === 0) {
            return NextResponse.json({ error: 'Item not found in your tenant' }, { status: 404 });
        }

        // --- Sum up all overlapping bookings' units_requested ---
        // Overlap: existing.start < new.end AND existing.end > new.start
        const overlapResult = await db.execute(sql`
            SELECT COALESCE(SUM(units_requested), 0) AS booked_units
            FROM equipment_bookings
            WHERE equipment_id = ${equipment_id}::uuid
              AND tenant_id = ${tenantId}::uuid
              AND start_time < ${end_time}::timestamptz
              AND end_time   > ${start_time}::timestamptz
        `);

        const bookedUnits = parseInt(overlapResult.rows?.[0]?.booked_units ?? '0', 10);
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
                equipment_id,
                task_id,
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
