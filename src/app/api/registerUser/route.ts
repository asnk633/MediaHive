import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { idToken, fullName, email, institutionId: reqInstitutionId, departmentId: reqDepartmentId } = await request.json();

    if (!idToken || !fullName || !email) {
      return Response.json(
        { error: 'idToken, fullName, and email are required' },
        { status: 400 }
      );
    }

    // Verify the ID token to get user information
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const db = adminDb;

    // Check if user profile already exists to prevent duplicates
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      console.warn(`User profile already exists for ${userId}, skipping creation`);
      return Response.json({
        message: 'User profile already exists',
        userId,
        skipped: true
      });
    }

    // --- CHECK FOR INVITE ---
    const normalizedEmail = email.toLowerCase().trim();
    let role = 'guest'; // Default to guest if no invite

    // Default to user selection, but Invite takes precedence
    let institutionId = reqInstitutionId || null;
    let departmentId = reqDepartmentId || null;

    const invitesSnap = await db.collection('invites')
      .where('email', '==', normalizedEmail)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (!invitesSnap.empty) {
      const inviteDoc = invitesSnap.docs[0];
      const inviteData = inviteDoc.data();

      console.log(`Found active invite for ${normalizedEmail}:`, inviteData);

      role = inviteData.role || 'guest';

      // Override with invite data if present (Invite Authority)
      if (inviteData.institutionId) institutionId = inviteData.institutionId;
      if (inviteData.departmentId) departmentId = inviteData.departmentId;

      // Mark invite as used
      await inviteDoc.ref.update({
        used: true,
        usedBy: userId,
        usedAt: FieldValue.serverTimestamp()
      });
    } else {
      console.log(`No active invite found for ${normalizedEmail}, assigning default role.`);
    }

    // --- AUTO-ASSIGN HQ IF UNIT SELECTED ---
    // If user is in a Unit (Department) but has no specific Institution, assign to HQ.
    if (departmentId && !institutionId) {
      try {
        const { ensureHeadquartersInstitution } = await import('@/lib/server-utils');
        institutionId = await ensureHeadquartersInstitution();
        console.log(`[Register] Assigned ${normalizedEmail} to HQ (${institutionId}) because they selected a Unit.`);
      } catch (hqError) {
        console.error('[Register] Failed to assign HQ:', hqError);
        // Fallback: proceed without institutionId (or fail? Let's proceed to avoid blocking signup, 
        // but this will cause the original issue. Better to log error. Permissions will fail later but user is created.)
      }
    }

    // Create the user profile document
    await userRef.set({
      fullName: fullName.trim(),
      email: normalizedEmail,
      role,
      institutionId,
      departmentId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      emailVerified: decodedToken.email_verified || false
    });

    console.log(`Successfully created user profile for ${userId}`);

    return Response.json({
      message: 'User profile created successfully',
      userId,
      success: true
    });
  } catch (error: any) {
    console.error('Error creating user profile:', error);

    if (error.code?.includes('auth/id-token-expired') || error.code?.includes('auth/id-token-revoked')) {
      return Response.json(
        { error: 'Invalid or expired authentication token' },
        { status: 401 }
      );
    }

    return Response.json(
      { error: error.message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
}
