import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const docRef = firestore.collection('campaigns').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const data = docSnap.data();

        // Check access: Admin, Team, or Member
        if (user.role !== 'admin' && user.role !== 'team' && !data?.members?.includes(user.uid)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ campaign: { id: docSnap.id, ...data } });
    } catch (error: any) {
        console.error('[GET /api/campaigns/:id]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { updates } = await req.json();

        const docRef = firestore.collection('campaigns').doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const currentData = docSnap.data();

        // Permission: Only Creator or Admin? Or Team?
        // Service check: updateCampaign passes user, but backend should verify.
        // Assuming Admin or Owner can edit.
        const isOwner = currentData?.ownerId === user.uid || currentData?.createdBy?.uid === user.uid;

        if (user.role !== 'admin' && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[PUT /api/campaigns/:id]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin/Team? Service says: "if (!['admin', 'team'].includes(user.role))"
        if (user.role !== 'admin' && user.role !== 'team') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await firestore.collection('campaigns').doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[DELETE /api/campaigns/:id]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
