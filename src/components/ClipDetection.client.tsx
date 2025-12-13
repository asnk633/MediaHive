"use client";
import { useEffect } from "react";

export default function ClipDetection() {
  useEffect(() => {
    const checkAndAdjustClip = () => {
      // Skip if safe area hasn't been initialized yet
      if (!(window as any).__SAFE_AREA_INITIALIZED) {
        return;
      }
      
      const topBar = document.querySelector(".topbar");
      if (!topBar) return;
      const rect = topBar.getBoundingClientRect();
      if (rect.top < -4) {
        // Mark that clip detection has made adjustments
        (window as any).__CLIP_DETECTION_ADJUSTED = true;
        
        const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--computed-safe-top')) || 0;
        const newPad = Math.abs(rect.top) + 4 + cur;
        document.documentElement.style.setProperty('--computed-safe-top', `${newPad}px`);
        document.documentElement.style.setProperty('--safe-area-top', `${newPad}px`);
      }
    };

    // run after mount and again on orientation/resize
    setTimeout(checkAndAdjustClip, 80);
    setTimeout(checkAndAdjustClip, 400);
    window.addEventListener("resize", checkAndAdjustClip);
    window.addEventListener("orientationchange", checkAndAdjustClip);

    return () => {
      window.removeEventListener("resize", checkAndAdjustClip);
      window.removeEventListener("orientationchange", checkAndAdjustClip);
    };
  }, []);

  return null;
}