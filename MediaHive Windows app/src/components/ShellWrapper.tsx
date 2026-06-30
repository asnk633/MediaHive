"use client";
import { isTauri } from '@tauri-apps/api/core';
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DesktopShell from "@/components/DesktopShell";
import { logDiagnostic } from "@/lib/diagnostic";
import { useWindow } from "@/contexts/WindowContext";
import Titlebar from "./Titlebar";
import UpdatePrompt from "./UpdatePrompt";

const NO_SHELL_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/auth/error",
  "/auth/callback",
];

export default function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = NO_SHELL_ROUTES.includes(pathname);
  const { isDesktop } = useWindow();
  const router = useRouter();

  // Handle Tauri deep-links
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    const checkTauriAndSetup = () => {
      if (cancelled) return;
      if (isTauri()) {
        setupDeepLink();
      } else if (!cancelled) {
        setTimeout(checkTauriAndSetup, 50);
      }
    };
    checkTauriAndSetup();

    async function setupDeepLink() {
      try {
        logDiagnostic("Tauri app: Initializing deep link listener...", "tauri");
        const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
        const startupTime = Date.now();
        
        const u = await onOpenUrl(async (urls) => {
          if (cancelled) return;
          for (const url of urls) {
            try {
              const parsedUrl = new URL(url);
              if (!isValidDeepLink(parsedUrl)) continue;

              logDiagnostic(`Tauri app: Deep link received URL: ${url}`, "tauri");
              
              if (parsedUrl.protocol === "mediahive:") {
                // If it's within 2 seconds of startup and is an error URL, ignore it
                const isStartup = Date.now() - startupTime < 2000;
                const isErrorRoute = parsedUrl.host === "auth" && parsedUrl.pathname.includes("error");
                const hasErrorQuery = parsedUrl.search.includes("error=");
                
                if (isStartup && (isErrorRoute || hasErrorQuery)) {
                  logDiagnostic(`[DeepLink] Ignoring cached error deep-link received on startup: ${url}`, "tauri");
                  continue;
                }

                // Intercept token-forwarding login deep-links
                const hash = parsedUrl.hash;
                if (parsedUrl.host === "login" && hash) {
                  const hashParams = new URLSearchParams(hash.substring(1));
                  const accessToken = hashParams.get("access_token");
                  const refreshToken = hashParams.get("refresh_token");

                  if (accessToken && refreshToken) {
                    logDiagnostic("[DeepLink] Extracted session tokens from deep link. Setting session in Tauri...", "tauri");
                    const { supabase } = await import("@/lib/supabaseClient");
                    const { error } = await supabase.auth.setSession({
                      access_token: accessToken,
                      refresh_token: refreshToken,
                    });

                    if (error) {
                      logDiagnostic(`[DeepLink] Failed to set session in Supabase: ${error.message}`, "tauri");
                      router.push(`/auth/error?error=${encodeURIComponent(error.message)}`);
                    } else {
                      logDiagnostic("[DeepLink] Session set successfully inside Tauri webview! Loading dashboard...", "tauri");
                      router.push("/");
                    }
                    continue;
                  } else {
                    logDiagnostic("[DeepLink] Warning: login host matched but tokens are missing in hash.", "tauri");
                  }
                }

                const route = parsedUrl.pathname + parsedUrl.search + hash;

                logDiagnostic(`[DeepLink] Routing Tauri app to: ${route}`, "tauri");
                router.push(route);
              } else {
                logDiagnostic(`Tauri app: Ignoring non-mediahive link protocol: ${parsedUrl.protocol}`, "tauri");
              }
            } catch (err: any) {
              logDiagnostic(`Tauri app: Failed to parse deep link url: ${err.message || err}`, "tauri");
              console.error("Failed to parse deep link url", url, err);
            }
          }
        });

        if (cancelled) {
          u();
        } else {
          unlisten = u;
        }
      } catch (err: any) {
        logDiagnostic(`Tauri app: Failed to set up deep linking: ${err.message || err}`, "tauri");
        console.warn("Failed to set up deep linking:", err);
      }
    }

    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, [router]);

  // Register global shortcut
  useEffect(() => {
    let mounted = true;

    const checkTauriAndSetup = () => {
      if (!mounted) return;
      if (isTauri()) {
        setupShortcut();
      } else {
        setTimeout(checkTauriAndSetup, 50);
      }
    };
    checkTauriAndSetup();

    async function setupShortcut() {
      try {
        const { register, isRegistered } = await import('@tauri-apps/plugin-global-shortcut');
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        
        const shortcut = "CmdOrControl+Shift+M";
        const alreadyRegistered = await isRegistered(shortcut);
        if (!alreadyRegistered) {
            await register(shortcut, async (event) => {
              if (event.state === "Pressed") {
                const appWindow = getCurrentWindow();
                await appWindow.unminimize();
                await appWindow.show();
                await appWindow.setFocus();
              }
            });
        }
      } catch (err: any) {
        if (typeof err === "string" && err.includes("already registered")) {
          // React Strict Mode race condition during hot-reload, safe to ignore
        } else {
          console.warn("Failed to register global shortcut:", err);
        }
      }
    }

    return () => {
      mounted = false;
      if (isTauri()) {
        import('@tauri-apps/plugin-global-shortcut').then(m => m.unregisterAll()).catch(console.error);
      }
    };
  }, []);

  function isValidDeepLink(url: URL) {
    const pathParts = url.pathname.split('/').filter(part => part !== '');
    if (pathParts.length > 1 && pathParts[0] === '') pathParts.shift();
    
    if (url.protocol.startsWith('javascript:')) return false;
    if (pathParts.includes('//') || pathParts.includes('/..')) return false;

    url.pathname = '/' + pathParts.join('/');
    return true;
  }

  if (hideShell) {
    return (
      <div className={isDesktop ? "desktop-app w-full h-full relative" : "w-full h-full relative"}>
        <Titlebar />
        {children}
        <UpdatePrompt />
      </div>
    );
  }

  return (
    <div className={isDesktop ? "desktop-app w-full h-full relative" : "w-full h-full relative"}>
      <Titlebar />
      <DesktopShell>{children}</DesktopShell>
      <UpdatePrompt />
    </div>
  );
}
