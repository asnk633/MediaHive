// src/lib/notifications/sendPush.ts
/**
 * sendPush stub: logs payload and returns simulated result.
 * Replace with Expo/FCM/APNs implementation when keys are available.
 */

export async function sendPush(deviceTokens: string[], payload: { title?: string; body?: string; data?: any }) {
  if (!deviceTokens || deviceTokens.length === 0) {
    return { success: 0, simulated: true };
  }

  // If EXPO_SERVER_KEY or FCM is present, one could call the appropriate API.
  // For now we simulate and log.
  console.log("[sendPush_stub] tokens:", deviceTokens, "payload:", payload);

  return {
    success: deviceTokens.length,
    simulated: true,
  };
}
