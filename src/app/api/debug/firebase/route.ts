import { NextResponse } from 'next/server';
import { initFirebase, getFirebaseAuth, getFirebaseDb } from '@/firebase/client';

export async function GET() {
  try {
    // Initialize Firebase
    const app = await initFirebase();
    
    // Get auth and db instances
    const auth = await getFirebaseAuth();
    const db = await getFirebaseDb();
    
    // Check if Firebase is ready
    const isFirebaseReady = typeof window !== 'undefined' && !!(window as any).__FIREBASE_READY__;
    
    // Get Firebase app info
    const appInfo = {
      name: app.name,
      options: app.options,
      isReady: isFirebaseReady,
    };
    
    // Get auth info
    const authInfo = {
      currentUser: auth.currentUser ? {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
      } : null,
      persistence: (auth as any)._persistence?._name || 'unknown',
    };
    
    return NextResponse.json({
      success: true,
      app: appInfo,
      auth: authInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}