"use client";
import { isTauri } from '@tauri-apps/api/core';

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import DesktopShell from "@/components/DesktopShell";
import { useMouseLight } from "@/lib/hooks/useMouseLight";
import Titlebar from "./Titlebar";
import UpdatePrompt from "./UpdatePrompt";

const NO_SHELL_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
];

/**
 * ShellWrapper — conditionally renders DesktopShell.
 * Auth/public pages (like /login) render their children directly
 * without the sidebar/shell chrome so the login page gets a
 * full-screen canvas to work with.
 */
export default function ShellWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = import("next/navigation").then(m => m.useRouter).catch(() => null); // or just import useRouter at the top
  const hideShell = NO_SHELL_ROUTES.includes(pathname);

  // Mount mouse light listener globally on shell-activated pages
  useMouseLight();

  // Handle Tauri deep-links
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let cancelled = false;
    let retries = 0;

    const checkTauriAndSetup = () => {
      if (cancelled) return;
      if (isTauri()) {
        setupDeepLink();
      } else if (retries < 40) {
        retries++;
        setTimeout(checkTauriAndSetup, 50);
      }
    };
    checkTauriAndSetup();
    
    async function setupDeepLink() {
      try {
        const { onOpenUrl } = await import('@tauri-apps/plugin-deep-link');
        unlisten = await onOpenUrl((urls) => {
          console.log('Deep link received:', urls);
          // E.g. mediahive://chat/123 -> push /chat/123
          for (const url of urls) {
            try {
              const parsed = new URL(url);
              if (parsed.protocol === "mediahive:") {
                // If the host is empty, pathname contains the route.
                // e.g. mediahive://chat/123 -> host="" pathname="//chat/123"
                // or mediahive://host/chat/123
                const route = parsed.pathname.replace(/^\/+/, '/') + parsed.search + parsed.hash;
                // Just redirecting for now
                window.location.href = route;
              }
            } catch (err) {
              console.error("Failed to parse deep link url", url, err);
            }
          }
        });
      } catch (err) {
        console.warn("Failed to set up deep linking:", err);
      }
    }
    return () => {
      cancelled = true;
      if (unlisten) unlisten();
    };
  }, []);

  // Register global shortcut
  useEffect(() => {
    let mounted = true;
    let retries = 0;

    const checkTauriAndSetup = () => {
      if (!mounted) return;
      if (isTauri()) {
        setupShortcut();
      } else if (retries < 40) {
        retries++;
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

  if (hideShell) {
    return (
      <>
        <Titlebar />
        {children}
        <UpdatePrompt />
      </>
    );
  }

  return (
    <>
      <Titlebar />
      <DesktopShell>{children}</DesktopShell>
      <UpdatePrompt />
    </>
  );
}
