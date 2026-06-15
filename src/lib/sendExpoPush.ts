// src/lib/sendExpoPush.ts
// Expo Push Notification dispatcher supporting production API send and simulation stub mode

export interface ExpoPushPayload {
  to: string | string[];
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
  ttl?: number;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
}

/**
 * Dispatches an Expo Push Notification.
 * Runs in stub mode (console logging only) unless process.env.EXPO_ACCESS_TOKEN is configured.
 */
export async function sendExpoPush(
  token: string | string[],
  title: string,
  body: string,
  options: Omit<ExpoPushPayload, 'to' | 'title' | 'body'> = {}
) {
  const expoAccessToken = process.env.EXPO_ACCESS_TOKEN;

  const payload: ExpoPushPayload = {
    to: token,
    sound: options.sound !== undefined ? options.sound : 'default',
    title,
    body,
    data: options.data,
    ttl: options.ttl,
    priority: options.priority || 'default',
    badge: options.badge,
    channelId: options.channelId,
  };

  if (!expoAccessToken) {
    console.log('\n=========================================');
    console.log('[EXPO PUSH STUB] Simulating Push Send');
    console.log(`[EXPO PUSH STUB] To Token(s): ${JSON.stringify(token)}`);
    console.log(`[EXPO PUSH STUB] Title: "${title}"`);
    console.log(`[EXPO PUSH STUB] Body: "${body}"`);
    console.log('[EXPO PUSH STUB] Payload:', JSON.stringify(payload, null, 2));
    console.log('=========================================\n');
    return { success: true, status: 'simulated', payload };
  }

  try {
    console.log(`[Expo Push] Sending production API request to: ${JSON.stringify(token)}`);
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expoAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('[Expo Push] API Response:', JSON.stringify(data, null, 2));
    return { success: true, status: 'sent', data };
  } catch (error: any) {
    console.error('[Expo Push] Failed to send push notification:', error.message || error);
    return { success: false, error: error.message || error };
  }
}
