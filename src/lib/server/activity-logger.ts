import { adminDb } from '@/lib/firebase/server';
import { SystemActivity } from '@/types/activity';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Logs a system activity to Firestore collection 'system_activities'
 * Safe to call from API routes (Next.js Server Side)
 */
export async function logServerActivity(
    event: Omit<SystemActivity, 'id' | 'timestamp'>
) {
    try {
        const collectionRef = adminDb.collection('system_activities');

        await collectionRef.add({
            ...event,
            timestamp: FieldValue.serverTimestamp(), // Use server timestamp
            createdAt: new Date().toISOString()      // Fallback/Redundancy
        });

    } catch (error) {
        // We do NOT want to crash the main request if logging fails
        console.error('[ActivityLogger] Failed to log activity:', error);
    }
}
