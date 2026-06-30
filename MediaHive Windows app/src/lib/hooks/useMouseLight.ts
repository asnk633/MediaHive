import { useEffect, useRef } from "react";

export function useMouseLight() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Disables automatically under prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let frameId: number | null = null;
    let activeCard: HTMLElement | null = null;
    let x = 0;
    let y = 0;

    // Debounced coordinate tracking to 16ms for performance (via requestAnimationFrame)
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest(".studio-card-premium, .studio-card") as HTMLElement;

      if (!card) {
        if (activeCard) {
          activeCard.style.removeProperty("--mx");
          activeCard.style.removeProperty("--my");
          activeCard = null;
        }
        return;
      }

      activeCard = card;
      const rect = card.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;

      if (frameId === null) {
        frameId = requestAnimationFrame(() => {
          if (activeCard) {
            activeCard.style.setProperty("--mx", `${x}px`);
            activeCard.style.setProperty("--my", `${y}px`);
          }
          frameId = null;
        });
      }
    };

    const handleMouseLeave = () => {
      if (activeCard) {
        activeCard.style.removeProperty("--mx");
        activeCard.style.removeProperty("--my");
        activeCard = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const cleanup = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (activeCard) {
        activeCard.style.removeProperty("--mx");
        activeCard.style.removeProperty("--my");
      }
    };

    cleanupRef.current = cleanup;

    return cleanup;
  }, []);

  // Returns cleanup function
  return () => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }
  };
}

