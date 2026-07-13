"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";

interface WindowContextProps {
  isMaximized: boolean;
  isDesktop: boolean;
}

export const WindowContext = createContext<WindowContextProps | undefined>(undefined);

export function WindowProvider({ children }: { children: React.ReactNode }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const detected = typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__ || !!(window as any).isTauri);
    if (detected) {
      setIsDesktop(true);
      document.documentElement.classList.add("desktop-app");
    }
  }, []);

  // Manage window-resizing class on document root to disable layout transitions during resize/maximization
  useEffect(() => {
    if (typeof window === "undefined") return;

    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      document.documentElement.classList.add("window-resizing");

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.documentElement.classList.remove("window-resizing");
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    let unlistenFn: (() => void) | null = null;
    let unlistenMaximized: (() => void) | null = null;
    let unlistenUnmaximized: (() => void) | null = null;

    const checkTauri = () => {
      if (cancelled) return;
      const detected = isTauri() || (typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__ || !!(window as any).isTauri));
      if (detected) {
        setIsDesktop(true);
        import("@tauri-apps/api/window").then((windowModule) => {
          const appWindow = windowModule.getCurrentWindow();
          
          appWindow.isMaximized().then((max) => {
            if (!cancelled) setIsMaximized(max);
          });

          // Listen to native maximize/unmaximize events for instant responses
          appWindow.listen("tauri://maximized", () => {
            if (!cancelled) setIsMaximized(true);
          }).then((u) => {
            if (cancelled) u();
            else unlistenMaximized = u;
          });

          appWindow.listen("tauri://unmaximized", () => {
            if (!cancelled) setIsMaximized(false);
          }).then((u) => {
            if (cancelled) u();
            else unlistenUnmaximized = u;
          });
        }).catch(console.error);
      } else if (retries < 40) {
        retries++;
        setTimeout(checkTauri, 50);
      }
    };

    checkTauri();

    return () => {
      cancelled = true;
      if (unlistenFn) (unlistenFn as any)();
      if (unlistenMaximized) (unlistenMaximized as any)();
      if (unlistenUnmaximized) (unlistenUnmaximized as any)();
    };
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isMaximized) {
        document.documentElement.classList.add("window-maximized");
      } else {
        document.documentElement.classList.remove("window-maximized");
      }
    }
  }, [isMaximized]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isDesktop) {
        document.documentElement.classList.add("desktop-app");
      } else {
        document.documentElement.classList.remove("desktop-app");
      }
    }
  }, [isDesktop]);

  return (
    <WindowContext.Provider value={{ isMaximized, isDesktop }}>
      {children}
    </WindowContext.Provider>
  );
}

export const useWindow = () => {
  const context = useContext(WindowContext);
  if (context === undefined) {
    throw new Error("useWindow must be used within a WindowProvider");
  }
  return context;
};
