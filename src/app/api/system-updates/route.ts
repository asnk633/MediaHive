import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const snapshot = await adminDb.collection('system_updates')
            .where('archived', '==', false)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const updates = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt
            };
        });

        return NextResponse.json({ updates });
    } catch (error: any) {
        console.error('Error fetching system updates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
