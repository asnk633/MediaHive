import { getSupabaseAdmin } from "@/lib/server-utils";

/**
 * Notification Processor (Supabase-Native)
 * Processes scheduled and pending notifications using direct Supabase queries.
 */

// Check if current time is within quiet hours for a user
async function isWithinQuietHours(userId: string): Promise<boolean> {
  // Logic placeholder for user-specific quiet hours settings in Supabase
  return false;
}

// Check if notification should be delivered based on user settings
async function shouldDeliverNotification(userId: string, category: string): Promise<boolean> {
  // Logic placeholder for user-specific notification category settings in Supabase
  return true;
}

// Process scheduled notifications
export async function processScheduledNotifications() {
  console.log('[NOTIFICATION_PROCESSOR] Scanning for pending notifications...');
  const supabase = getSupabaseAdmin();

  try {
    const now = new Date().toISOString();
    
    // 1. Fetch pending notifications that are due
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .is('read_at', null)
      .lte('created_at', now);

    if (fetchError) throw fetchError;
    if (!pendingNotifications || pendingNotifications.length === 0) return;

    for (const notification of pendingNotifications) {
      // 2. Check TTL (Time To Live)
      if (notification.ttl) {
        const createdTime = new Date(notification.created_at).getTime();
        const expiresAt = createdTime + (notification.ttl * 1000);
        
        if (expiresAt < Date.now()) {
          // Expired: Mark as read/archived silently
          await supabase
            .from('notifications')
            .update({ 
                read_at: new Date().toISOString(),
                updated_at: new Date().toISOString() 
            })
            .eq('id', notification.id);
          continue;
        }
      }

      // 3. User Preferences Checks
      const quietHoursActive = await isWithinQuietHours(notification.user_id);
      if (quietHoursActive) continue;

      const shouldDeliver = await shouldDeliverNotification(notification.user_id, notification.category || 'general');
      if (!shouldDeliver) continue;

      // 4. Dispatch Notification
      await sendNotification(notification);
    }

    console.log(`[NOTIFICATION_PROCESSOR] Processed ${pendingNotifications.length} items.`);
  } catch (error) {
    console.error('[NOTIFICATION_PROCESSOR_ERROR]', error);
  }
}

// Send notification through active channels
async function sendNotification(notification: any) {
  const supabase = getSupabaseAdmin();
  
  // Get user profile for destination (email/push token)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', notification.user_id)
    .single();

  if (error || !profile) {
    console.error(`[NOTIFICATION_DISPATCH] User profile not found: ${notification.user_id}`);
    return;
  }

  console.log(`[NOTIFICATION_DISPATCH] Sending '${notification.title}' to ${profile.email}`);

  // Dispatch logic (FCM, SendGrid, etc.) would go here.
}

// Initialize the background processor
export function startNotificationProcessor() {
  console.log('[NOTIFICATION_PROCESSOR] Starting background service...');

  // Process every 60 seconds
  setInterval(async () => {
    await processScheduledNotifications();
  }, 60 * 1000);

  // Initial run
  processScheduledNotifications();
}
