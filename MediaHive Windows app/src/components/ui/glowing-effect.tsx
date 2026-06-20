"use client";

import { motion } from "framer-motion";
import React, { useRef, useState, useEffect } from "react";

interface GlowingEffectProps {
  blur?: number;
  borderWidth?: number;
  spread?: number;
  glow?: boolean;
  disabled?: boolean;
  proximity?: number;
  inactiveZone?: number;
  /** Secondary accent color — defaults to indigo */
  accentSecondary?: string;
}

export const GlowingEffect = ({
  blur = 0,
  borderWidth = 1,
  spread = 20,
  glow = true,
  disabled = false,
  proximity = 64,
  inactiveZone = 0.01,
  accentSecondary = "99,102,241",
}: GlowingEffectProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent || disabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = parent.getBoundingClientRect();
        setPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      });
    };

    const handleMouseEnter = () => setOpacity(1);
    const handleMouseLeave = () => setOpacity(0);

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [disabled]);

  const isActive = glow && opacity > 0;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
    >
      {/* Dual-tint radial glow: teal primary + indigo secondary offset */}
      <div
        className="absolute inset-0 rounded-[inherit] transition-opacity duration-400 z-0 pointer-events-none"
        style={{
          opacity: isActive ? 1 : 0,
          background: [
            `radial-gradient(${spread * 14}px circle at ${position.x}px ${position.y}px, rgba(20,184,166, 0.14), transparent 80%)`,
            `radial-gradient(${spread * 10}px circle at ${position.x + 40}px ${position.y + 40}px, rgba(${accentSecondary}, 0.08), transparent 80%)`,
          ].join(", "),
          transition: "opacity 0.35s ease",
        }}
      />
      {/* Edge-lit gradient border highlight */}
      <div
        className="absolute inset-0 rounded-[inherit] z-0 pointer-events-none"
        style={{
          opacity: isActive ? 1 : 0,
          padding: `${borderWidth}px`,
          background: `radial-gradient(${spread * 7}px circle at ${position.x}px ${position.y}px, rgba(20,184,166, 0.9), rgba(${accentSecondary}, 0.4) 40%, transparent 100%)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          transition: "opacity 0.35s ease",
        }}
      >
        <div className="w-full h-full rounded-[inherit] bg-transparent" />
      </div>
    </div>
  );
};
