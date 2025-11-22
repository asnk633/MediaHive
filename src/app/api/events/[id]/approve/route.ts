import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserFromRequest, isAdmin } from '../../../_lib/auth';

/**
 * POST /api/events/[id]/approve
 * Approve or decline event (admin only)
 * Body: { action: 'approve' | 'decline' }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can approve/decline events
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Only admins can approve or decline events' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const eventId = parseInt(id, 10);

    const [event] = await db.select().from(events).where(eq(events.id, eventId));

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !['approve', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "decline"' },
        { status: 400 }
      );
    }

    const approvalStatus = action === 'approve' ? 'approved' : 'declined';
    const now = new Date().toISOString();

    const updatedEvents = await db
      .update(events)
      .set({
        approvalStatus,
        updatedAt: now,
      })
      .where(eq(events.id, eventId))
      .returning();

    return NextResponse.json({ data: updatedEvents[0] }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/events/[id]/approve]', error);
    return NextResponse.json(
      { error: 'Failed to update event approval status' },
      { status: 500 }
    );
  }
}
