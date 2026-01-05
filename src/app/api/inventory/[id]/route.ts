import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

const COLLECTION = 'inventory';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Params are now Promises in Next.js 15+
) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = adminDb;
        const docRef = db.collection(COLLECTION).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return Response.json({ error: 'Item not found' }, { status: 404 });
        }

        const data = doc.data();
        const item = {
            id: doc.id,
            ...data,
            // Handle Timestamp conversion
            createdAt: data?.createdAt?.toDate?.()?.toISOString() || data?.createdAt,
            updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || data?.updatedAt,
            purchaseDate: data?.purchaseDate?.toDate?.()?.toISOString() || data?.purchaseDate,
        };

        return Response.json(item);
    } catch (error: any) {
        console.error('Error fetching inventory item:', error);
        return Response.json({ error: error.message || 'Failed to fetch item' }, { status: 500 });
    }
}
// PATCH: Update an item
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const db = adminDb;
        const docRef = db.collection(COLLECTION).doc(id);

        // Update timestamp
        const updateData = {
            ...body,
            updatedAt: new Date(),
            // Ensure purchasedDate is treated correctly if present
            ...(body.purchaseDate ? { purchaseDate: new Date(body.purchaseDate) } : {}),
        };

        // Remove ID from body if present to avoid overwriting doc ID (though Firestore ignores it usually)
        delete updateData.id;

        await docRef.update(updateData);

        return Response.json({ success: true, id });
    } catch (error: any) {
        console.error('Error updating inventory item:', error);
        return Response.json({ error: error.message || 'Failed to update item' }, { status: 500 });
    }
}

// DELETE: Remove an item
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) {
            return Response.json({ error: 'ID is required' }, { status: 400 });
        }

        const db = adminDb;
        await db.collection(COLLECTION).doc(id).delete();

        return Response.json({ success: true, id });
    } catch (error: any) {
        console.error('Error deleting inventory item:', error);
        return Response.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
    }
}
