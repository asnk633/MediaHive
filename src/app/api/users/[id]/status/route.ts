import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard';

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify Admin Access
        await requireAdminWithVerifiedEmail(request);

        // 2. Await Params (Next.js 15+ requirement)
        // Note: Even in Next.js 14, params can be async. In 15 it's enforced.
        // To be safe and compliant, we treat it as async or access properties carefully.
        // However, the function signature `{ params }` with `await params` is the modern pattern.
        // But since `params` might not be a promise in the current Next.js version used, 
        // let's check the Next.js version from the error logs: "Next.js version: 16.0.7 (Turbopack)".
        // Next.js 15+ definitely requires awaiting params.
        const { id: userId } = await params;

        if (!userId) {
            return Response.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 3. Parse Body
        const body = await request.json();
        const { status, updatedBy } = body;

        if (!status || !['active', 'disabled'].includes(status)) {
            return Response.json({ error: 'Invalid status provided' }, { status: 400 });
        }

        const db = adminDb;

        // 4. Update Firestore
        await db.collection('users').doc(userId).update({
            status,
            statusUpdatedAt: new Date().toISOString(),
            statusUpdatedBy: updatedBy || 'admin'
        });

        return Response.json({ success: true, message: `User status updated to ${status}` });

    } catch (error: any) {
        console.error(`[API] Error updating user status:`, error);
        return Response.json(
            { error: error.message || 'Failed to update user status' },
            { status: 500 }
        );
    }
}
