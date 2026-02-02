import { NextRequest, NextResponse } from "next/server";
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { EventTaskService } from '@/lib/event-task.server';
import { logEventUpdated, logEventDeleted } from '@/app/api/_lib/audit';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { firestore } = await getFirebaseServices();

    // Check auth implicitly via verifyUser if needed, but GET usually public or semi-public?
    // Following pattern from route.ts GET:
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const eventDoc = await firestore.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const eventData = { id: eventDoc.id, ...eventDoc.data() };
    return NextResponse.json(eventData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const eventDoc = await firestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingEvent = eventDoc.data()!;

    if (existingEvent.createdBy.uid !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: any = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    delete updates.createdBy;

    if (body.onBehalfOf) {
      updates.onBehalfOf = body.onBehalfOf;
    }

    if (updates.mediaCoverage && !Array.isArray(updates.mediaCoverage)) {
      updates.mediaCoverage = [updates.mediaCoverage];
    }

    await firestore.collection('events').doc(id).update(updates);

    const fullEventState = { ...existingEvent, ...updates };

    if (fullEventState.mediaCoverage) {
      // Always sync if mediaCoverage is defined (even if empty, to handle cancellation)
      await EventTaskService.syncTaskForEvent(id, fullEventState, updates);
    }

    await logEventUpdated(
      user.uid,
      user.tenantId || 1,
      id,
      { changes: Object.keys(updates) }
    );

    const updatedEvent = { id, ...existingEvent, ...updates };
    return NextResponse.json({ data: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const eventDoc = await firestore.collection('events').doc(id).get();

    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingEvent = eventDoc.data()!;

    if (existingEvent.createdBy.uid !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await firestore.collection('events').doc(id).delete();

    // Log audit event
    try {
      await logEventDeleted(
        user.uid,
        user.tenantId || 1,
        id
      );
    } catch (auditError) {
      console.error('Audit logging failed for DELETE event:', auditError);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
