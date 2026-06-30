"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2 } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const isTauri = searchParams.get("source") === "tauri";
    const code = searchParams.get("code");

    const handleCallback = async () => {
      console.log(`Browser Callback: Loaded. code=${code ? "present" : "absent"}, isTauri=${isTauri}, searchParams=${searchParams.toString()}`);
      if (code) {
        try {
          console.log("[Callback] Exchanging PKCE code for session in browser...");
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          if (data?.session) {
            const session = data.session;
            console.log("[Callback] Session established in browser successfully.");
            if (isTauri) {
              const tauriUrl = `mediahive://login#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`;
              console.log(`[Callback] Forwarding session tokens to Tauri via deep link: ${tauriUrl}`);
              setStatus("success");
              window.location.href = tauriUrl;
              console.log("[Callback] window.location.href redirect called.");
            } else {
              console.log("[Callback] Non-Tauri flow. Redirecting browser to home page.");
              router.replace("/");
            }
            return;
          } else {
            console.log("[Callback] Warning: code exchange finished but no session returned.");
          }
        } catch (err: any) {
          console.error(`[Callback] Code exchange error: ${err.message || err}`);
          setStatus("error");
          router.replace(`/auth/error?error=${encodeURIComponent(err.message || "exchange_failed")}`);
          return;
        }
      }

      // Fallback: poll for session if no code is present but source is tauri (e.g. implicit flow fallback)
      if (isTauri) {
        console.log("[Callback] No code parameter found. Polling for session as fallback...");
        let session = null;
        for (let i = 0; i < 20; i++) {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            session = data.session;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (session) {
          const tauriUrl = `mediahive://login#access_token=${session.access_token}&refresh_token=${session.refresh_token}&expires_in=${session.expires_in}&token_type=bearer`;
          console.log(`[Callback] Fallback session found. Redirecting browser to: ${tauriUrl}`);
          setStatus("success");
          window.location.href = tauriUrl;
        } else {
          console.log("[Callback] Fallback session polling failed.");
          setStatus("error");
          router.replace("/auth/error?error=session_failed");
        }
      } else {
        console.log("[Callback] Non-Tauri callback with no code. Redirecting browser to home page.");
        router.replace("/");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#030305] text-white p-6">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">Authentication Complete</h2>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              You have been successfully signed in. You can now safely close this browser tab and return to the MediaHive desktop application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#030305] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        <p className="text-sm text-zinc-400 font-medium">Completing authentication, redirecting to application...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#030305] text-white">
          <p className="text-sm text-zinc-400">Loading auth context...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
