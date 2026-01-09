import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import { isFeatureEnabled } from '@/app/featureFlags';

export const InviteServiceServer = {
    createInvite: async (
        email: string,
        role: 'admin' | 'team' | 'guest',
        invitedByUserId: string,
        institutionId: string | null, // Made nullable to support dept-only
        departmentId: string | null   // Added departmentId
    ): Promise<string> => {
        // Feature check usually safe if shared config

        const inviteRef = adminDb.collection('invites').doc(); // Auto ID
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await inviteRef.set({
            email,
            role,
            invitedBy: invitedByUserId,
            institutionId, // Can be null
            departmentId,  // Can be null
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAt),
            used: false
        });

        return inviteRef.id;
    },

    getInstitutionInvites: async (institutionId: string) => {
        const snapshot = await adminDb.collection('invites')
            .where('institutionId', '==', institutionId)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Serialize timestamps if needed, or return raw data if API route handles it
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
                expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : data.expiresAt,
            };
        });
    },

    deleteInvite: async (inviteId: string) => {
        await adminDb.collection('invites').doc(inviteId).delete();
    }
};

import { Timestamp } from 'firebase-admin/firestore';
