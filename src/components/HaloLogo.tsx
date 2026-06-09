"use client";

import React from 'react';
import { cn } from "@/lib/utils";

interface HaloLogoProps {
    size?: number;
    className?: string;
}

/**
 * HaloLogo
 * A premium circular logo emblem with an ambient halo glow and breathing animations.
 */
export const HaloLogo = ({ size = 110, className }: HaloLogoProps) => {
    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            {/* Halo Glow */}
            <div className="absolute -inset-8 bg-primary/25 blur-[45px] rounded-full animate-logo-breathing" />
            
            {/* Logo Image with Rotating Animation */}
            <img
                src="/logo-app.png"
                alt="Thaiba Logo"
                className="object-contain brightness-0 invert drop-shadow-[0_0_25px_rgba(99,102,241,0.4)] z-10 animate-logo-rotate"
                style={{ width: size, height: size }}
            />
        </div>
    );
};
