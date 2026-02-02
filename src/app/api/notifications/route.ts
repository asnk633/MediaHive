import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
// import { requireAdminWithVerifiedEmail } from '@/lib/emailVerificationGuard'; // causing build issues
import { verifyUser } from '@/lib/server-utils';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify the user is authenticated and has access to their own notifications
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    // Securely override userId with the authenticated user's ID
    const userId = user.uid;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const db = adminDb;

    // Fetch user's notifications from Firestore
    const notificationsSnapshot = await db
      .collection('notifications')
      .where('userId', '==', userId)
      .where('isArchived', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const notifications = notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const path = url.pathname;

    // Check if user is authenticated and has admin privileges for certain operations
    if (path.includes('/unread')) {
      // For unread count, just require authentication
      const user = await verifyUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      // For other operations, require admin access (Inlined check)
      const user = await verifyUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (user.role !== 'admin' && !user.isAdmin) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const db = adminDb;

    // Handle unread count request
    if (path.includes('/unread')) {
      // Authentication already verified above
      const user = await verifyUser(request);
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Securely use the authenticated user's ID
      const userId = user.uid;

      const unreadSnapshot = await db
        .collection('notifications')
        .where('userId', '==', userId)
        .where('isArchived', '==', false)
        .where('isRead', '==', false)
        .get();

      return NextResponse.json({ unreadCount: unreadSnapshot.size });
    }

    return NextResponse.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in POST request:', error);
    return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await verifyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const db = adminDb;
    const notifRef = db.collection('notifications').doc(notificationId);
    const notifDoc = await notifRef.get();

    if (!notifDoc.exists) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notifDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the notification in Firestore
    await notifRef.update({
      isRead: true,
      readAt: new Date()
    });

    return NextResponse.json({ message: 'Notification updated successfully' });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}
