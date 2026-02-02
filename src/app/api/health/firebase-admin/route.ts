import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';


export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = adminDb;

        // Perform a lightweight read to verify connectivity and permissions
        // We check valid project ID from env if needed for response
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'unknown';

        // Listing 1 doc is better to prove WE HAVE PERMISSION to read 'users'.
        const usersSnap = await db.collection('users').limit(1).get();

        return NextResponse.json({
            ok: true,
            projectId: projectId,
            usersReadable: true,
            userCountCheck: usersSnap.size
        });
    } catch (error: any) {
        console.error('[HEALTH] Firebase Admin Health Check Failed:', error);
        return NextResponse.json({
            ok: false,
            error: error.message,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
