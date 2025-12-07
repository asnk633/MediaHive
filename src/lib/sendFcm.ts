// src/lib/sendFcm.ts
import { getFirebaseAdminApp } from './firebaseAdmin';

export async function sendFcm(toToken: string, payload: { title: string; body?: string; data?: any }) {
  // Get the initialized Firebase app
  const app = getFirebaseAdminApp();
  
  const message: any = {
    token: toToken,
    notification: { title: payload.title, body: payload.body || '' },
  };
  
  if (payload.data) {
    message.data = Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]));
  }
  
  // Get the messaging service from the app
  const messaging = (await import('firebase-admin/messaging')).getMessaging(app);
  return messaging.send(message);
}