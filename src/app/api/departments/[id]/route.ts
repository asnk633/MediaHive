import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';
import { logSystemActivity } from '@/lib/server/activity-logger';


export const dynamic = 'force-dynamic';

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
        const docRef = db.collection('departments').doc(id);
        const docStart = await docRef.get();

        if (!docStart.exists) {
            return Response.json({ error: 'Department not found' }, { status: 404 });
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

        await logSystemActivity({
            actorId: user.uid,
            actorRole: user.role,
            action: 'unit_renamed',
            severity: 'warning',
            entityType: 'department',
            entityId: id,
            summary: `Office/Unit renamed from '${oldData?.name}' to '${updates.name}'`,
            metadata: {
                oldName: oldData?.name,
                newName: updates.name,
                previousValue: oldData?.name,
                newValue: updates.name
            }
        });

        return Response.json({
            id,
            ...oldData,
            ...updates
        });

    } catch (error: any) {
        console.error('Error updating department:', error);
        return Response.json({ error: error.message || 'Failed to update department' }, { status: 500 });
    }
}
