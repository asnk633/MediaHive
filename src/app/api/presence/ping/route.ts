// src/app/api/presence/ping/route.ts
// Endpoint to update user presence status

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { presence } from '@/db/schema';
import { authorizeByPermission } from '@/app/api/_lib/rbac';
import { broadcastEvent } from '../../_lib/realtime';

export async function POST(req: NextRequest) {
  try {
    // Authorize user with RBAC - all authenticated users can update their presence
    const user = await authorizeByPermission(req, 'read:tasks');
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update presence in database
    const now = new Date().toISOString();
    await db
      .insert(presence)
      .values({
        userId: user.id,
        lastSeenAt: now,
        online: true
      })
      .onConflictDoUpdate({
        target: [presence.userId],
        set: {
          lastSeenAt: now,
          online: true
        }
      });

    // Broadcast presence update
    broadcastEvent('presence', {
      type: 'update',
      userId: user.id,
      online: true,
      lastSeenAt: now
    });

    // Return success
    return NextResponse.json(
      { 
        success: true, 
        message: 'Presence updated'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/presence/ping]', error);
    return NextResponse.json(
      { error: 'Failed to update presence' },
      { status: 500 }
    );
  }
}