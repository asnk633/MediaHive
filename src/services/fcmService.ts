import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { supabase } from "@/lib/supabaseClient";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Safely initialize Firebase App in Web Browser environments
const app = typeof window !== "undefined" && getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Initializes Firebase Cloud Messaging for Web/PWA clients.
 * Requests notification permissions, generates the registration token, and upserts it in public.device_tokens.
 * 
 * @param userId - Unique ID of the authenticated user's profile
 */
export const initFcm = async (userId: string): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  // 1. Verify browser support for Service Workers and Push notifications
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("[FCM] Push notifications are not supported by this browser.");
    return null;
  }

  try {
    // 2. Request explicit notification permissions from the user
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Notification permission was denied by the user.");
      return null;
    }

    const messaging = getMessaging(app);

    // 3. Register the background push Service Worker with dynamic initialization params
    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || "",
      authDomain: firebaseConfig.authDomain || "",
      projectId: firebaseConfig.projectId || "",
      storageBucket: firebaseConfig.storageBucket || "",
      messagingSenderId: firebaseConfig.messagingSenderId || "",
      appId: firebaseConfig.appId || "",
    });

    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: "/firebase-cloud-messaging-push-scope"
    });

    // Wait until the service worker is active to prevent 'PushManager: no active Service Worker' errors
    await navigator.serviceWorker.ready;

    console.log("[FCM] Dynamic background messaging Service Worker registered successfully and ready.");

    // 4. Retrieve the Web registration token
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
    });

    if (token) {
      console.log("[FCM] Web FCM registration token generated:", token);

      // 5. Upsert registration token in public.device_tokens linked to profile ID
      const { error } = await supabase
        .from("device_tokens")
        .upsert({
          user_id: userId,
          token: token,
          platform: "web",
        }, {
          onConflict: "token"
        });

      if (error) {
        console.error("[FCM] Failed to store web device token in Supabase:", error.message);
      } else {
        console.log("[FCM] Web device token stored in database successfully!");
      }

      // 6. Register foreground push listener
      onMessage(messaging, (payload) => {
        console.log("[FCM] Foreground push notification received:", payload);
        
        if (payload.notification) {
          const { title, body } = payload.notification;
          new Notification(title || "MediaHive", {
            body: body || "",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            tag: payload.collapseKey || undefined,
            data: payload.data
          });
        }
      });

      return token;
    } else {
      console.warn("[FCM] No registration token returned by Firebase.");
      return null;
    }
  } catch (err: any) {
    console.error("[FCM] Failed to initialize Web push notification pipeline:", err);
    return null;
  }
};
