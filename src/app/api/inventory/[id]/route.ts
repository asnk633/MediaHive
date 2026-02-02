import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
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

        const db = adminDb;
        const docRef = db.collection(COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        const data = doc.data();
        const item = {
            id: doc.id,
            ...data,
            createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
            updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
            purchaseDate: data?.purchaseDate?.toDate?.()?.toISOString() || data?.purchaseDate,
        };

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
        const db = adminDb;
        const docRef = db.collection(COLLECTION).doc(id);

        // Transaction to ensure atomicity when recalculating status
        const updatedItem = await db.runTransaction(async (t) => {
            const doc = await t.get(docRef);
            if (!doc.exists) {
                throw new Error('Item not found');
            }

            const currentData = doc.data()!;

            // Merge new values with old to calculate status
            const newQuantity = body.quantity !== undefined ? Number(body.quantity) : currentData.quantity;
            const newThreshold = body.threshold !== undefined ? Number(body.threshold) : currentData.threshold;

            const updates: any = {
                ...body,
                updatedAt: new Date(),
                status: calculateStatus(newQuantity, newThreshold)
            };

            // Protect immutable fields
            delete updates.id;
            delete updates.createdAt;
            delete updates.createdBy;

            if (updates.purchaseDate) {
                updates.purchaseDate = new Date(updates.purchaseDate);
            }

            t.update(docRef, updates);

            return { id, ...currentData, ...updates };
        });

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role || 'viewer',
            action: 'inventory_item_update',
            entityType: 'inventory_item',
            entityId: id,
            summary: `Updated item: ${updatedItem?.name || 'Unknown Item'}`,
            source: 'system',
            severity: 'info',
            visibility: { mode: 'admin' },
            metadata: { updates: Object.keys(body) }
        });

        // Serialize dates before returning
        return NextResponse.json({
            success: true,
            item: {
                ...updatedItem,
                updatedAt: updatedItem.updatedAt.toISOString(),
                createdAt: updatedItem.createdAt?.toDate ? updatedItem.createdAt.toDate().toISOString() : updatedItem.createdAt
            }
        });

    } catch (error: any) {
        console.error('Error updating inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: error.message === 'Item not found' ? 404 : 500 });
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

        const db = adminDb;
        await db.collection(COLLECTION).doc(id).delete();

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
