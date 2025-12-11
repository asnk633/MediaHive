import { NextResponse } from 'next/server';
import { initFirebase, getFirebaseAuth, getFirebaseDb } from '@/firebase/client';

export async function GET() {
  try {
    // Initialize Firebase and get instances
    const { app } = await initFirebase();
    const auth = await getFirebaseAuth();
    const db = await getFirebaseDb();

    // Safely access app.name (may not exist in mock mode)
    const appName = (app as any)?.name ?? 'mock-firebase-app';

    return NextResponse.json({
      status: 'ok',
      firebase: {
        name: appName,
        authInitialized: !!auth,
        dbInitialized: !!db,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}