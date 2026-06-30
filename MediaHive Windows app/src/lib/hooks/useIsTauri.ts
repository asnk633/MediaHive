"use client";

import { useState, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useWindow } from "@/contexts/WindowContext";

/**
 * useIsTauri hook
 * Safely checks if the application is running inside Tauri v2 environment.
 * Consumes the centralized WindowContext first, with a fallback local retry loop.
 */
export function useIsTauri(): boolean {
  // Try to use the centralized WindowContext first for synchronized state
  try {
    const context = useWindow();
    if (context) {
      return context.isDesktop;
    }
  } catch (e) {
    // Fallback if context is not available yet
  }

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    const check = () => {
      if (cancelled) return;
      const detected = isTauri() || (typeof window !== 'undefined' && (!!(window as any).__TAURI_INTERNALS__ || !!(window as any).__TAURI__ || !!(window as any).isTauri));
      if (detected) {
        setIsDesktop(true);
      } else if (retries < 40) {
        retries++;
        setTimeout(check, 50);
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, []);

  return isDesktop;
}

