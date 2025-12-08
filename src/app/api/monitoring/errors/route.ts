// src/app/api/monitoring/errors/route.ts
// Endpoint to receive browser console errors for monitoring

import { NextRequest, NextResponse } from 'next/server';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - only admin can access monitoring
    const user = await authorizeByPermission(req, 'manage:users');
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get error data from request body
    const { error, url, userAgent } = await req.json();

    // In a real implementation, this would log to a monitoring service
    console.log('[MONITORING] Browser error reported:', {
      error,
      url,
      userAgent,
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    // Return success
    return NextResponse.json(
      {
        success: true,
        message: 'Error reported successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/monitoring/errors]', error);
    return NextResponse.json(
      { error: 'Failed to report error' },
      { status: 500 }
    );
  }
}