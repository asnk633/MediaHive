import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Checks for idempotency key in headers and enforces uniqueness only if key is present.
 * If key was already seen within TTL, returns stored response (if cached) or conflict.
 * 
 * Header: Idempotency-Key
 */
export async function verifyIdempotency(req: NextRequest): Promise<NextResponse | null> {
    const key = req.headers.get('Idempotency-Key');
    if (!key) return null; // No key = no idempotency check

    const db = adminDb;
    const docRef = db.collection('idempotency_keys').doc(key);

    try {
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            // Check expiry (TTL) - e.g. 24 hours
            const now = Date.now();
            const createdAt = data?.createdAt?.toMillis() || 0;

            if (now - createdAt < 24 * 60 * 60 * 1000) {
                // Key exists and is valid. Return Conflict or Cached result.
                // Simple strategy: Return 409 Conflict saying "Operation already processed".
                return NextResponse.json(
                    { error: 'Idempotency key already used', originalRequest: data?.createdAt },
                    { status: 409 }
                );
            }
        }

        // Key not found or expired. Reserve it.
        // We reserve it "pending".
        await docRef.set({
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending',
            path: req.nextUrl.pathname,
            ip: req.headers.get('x-forwarded-for') || 'unknown'
        });

        return null; // Proceed
    } catch (error) {
        console.error('[IDEMPOTENCY_CHECK_FAILED]', error);
        // If DB fails, we fail open or closed? 
        // Fail closed (deny) is safer for idempotency guarantees, but availability suffers.
        // Choosing fail open (permit) for now to avoid blocking on DB hiccups, logging error.
        return null;
    }
}
