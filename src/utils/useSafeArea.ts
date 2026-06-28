'use client';

import { useSyncExternalStore } from 'react';

let currentSafeArea = { top: 0, bottom: 0 };
const subscribers = new Set<() => void>();
let isListenerActive = false;
let rafId: number | null = null;

function setStylePropertyIfChanged(name: string, value: string) {
  try {
    const root = document.documentElement;
    const current = root.style.getPropertyValue(name);
    if (current !== value) {
      root.style.setProperty(name, value);
    }
  } catch (e) {
    console.warn(`Failed to set CSS property ${name}:`, e);
  }
}

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

function updateSafeAreaGlobal() {
  if (rafId !== null) return;

  rafId = safeRequestAnimationFrame(() => {
    rafId = null;
    try {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      const top = parseFloat(computedStyle.getPropertyValue('--safe-area-top')) || 0;
      const bottom = parseFloat(computedStyle.getPropertyValue('--safe-area-bottom')) || 0;
      
      setStylePropertyIfChanged('--safe-area-top', `${top}px`);
      setStylePropertyIfChanged('--safe-area-bottom', `${bottom}px`);
      
      if (top !== currentSafeArea.top || bottom !== currentSafeArea.bottom) {
        currentSafeArea = { top, bottom };
        subscribers.forEach(sub => sub());
      }
    } catch (e) {
      console.error('Error updating safe area:', e);
    }
  });
}

function startGlobalListener() {
  if (isListenerActive || typeof window === 'undefined') return;
  updateSafeAreaGlobal();
  window.addEventListener('resize', updateSafeAreaGlobal);
  window.addEventListener('orientationchange', updateSafeAreaGlobal);
  isListenerActive = true;
}

function stopGlobalListener() {
  if (!isListenerActive || typeof window === 'undefined') return;
  window.removeEventListener('resize', updateSafeAreaGlobal);
  window.removeEventListener('orientationchange', updateSafeAreaGlobal);
  if (rafId !== null) {
    safeCancelAnimationFrame(rafId);
    rafId = null;
  }
  isListenerActive = false;
}

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (subscribers.size === 1) {
    startGlobalListener();
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      stopGlobalListener();
    }
  };
}

function getSnapshot() {
  return currentSafeArea;
}

function getServerSnapshot() {
  return { top: 0, bottom: 0 };
}

/**
 * Hook to get safe area insets for mobile devices
 * Uses useSyncExternalStore for React 18 concurrent safety and zero layout thrashing
 */
export function useSafeArea() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Hook to get safe top offset
 */
export function useSafeTopOffset() {
  return useSafeArea().top;
}

/**
 * Hook to get safe bottom offset
 */
export function useSafeBottomOffset() {
  return useSafeArea().bottom;
}
