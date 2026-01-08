import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminWithVerifiedEmail(request);

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

        return Response.json({
            id,
            ...docStart.data(),
            ...updates
        });

    } catch (error: any) {
        console.error('Error updating department:', error);
        return Response.json({ error: error.message || 'Failed to update department' }, { status: 403 });
    }
}
