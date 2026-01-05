import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getFirebaseServices, verifyUser } from '@/lib/server-utils';
import { hasRole } from '@/lib/permissions';
import { logEventCreated, logEventUpdated, logEventDeleted } from '@/app/api/_lib/audit';

// --- GET Request Handler ---
export async function GET(request: NextRequest) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single event fetch
    if (id) {
      const eventDoc = await firestore.collection('events').doc(id).get();

      if (!eventDoc.exists) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      const eventData = { id: eventDoc.id, ...eventDoc.data() };
      return NextResponse.json(eventData, { status: 200 });
    }

    // List events with filtering
    let query: FirebaseFirestore.Query = firestore.collection('events');

    // Filter by tenant/institution
    if (user.institutionId) {
      query = query.where('institutionId', '==', user.institutionId);
    }

    // Non-admin users only see approved events
    if (user.role !== 'admin') {
      query = query.where('status', '==', 'approved');
    }

    // Order by date (newest/future first) to ensure we see upcoming events
    query = query.orderBy('date', 'desc');

    const snapshot = await query.limit(500).get();
    const events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(events, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create events
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Title is required and must be a string' }, { status: 400 });
    }

    if (body.description !== undefined && typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Description must be a string' }, { status: 400 });
    }

    if (!body.date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Admin events are auto-approved, others need approval
    const initialStatus = user.role === 'admin' ? 'approved' : 'pending';

    // Determine Creator (Self or On Behalf Of)
    let createdBy = {
      uid: user.uid,
      name: body.createdBy?.name || 'Unknown User',
      role: user.role
    };

    let meta: any = {};

    // Handle "On Behalf Of" for Admin/Team
    if (body.onBehalfOf && (user.role === 'admin' || user.role === 'team')) {
      const { id, name, type } = body.onBehalfOf;
      if (name && (type === 'department' || type === 'institution')) {
        // Synthetic Identity
        createdBy = {
          uid: `${type}_${id}`, // e.g. department_5
          name: name,
          role: type // 'department' or 'institution' as role
        };
        // Audit trail
        meta = {
          originalCreatorUid: user.uid,
          originalCreatorName: user.name || 'Unknown',
          delegatedCreation: true,
          delegatedAt: new Date().toISOString()
        };
      }
    }

    // Prepare event data
    const eventData: any = {
      ...body,
      status: initialStatus,
      createdBy,
      meta: { ...(body.meta || {}), ...meta },
      institutionId: user.institutionId || '1', // Add tenant context with fallback
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Cleanup
    delete eventData.onBehalfOf;

    // Ensure mediaCoverage is an array
    if (eventData.mediaCoverage && !Array.isArray(eventData.mediaCoverage)) {
      eventData.mediaCoverage = [eventData.mediaCoverage];
    } else if (!eventData.mediaCoverage) {
      eventData.mediaCoverage = [];
    }

    const docRef = await firestore.collection('events').add(eventData);

    // Log audit event
    await logEventCreated(
      user.uid,
      user.tenantId || 1,
      docRef.id,
      { title: body.title, status: initialStatus }
    );

    // Return the created event
    const createdEvent = { id: docRef.id, ...eventData };
    return NextResponse.json({ data: createdEvent }, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// --- PUT Request Handler ---
export async function PUT(request: NextRequest) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to edit events
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const body = await request.json();

    // Check if event exists
    const eventDoc = await firestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingEvent = eventDoc.data()!;

    // Only creator or admin can update
    if (existingEvent.createdBy.uid !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prepare updates
    const updates: any = {
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Don't allow changing the createdBy field
    delete updates.createdBy;

    // Update the event
    await firestore.collection('events').doc(id).update(updates);

    // Log audit event
    await logEventUpdated(
      user.uid,
      user.tenantId || 1,
      id,
      { changes: Object.keys(updates) }
    );

    // Return the updated event
    const updatedEvent = { id, ...existingEvent, ...updates };
    return NextResponse.json({ data: updatedEvent }, { status: 200 });
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest) {
  try {
    const { firestore } = await getFirebaseServices();
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete events
    if (user.role !== 'admin' && user.role !== 'team') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if event exists
    const eventDoc = await firestore.collection('events').doc(id).get();
    if (!eventDoc.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const existingEvent = eventDoc.data()!;

    // Only creator or admin can delete
    if (existingEvent.createdBy.uid !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('User authorized to delete event:', id);

    await firestore.collection('events').doc(id).delete();
    console.log('Event deleted from Firestore:', id);

    // Log audit event
    try {
      await logEventDeleted(
        user.uid,
        user.tenantId || 1,
        id
      );
      console.log('Audit log successful for DELETE event:', id);
    } catch (auditError) {
      console.error('Audit logging failed for DELETE event:', auditError);
      // Continue execution even if audit fails
    }

    console.log('DELETE request successful for event:', id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}`, details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}