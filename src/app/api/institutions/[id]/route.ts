import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyUser(request);
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });

        const body = await request.json();
        const { name, status } = body;

        const db = adminDb;
        const docRef = db.collection('institutions').doc(id);
        const docStart = await docRef.get();

        if (!docStart.exists) {
            return Response.json({ error: 'Institution not found' }, { status: 404 });
        }

        const oldData = docStart.data();
        const updates: any = {
            updatedAt: new Date().toISOString()
        };

        if (name && typeof name === 'string' && name.trim()) {
            updates.name = name.trim();
        }

        if (status && (status === 'active' || status === 'archived')) {
            updates.status = status;
        }

        await docRef.update(updates);

        // Audit Logging
        if (updates.name && oldData?.name !== updates.name) {
            await logSystemActivity({
                action: 'institution_renamed',
                severity: 'warning',
                entityType: 'institution',
                entityId: id,
                details: {
                    oldName: oldData?.name,
                    newName: updates.name,
                    summary: `Institution renamed from '${oldData?.name}' to '${updates.name}'`
                },
                actorId: user.uid,
                metadata: {
                    previousValue: oldData?.name,
                    newValue: updates.name
                }
            });
        }

        return Response.json({
            id,
            ...oldData,
            ...updates
        });

    } catch (error: any) {
        console.error('Error updating institution:', error);
        return Response.json({ error: error.message || 'Failed to update institution' }, { status: 500 });
    }
}
