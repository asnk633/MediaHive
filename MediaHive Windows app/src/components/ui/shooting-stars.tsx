"use client";
import React, { useEffect, useRef } from "react";

export const ShootingStars = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    class ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      delay: number;
      active: boolean;

      constructor() {
        this.x = 0;
        this.y = 0;
        this.length = 0;
        this.speed = 0;
        this.angle = 0;
        this.opacity = 0;
        this.delay = Math.random() * 2000;
        this.active = false;
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas!.width * 1.5;
        this.y = -Math.random() * canvas!.height;
        this.length = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 5;
        this.angle = Math.PI / 4; // 45 degrees
        this.opacity = Math.random() * 0.5 + 0.5;
        this.active = false;
      }

      update() {
        if (!this.active) {
          this.delay -= 16; // approx ms per frame
          if (this.delay <= 0) {
            this.active = true;
          }
          return;
        }

        this.x -= this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
        
        if (this.x < -this.length || this.y > canvas!.height + this.length) {
          this.reset();
          this.delay = Math.random() * 5000 + 1000; // wait 1-6s before next
        }
      }

      draw() {
        if (!this.active) return;
        if (!ctx) return;
        
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
          this.x + this.length * Math.cos(this.angle),
          this.y - this.length * Math.sin(this.angle)
        );
        
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x + this.length * Math.cos(this.angle),
          this.y - this.length * Math.sin(this.angle)
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    let shootingStars = Array.from({ length: 3 }, () => new ShootingStar());

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      shootingStars.forEach(star => {
        star.update();
        star.draw();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
      style={{ zIndex: 1 }}
    />
  );
};
