"use client";
import { useEffect } from "react";

function safeRequestAnimationFrame(callback: () => void): number {
  if (typeof document !== 'undefined' && document.hidden) {
    return window.setTimeout(callback, 16) as any;
  }
  return window.requestAnimationFrame(callback);
}

function safeCancelAnimationFrame(id: number) {
  if (typeof document !== 'undefined' && document.hidden) {
    window.clearTimeout(id);
    return;
  }
  window.cancelAnimationFrame(id);
}

export default function ClipDetection() {
  useEffect(() => {
    let rafId: number | null = null;

    const checkAndAdjustClip = () => {
      console.log('[ClipDetection] checkAndAdjustClip called, setting __CLIP_DETECTION_ADJUSTED to false');
      // Mark clip detection as pending/in-progress synchronously
      (window as any).__CLIP_DETECTION_ADJUSTED = false;

      if (rafId !== null) {
        safeCancelAnimationFrame(rafId);
      }

      rafId = safeRequestAnimationFrame(() => {
        console.log('[ClipDetection] safeRequestAnimationFrame callback firing');
        rafId = null;
        try {
          if (!(window as any).__SAFE_AREA_INITIALIZED) {
            console.log('[ClipDetection] Safe area not initialized, returning early');
            return;
          }

          const topBar = document.querySelector(".topbar");
          if (!topBar) {
            console.log('[ClipDetection] Topbar not found, setting __CLIP_DETECTION_ADJUSTED to true');
            (window as any).__CLIP_DETECTION_ADJUSTED = true;
            return;
          }

          const rect = topBar.getBoundingClientRect();
          console.log(`[ClipDetection] rect.top = ${rect.top}`);
          if (rect.top < -4) {
            const root = document.documentElement;
            const cur = parseFloat(getComputedStyle(root).getPropertyValue('--computed-safe-top')) || 0;
            
            // Limit maximum safe-top adjustment to 80px to prevent infinite runaway loops
            if (cur < 80) {
              const adjustment = Math.abs(rect.top) + 4;
              const newPad = Math.min(cur + adjustment, 80);
              const newPadStr = `${newPad}px`;
              
              const currentComputedSafeTop = root.style.getPropertyValue('--computed-safe-top');
              const currentSafeAreaTop = root.style.getPropertyValue('--safe-area-top');
              
              console.log(`[ClipDetection] Adjusting safe area top to ${newPadStr}`);
              if (currentComputedSafeTop !== newPadStr) {
                root.style.setProperty('--computed-safe-top', newPadStr);
              }
              if (currentSafeAreaTop !== newPadStr) {
                root.style.setProperty('--safe-area-top', newPadStr);
              }
            }
          }
          
          console.log('[ClipDetection] Evaluation finished, setting __CLIP_DETECTION_ADJUSTED to true');
          (window as any).__CLIP_DETECTION_ADJUSTED = true;
        } catch (e) {
          console.error("Error in clip detection:", e);
          (window as any).__CLIP_DETECTION_ADJUSTED = true;
        }
      });
    };

    const timer1 = setTimeout(checkAndAdjustClip, 80);
    const timer2 = setTimeout(checkAndAdjustClip, 400);

    window.addEventListener("resize", checkAndAdjustClip);
    window.addEventListener("orientationchange", checkAndAdjustClip);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener("resize", checkAndAdjustClip);
      window.removeEventListener("orientationchange", checkAndAdjustClip);
      if (rafId !== null) {
        safeCancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
