"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * AmbientCursorLight
 * 
 * A subtle background glow that follows the cursor across the application.
 * Designed to enhance perceived depth and polish without being distracting.
 */
export const AmbientCursorLight: React.FC = () => {
  const lightRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 768 || !lightRef.current) return;
      
      const light = lightRef.current;
      // Using GPU-friendly transforms for better performance
      light.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      // Ensure visibility after first move
      if (light.style.opacity === "0") {
        light.style.opacity = isModalOpen ? "0.05" : "1";
      }
    };

    // Observer to detect when modals are open (common Radix/Next.js pattern)
    // Most UI libraries add a class or style to the body to prevent scroll
    const observer = new MutationObserver(() => {
      const hasModal = document.body.style.overflow === 'hidden' || 
                       document.body.classList.contains('modal-open') ||
                       !!document.querySelector('[data-radix-portal]');
      setIsModalOpen(hasModal);
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: false });
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, [isModalOpen]);

  // Prevent SSR mismatch
  if (!mounted) return null;

  return (
    <div
      ref={lightRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "700px",
        height: "700px",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 5, // Above background, below UI
        opacity: 0, // Hidden until first movement
        transition: "transform 0.15s ease-out, opacity 0.3s ease-in-out",
        background: `radial-gradient(
          circle,
          rgba(99, 102, 241, ${isModalOpen ? "0.05" : "0.10"}) 0%,
          rgba(99, 102, 241, ${isModalOpen ? "0.03" : "0.06"}) 30%,
          transparent 65%
        )`,
        filter: "blur(80px)",
        willChange: "transform",
      }}
      aria-hidden="true"
    />
  );
};
