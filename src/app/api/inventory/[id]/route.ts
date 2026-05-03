import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, getSupabaseFromRequest } from '@/lib/server-utils';
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
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { data: item, error } = await supabase
            .from(COLLECTION)
            .select('*')
            .eq('id', id)
            .single();

        if (error || !item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json(item);
    } catch (error: any) {
        console.error('Error fetching inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch item' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        // Fetch current to calculate status
        const { data: current, error: fetchError } = await supabase
            .from(COLLECTION)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

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

        const { data: updated, error: updateError } = await supabase
            .from(COLLECTION)
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'viewer',
            action: 'inventory_item_update',
            entityType: 'inventory_item',
            entityId: id,
            summary: `Updated item: ${updated.name}`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: { updates: Object.keys(body) }
        });

        return NextResponse.json({ success: true, item: updated });

    } catch (error: any) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const supabase = getSupabaseFromRequest(request);
        if (!supabase) return NextResponse.json({ error: 'Internal Error' }, { status: 500 });

        const { error } = await supabase
            .from(COLLECTION)
            .delete()
            .eq('id', id);

        if (error) throw error;

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'admin',
            action: 'inventory_item_delete',
            entityType: 'inventory_item',
            entityId: id,
            summary: `Deleted inventory asset: ${id}`,
            source: 'system',
            severity: 'warning',
            visibility: { mode: 'admin' }
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error deleting inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
    }
}
