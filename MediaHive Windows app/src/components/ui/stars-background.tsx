"use client";
import React, { useRef, useEffect } from "react";

export const StarsBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver | null = null;
    let stars: { x: number; y: number; radius: number; vx: number; vy: number; alpha: number }[] = [];

    let cssWidth = 0;
    let cssHeight = 0;

    const initStars = () => {
      stars = [];
      const numStars = (cssWidth * cssHeight) / 4000;
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * cssWidth,
          y: Math.random() * cssHeight,
          radius: Math.random() * 1.5,
          vx: Math.floor(Math.random() * 50) - 25,
          vy: Math.floor(Math.random() * 50) - 25,
          alpha: Math.random() * 0.5 + 0.1,
        });
      }
    };

    const resize = (width: number, height: number) => {
      const dpr = window.devicePixelRatio || 1;
      cssWidth = width;
      cssHeight = height;
      // Set the pixel buffer to physical resolution
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      // Set CSS display size so canvas renders at 1:1 visual scale
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // Scale context so all drawing uses CSS pixel coordinates
      ctx.scale(dpr, dpr);
      initStars();
    };

    if (canvas.parentElement) {
      const rect = canvas.parentElement.getBoundingClientRect();
      resize(rect.width, rect.height);

      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width, height } = entry.contentRect;
          resize(width, height);
        }
      });
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        star.x += star.vx / 1000;
        star.y += star.vy / 1000;

        // Boundaries in CSS coordinates
        if (star.x < 0 || star.x > cssWidth) star.vx = -star.vx;
        if (star.y < 0 || star.y > cssHeight) star.vy = -star.vy;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};
