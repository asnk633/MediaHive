// src/app/api/face/vips/route.ts
// VIP Listing API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { config } from '@/lib/config';
import { listVIPs, deleteVIP } from '@/lib/faceRecognition';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

// GET /api/face/vips - List enrolled VIPs (admin-only)
export async function GET(request: NextRequest) {
  // Check if feature is enabled
  if (!config.FEATURE_FACE_RECOGNITION) {
    return NextResponse.json(
      { error: 'Face recognition feature is disabled' },
      { status: 404 }
    );
  }
  
  try {
    // Authorize user with RBAC - only admins can list VIPs
    const user = await authorizeByPermission(request, 'manage:users');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can list VIPs' },
        { status: 403 }
      );
    }
    
    // List VIPs
    const vips = await listVIPs();
    
    return NextResponse.json(vips, { status: 200 });
  } catch (error: unknown) {
    console.error('VIP listing error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to list VIPs: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to list VIPs: Unknown error' },
        { status: 500 }
      );
    }
  }
}

// POST /api/face/vips - Create a VIP (handled by enroll endpoint)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Use POST /api/face/enroll to enroll VIPs' },
    { status: 400 }
  );
}
