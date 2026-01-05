import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

const COLLECTION = 'inventory';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = adminDb;
        const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();

        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Handle Timestamp conversion for serialization
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            };
        });

        return Response.json({ items });
    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        return Response.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();
        const db = adminDb;

        const newItem = {
            ...data,
            createdBy: user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection(COLLECTION).add(newItem);

        return Response.json({ id: docRef.id, ...newItem }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating inventory item:', error);
        return Response.json({ error: error.message || 'Failed to create item' }, { status: 500 });
    }
}
