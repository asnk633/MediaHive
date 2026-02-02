import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

// Calculate relative time
export function getRelativeTime(timestamp: any) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(timestamp);
}

// Generate 2-letter initials from name (e.g. "Anu Anwar" -> "AA", "Sabith" -> "SA" or "Sa"?? User said "SA for Sabith Amjadi". "The first letters of the first and last name")
// If single name "Sabith" -> "SA"? No, probably "SA" if user meant Sabith Amjadi. But if just "Sabith", maybe "Sa" or "S". 
// User said: "The first letters of the first and last name !"
// If only one name, I will take first 2 chars or just 1 char? User said "Avatar name can be 2 letters".
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';

  if (parts.length === 1) {
    // Single name: Take first 2 letters
    return parts[0].substring(0, 2).toUpperCase();
  }

  // Multiple names: First letter of first name + First letter of last name
  const first = parts[0][0];
  const last = parts[parts.length - 1][0];
  return (first + last).toUpperCase();
}

/**
 * For Capacitor/native environments, replace Next router navigation with HARD navigation
 * to avoid RSC requests on initial boot.
 * 
 * CRITICAL: Native Capacitor environments using static export will trigger unintended
 * _rsc requests when using soft-navigation (router.push/replace) immediately after boot.
 * This helper ensures a full page reload via window.location.href which stabilizes the app.
 */
export function nativeNavigate(path: string, router?: any, source?: string) {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const target = path.endsWith('/') ? path : path + '/';
    console.log('[NAV SOURCE]', source || 'Unknown');
    console.log('[NAV] Native hard-nav to:', target);
    window.location.href = target;
  } else if (router) {
    router.replace(path);
  }
}

/**
 * Helper to race a promise against a timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, name: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[TIMEOUT] ${name} exceeded ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}
