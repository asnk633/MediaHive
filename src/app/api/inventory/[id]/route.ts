import { NextRequest, NextResponse } from 'next/server';
import { withTenant, handleApiError } from '@/lib/db/withTenant';
import { logSystemActivity } from '@/lib/server/activity-logger';

export const dynamic = 'force-dynamic';

const COLLECTION = 'inventory';

function calculateStatus(quantity: number, threshold: number): 'ok' | 'low' | 'out' {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'ok';
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { db, tenantId } = await withTenant();

        const { data: item, error } = await db
            .from(COLLECTION)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (error) return handleApiError('INV_FETCH_SINGLE', error);
        if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        console.log(`[DB] query executed: fetched inventory item ${id}`);
        return NextResponse.json(item);
    } catch (error: any) {
        return handleApiError('INV_GET_ID_ROUTE', error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { db, tenantId, user } = await withTenant();

        // Role check
        const role = (user.app_metadata?.role || user.user_metadata?.role) as string;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        // Fetch current to calculate status and verify tenant
        const { data: current, error: fetchError } = await db
            .from(COLLECTION)
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .single();

        if (fetchError || !current) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

        const newQuantity = body.quantity !== undefined ? Number(body.quantity) : current.quantity;
        const newThreshold = body.threshold !== undefined ? Number(body.threshold) : current.threshold;

        const updates: any = {
            name: body.name !== undefined ? body.name : current.name,
            category: body.category !== undefined ? body.category : current.category,
            quantity: newQuantity,
            threshold: newThreshold,
            unit: body.unit !== undefined ? body.unit : current.unit,
            status: calculateStatus(newQuantity, newThreshold),
            updated_at: new Date().toISOString(),
            image_url: body.imageUrl !== undefined ? body.imageUrl : current.image_url,
            images: body.images !== undefined ? body.images : current.images,
            drive_file_id: body.driveFileId !== undefined ? body.driveFileId : current.drive_file_id,
            condition: body.condition !== undefined ? body.condition : current.condition,
            serial_number: body.serialNumber !== undefined ? body.serialNumber : current.serial_number,
            remarks: body.remarks !== undefined ? body.remarks : current.remarks,
            purchase_price: body.purchasePrice !== undefined ? Number(body.purchasePrice) : current.purchase_price,
            asset_status: body.assetStatus !== undefined ? body.assetStatus : current.asset_status,
            location_str: body.locationStr !== undefined ? body.locationStr : current.location_str,
            notes: body.notes !== undefined ? body.notes : current.notes,
            purchase_date: body.purchaseDate !== undefined ? body.purchaseDate : current.purchase_date
        };

        const { data: updated, error: updateError } = await db
            .from(COLLECTION)
            .update(updates)
            .eq('tenant_id', tenantId)
            .eq('id', id)
            .select()
            .single();

        if (updateError) return handleApiError('INV_UPDATE', updateError);

        await logSystemActivity({
            actorId: user.id,
            actorRole: role,
            action: 'inventory_item_update',
            entityType: 'inventory_item',
            entityId: id,
            summary: `Updated item: ${updated.name}`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: { updates: Object.keys(body) }
        });

        console.log(`[DB] query executed: updated inventory item ${id}`);
        return NextResponse.json({ success: true, item: updated });

    } catch (error: any) {
        return handleApiError('INV_PATCH_ID_ROUTE', error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { db, tenantId, user } = await withTenant();

        // Role check
        const role = (user.app_metadata?.role || user.user_metadata?.role) as string;
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error } = await db
            .from(COLLECTION)
            .delete()
            .eq('tenant_id', tenantId)
            .eq('id', id);

        if (error) return handleApiError('INV_DELETE', error);

        await logSystemActivity({
            actorId: user.id,
            actorRole: role,
            action: 'inventory_item_delete',
            entityType: 'inventory_item',
            entityId: id,
            summary: `Deleted inventory asset: ${id}`,
            source: 'system',
            severity: 'warning',
            visibility: { mode: 'admin' }
        });

        console.log(`[DB] query executed: deleted inventory item ${id}`);
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        return handleApiError('INV_DELETE_ID_ROUTE', error);
    }
}
