"use client";

import { useState, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";

/**
 * useIsTauri hook
 * Safely checks if the application is running inside Tauri v2 environment
 * with a retry loop to account for asynchronous injection of Tauri window APIs.
 */
export function useIsTauri(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;

    const checkTauri = () => {
      if (cancelled) return;
      if (isTauri()) {
        setIsDesktop(true);
      } else if (retries < 40) {
        retries++;
        setTimeout(checkTauri, 50);
      }
    };

    checkTauri();

    return () => {
      cancelled = true;
    };
  }, []);

  return isDesktop;
}
