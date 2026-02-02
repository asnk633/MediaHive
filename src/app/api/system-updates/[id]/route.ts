import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const user = await verifyUser(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const doc = await adminDb.collection('system_updates').doc(id).get();
        if (!doc.exists) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const data = doc.data();
        const update = {
            id: doc.id,
            ...data,
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt
        };

        return NextResponse.json({ update });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
