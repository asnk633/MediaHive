// src/lib/sendFcm.ts
import admin from './firebaseAdmin';

export async function sendFcm(toToken: string, payload: { title: string; body?: string; data?: any }) {
  const message: any = {
    token: toToken,
    notification: { title: payload.title, body: payload.body || '' },
  };
  if (payload.data) {
    message.data = Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]));
  }
  return admin.messaging().send(message);
}