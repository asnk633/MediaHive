import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/verifyUser';
import { sendToConnection } from '../../_lib/realtime';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await verifyUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json();
    const { userId, type, notification } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing recipient userId' }, { status: 400 });
    }

    const connectionKey = `notification-${userId}`;

    // 3. Send event to the specific recipient connection
    sendToConnection(connectionKey, 'notification', {
      type: type || 'new',
      notification
    });

    // 4. Send Expo Push if user has a registered token and notification contains content
    if (notification && (type === 'new' || !type)) {
      try {
        const { getSupabaseAdmin } = await import('@/lib/server/supabase-admin');
        const { sendExpoPush } = await import('@/lib/sendExpoPush');

        const supabaseAdmin = getSupabaseAdmin();
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('expo_push_token')
          .eq('id', userId)
          .single();

        if (profile?.expo_push_token) {
          await sendExpoPush(
            profile.expo_push_token,
            notification.title || 'MediaHive',
            notification.body || notification.message || ''
          );
        }
      } catch (pushError) {
        console.error('[POST /api/notification/broadcast] Failed to send Expo push:', pushError);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[POST /api/notification/broadcast]', error);
    return NextResponse.json({ error: 'Failed to broadcast event' }, { status: 500 });
  }
}
