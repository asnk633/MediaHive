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

        // Verify campaign existence and access (optional but good practice)
        const campaignDoc = await firestore.collection('campaigns').doc(id).get();
        if (!campaignDoc.exists) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        const campaignData = campaignDoc.data();

        // Basic access check: Admin, Team, or Member
        // Adjust logic based on your strict rules if necessary. 
        // For now, assuming if you have access to the app, you can list tasks for a campaign you can see.
        // If strictly private, add: if (user.role !== 'admin' && !campaignData?.members?.includes(user.uid)) ...

        const tasksSnapshot = await firestore.collection('tasks')
            .where('campaignId', '==', id)
            .get();

        const tasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure dates are serialized if needed, though JSON response handles basics.
            // Firestore timestamps typically need conversion if the client expects ISO strings or specific formats.
        }));

        return NextResponse.json({ tasks });

    } catch (error: any) {
        console.error('[GET /api/campaigns/:id/tasks]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
