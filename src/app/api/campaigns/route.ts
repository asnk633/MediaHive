import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        // The service sends role/userId but we trust verifyUser token more. 
        // We can ignore query params and use token data for security.

        let query: FirebaseFirestore.Query = firestore.collection('campaigns');

        // Admin & Team see all active campaigns
        // Guests see only where they are members or owner
        if (user.role !== 'admin' && user.role !== 'team') {
            query = query.where('members', 'array-contains', user.uid);
        }

        const snapshot = await query.get();
        const campaigns = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ campaigns });
    } catch (error: any) {
        console.error('[GET /api/campaigns]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { firestore } = await getFirebaseServices();
        const user = await verifyUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Enforce basic metadata overrides for safety
        const campaignData = {
            ...body,
            createdAt: new Date().toISOString(),
            createdBy: {
                uid: user.uid,
                role: user.role,
                name: user.name
            }
        };

        const docRef = await firestore.collection('campaigns').add(campaignData);

        return NextResponse.json({ id: docRef.id, message: 'Campaign created' }, { status: 201 });
    } catch (error: any) {
        console.error('[POST /api/campaigns]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
