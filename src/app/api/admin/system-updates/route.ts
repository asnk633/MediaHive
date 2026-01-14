import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';
import { ServerNotification } from '@/lib/server-notification';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const snapshot = await adminDb.collection('system_updates')
            .orderBy('createdAt', 'desc')
            .limit(50)
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
        console.error('Error fetching updates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { title, body: messageBody, severity } = body;

        if (!title || !messageBody) {
            return NextResponse.json({ error: 'Title and Body required' }, { status: 400 });
        }

        const validSeverities = ['info', 'important', 'critical'];
        const finalSeverity = validSeverities.includes(severity) ? severity : 'info';

        // 1. Create Update Record
        const updateDoc = {
            title,
            body: messageBody,
            severity: finalSeverity,
            createdBy: {
                uid: user.uid,
                name: user.name || 'Admin'
            },
            createdAt: new Date(),
            archived: false
        };

        const docRef = await adminDb.collection('system_updates').add(updateDoc);

        // 2. Broadcast
        const result = await ServerNotification.broadcastSystemUpdate({
            id: docRef.id,
            title,
            body: messageBody,
            severity: finalSeverity,
            creatorId: user.uid
        });

        // 3. Log Activity
        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role,
            action: 'system_update_published',
            entityType: 'system_update',
            entityId: docRef.id,
            severity: finalSeverity === 'critical' ? 'critical' : 'info',
            summary: `Published System Update: ${title}`,
            metadata: {
                recipients: result.sent,
                severity: finalSeverity
            }
        });

        return NextResponse.json({
            message: 'System Update published',
            id: docRef.id,
            sent: result.sent
        });

    } catch (error: any) {
        console.error('Error publishing update:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
