import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logServerActivity } from '@/lib/server/activity-logger';

export const dynamic = 'force-dynamic';

const COLLECTION = 'inventory';

// Helper to calculate status
function calculateStatus(quantity: number, threshold: number): 'ok' | 'low' | 'out' {
    if (quantity <= 0) return 'out';
    if (quantity <= threshold) return 'low';
    return 'ok';
}

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const db = adminDb;
        let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');

        // Simple offset-based pagination (efficient enough for < 10k items)
        if (offset > 0) {
            query = query.offset(offset);
        }
        query = query.limit(limit);

        const snapshot = await query.get();

        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            };
        });

        // Get total count for pagination metadata
        // Note: count() queries are efficient in modern Firestore
        const countSnapshot = await db.collection(COLLECTION).count().get();
        const total = countSnapshot.data().count;

        return NextResponse.json({
            items,
            meta: {
                total,
                limit,
                offset,
                hasMore: offset + items.length < total
            }
        });
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();

        // Strict Validation
        const requiredFields = ['name', 'category', 'quantity', 'unit', 'threshold'];
        const missing = requiredFields.filter(field => data[field] === undefined || data[field] === null || data[field] === '');

        if (missing.length > 0) {
            return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
        }

        const quantity = Number(data.quantity);
        const threshold = Number(data.threshold);

        if (isNaN(quantity) || isNaN(threshold)) {
            return NextResponse.json({ error: 'Quantity and threshold must be numbers' }, { status: 400 });
        }

        const db = adminDb;

        const newItem = {
            name: String(data.name),
            category: String(data.category),
            quantity,
            unit: String(data.unit),
            threshold,
            status: calculateStatus(quantity, threshold),
            createdBy: user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Extended Data Support (Pass-through)
            imageUrl: data.imageUrl || null,
            images: data.images || [], // Persist multi-images
            driveFileId: data.driveFileId || null,
            condition: data.condition,
            serialNumber: data.serialNumber,
            remarks: data.remarks,
            purchasePrice: Number(data.purchasePrice) || 0,
            assetStatus: data.assetStatus,
            locationStr: data.locationStr || null,
            notes: data.notes || null,
            purchaseDate: data.purchaseDate // ISO String
        };

        const docRef = await db.collection(COLLECTION).add(newItem);

        await logServerActivity({
            type: 'inventory_create',
            entityType: 'inventory',
            entityId: docRef.id,
            title: `Asset Created: ${newItem.name}`,
            performedBy: user.name || 'Unknown',
            performedByRole: user.role || 'admin',
            metadata: {
                quantity: newItem.quantity,
                category: newItem.category
            }
        });

        return NextResponse.json({
            id: docRef.id,
            ...newItem,
            createdAt: newItem.createdAt.toISOString(),
            updatedAt: newItem.updatedAt.toISOString()
        }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
    }
}
