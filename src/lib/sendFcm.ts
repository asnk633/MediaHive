// src/lib/sendFcm.ts
import { adminMessaging } from './firebaseAdmin'; // your admin bootstrap
export async function sendFcm(toToken: string, payload: { title: string; body?: string; data?: any }) {
  const message = {
    token: toToken,
    notification: {
      title: payload.title,
      body: payload.body || '',
    },
    data: payload.data ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)])) : undefined
  };
  return adminMessaging.send(message);
}