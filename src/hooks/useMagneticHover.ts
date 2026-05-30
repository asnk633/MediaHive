"use client";

import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useMagneticHover — GPU-accelerated magnetic hover physics hook.
 *
 * When the cursor enters a configurable boundary around the element center,
 * the element smoothly translates toward the cursor using spring-eased
 * `transform: translate()` (GPU-composited, no layout thrash).
 *
 * @param boundary  Pixel radius around element center that activates the pull (default: 30)
 * @param strength  Fraction of cursor offset applied as translation (0–1, default: 0.35)
 * @returns         { ref, style } — spread onto the target element
 */
export function useMagneticHover(boundary = 30, strength = 0.35) {
  const ref = useRef<HTMLElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const rafId = useRef<number>(0);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;

      // Cancel previous rAF to coalesce rapid pointer events
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Half-width/height + boundary = full activation zone
        const activationRadius = Math.max(rect.width, rect.height) / 2 + boundary;

        if (distance < activationRadius) {
          setIsActive(true);
          setOffset({
            x: dx * strength,
            y: dy * strength,
          });
        } else if (isActive) {
          // Cursor left the boundary — reset smoothly
          setIsActive(false);
          setOffset({ x: 0, y: 0 });
        }
      });
    },
    [boundary, strength, isActive]
  );

  const handleMouseLeave = useCallback(() => {
    setIsActive(false);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use parent or document to track cursor even when slightly outside element
    const target = el.parentElement || document;
    target.addEventListener("mousemove", handleMouseMove as EventListener);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      target.removeEventListener("mousemove", handleMouseMove as EventListener);
      el.removeEventListener("mouseleave", handleMouseLeave);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [handleMouseMove, handleMouseLeave]);

  const style: React.CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    transition: isActive
      ? "transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)"
      : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)", // Slower spring-back on leave
    willChange: isActive ? "transform" : "auto",
  };

  return { ref, style };
}
