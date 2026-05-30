// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse incoming JSON body
    const body = await req.json();
    
    let user_id, type, title, content, priority, payload, silent, collapse_key, extraParams;
    let dbNotification = null;
    let isWebhook = false;

    // Check if the request is a Supabase Database Webhook from 'notifications' table
    if (body.table === "notifications" && body.record) {
      isWebhook = true;
      const record = body.record;
      user_id = record.user_id;
      type = record.type;
      title = record.title;
      content = record.body; // Map table column 'body' to 'content'
      priority = record.priority ?? "default";
      payload = record.payload ?? {};
      silent = record.silent ?? false;
      collapse_key = record.collapse_key ?? null;
      dbNotification = record;
    } else {
      ({
        user_id,
        type,
        title,
        body: content,
        priority = "default",
        payload = {},
        silent = false,
        collapse_key = null,
        ...extraParams
      } = body);
    }

    if (!user_id) {
      return new Response(JSON.stringify({ error: "Missing user_id parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Insert notification record in Postgres notifications table (only if NOT invoked via database webhook)
    if (!isWebhook) {
      const { data: insertedNotification, error: dbError } = await supabase
        .from("notifications")
        .insert({
          user_id,
          type,
          title,
          body: content,
          priority,
          payload,
          silent,
          collapse_key,
          read: false,
          ...extraParams
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }
      
      // Return early for direct invokes to let the DB trigger asynchronously handle FCM dispatching.
      // This prevents duplicate push notification delivery and speeds up requests.
      return new Response(
        JSON.stringify({
          success: true,
          notification: insertedNotification,
          push_delivery: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // 2. Query FCM device registration tokens for the target profile
    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("token, platform")
      .eq("user_id", user_id);

    if (tokenError) {
      throw new Error(`Failed to fetch device tokens: ${tokenError.message}`);
    }

    const results = [];
    
    // 3. Dispatch Push Notification via FCM if not silent and tokens exist
    if (!silent && tokens && tokens.length > 0) {
      let fcmKeyBase64 = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
      
      try {
        const { data: configData, error: configError } = await supabase
          .from("system_config")
          .select("value")
          .eq("key", "firebase_service_account")
          .single();
          
        if (!configError && configData?.value) {
          fcmKeyBase64 = configData.value;
          console.log("[FCM] Successfully loaded Firebase Service Account from database system_config.");
        }
      } catch (configFetchError) {
        console.warn("[FCM] Could not load credentials from system_config database table:", configFetchError.message);
      }
      
      if (!fcmKeyBase64) {
        console.warn("[FCM] FIREBASE_SERVICE_ACCOUNT secret is missing. Simulating push alerts.");
        results.push({
          status: "simulated",
          message: `FCM key credentials missing. Successfully simulated push to ${tokens.length} devices.`,
          tokens: tokens.map(t => t.token)
        });
      } else {
        try {
          // Parse secret key (handles raw JSON or Base64 encoded string)
          const serviceAccount = JSON.parse(
            fcmKeyBase64.trim().startsWith("{") ? fcmKeyBase64 : atob(fcmKeyBase64.trim())
          );
          
          // Generate Google OAuth 2.0 accessToken via JWT bearer flow
          const accessToken = await getAccessToken(serviceAccount);

          for (const device of tokens) {
            const response = await sendFcmPush(
              serviceAccount.project_id,
              accessToken,
              device.token,
              device.platform,
              title,
              content,
              type,
              payload
            );
            results.push({
              token: device.token,
              status: response.status === 200 ? "success" : "failed",
              response: response.status === 200 ? "Message sent" : await response.text()
            });
          }
        } catch (fcmError) {
          console.error("[FCM] Push dispatch pipeline failed:", fcmError);
          results.push({
            status: "error",
            error: fcmError.message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification: dbNotification,
        push_delivery: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("[Edge Function] Request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

// Utility to sign Google JWT assertion using RSASSA-PKCS1-v1_5
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = b64({ alg: "RS256", typ: "JWT" });
  
  const now = Math.floor(Date.now() / 1000);
  const jwtClaim = b64({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  });

  const payload = `${jwtHeader}.${jwtClaim}`;
  const signature = await signRS256(payload, serviceAccount.private_key);
  const jwt = `${payload}.${signature}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`Google OAuth failure: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Utility to send standard Google FCM push notification
async function sendFcmPush(
  projectId: string,
  accessToken: string,
  token: string,
  platform: string,
  title: string,
  body: string,
  type: string,
  payload: any
): Promise<Response> {
  const message: any = {
    token,
    notification: {
      title,
      body
    },
    data: {
      type,
      route: typeof payload === "string" ? payload : (payload.route ?? ""),
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    }
  };

  // Bind raw platform channel sound configs
  if (platform === "android") {
    message.android = {
      priority: "high",
      notification: {
        sound: getSoundName(type),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        channel_id: getChannelId(type)
      }
    };
  } else if (platform === "ios") {
    message.apns = {
      payload: {
        aps: {
          sound: `${getSoundName(type)}.wav`,
          badge: 1
        }
      }
    };
  }

  return fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });
}

function getSoundName(type: string): string {
  switch (type) {
    case "task": return "task_added";
    case "event": return "event_alert";
    case "asset": return "success";
    case "system": return "warning";
    default: return "default";
  }
}

function getChannelId(type: string): string {
  switch (type) {
    case "task": return "mediahive_tasks_v2";
    case "event": return "mediahive_events_v2";
    case "asset": return "mediahive_assets_v2";
    case "system": return "mediahive_system_v2";
    default: return "mediahive_system_v2";
  }
}

function b64(obj: any): string {
  const str = JSON.stringify(obj);
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function signRS256(payload: string, privateKeyPem: string): Promise<string> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = privateKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signatureBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(payload)
  );

  const signatureBuffer = new Uint8Array(signatureBytes);
  let signatureString = "";
  for (let i = 0; i < signatureBuffer.byteLength; i++) {
    signatureString += String.fromCharCode(signatureBuffer[i]);
  }

  return btoa(signatureString)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
