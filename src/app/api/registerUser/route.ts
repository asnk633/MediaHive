import { NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/server';

export async function POST(request: NextRequest) {
  try {
    const { idToken, fullName, email } = await request.json();

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

    // Create the user profile document
    await userRef.set({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      role: 'team', // Default role for new users
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