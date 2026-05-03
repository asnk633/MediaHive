// src/app/api/face/vips/[id]/route.ts
// VIP Deletion API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { deleteVIP } from '@/lib/faceRecognition';
import { authorizeByPermission } from '@/app/api/_lib/rbac';

// DELETE /api/face/vips/:id - Delete a VIP (admin-only)

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Check if feature is enabled
  if (!config.FEATURE_FACE_RECOGNITION) {
    return NextResponse.json(
      { error: 'Face recognition feature is disabled' },
      { status: 404 }
    );
  }

  try {
    // Authorize user with RBAC - only admins can delete VIPs
    const user = await authorizeByPermission(request, 'manage:users');

    if (!user) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete VIPs' },
        { status: 403 }
      );
    }

    const params = await context.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid VIP ID' },
        { status: 400 }
      );
    }

    // Tenant Security Guard
    const tenantId = user.tenant_id;
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
      return NextResponse.json({ error: 'Missing tenant context' }, { status: 403 });
    }

    // Delete VIP
    await deleteVIP(id, tenantId);

    return NextResponse.json(
      { success: true, message: 'VIP deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('VIP deletion error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to delete VIP: ${error.message}` },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to delete VIP: Unknown error' },
        { status: 500 }
      );
    }
  }
}