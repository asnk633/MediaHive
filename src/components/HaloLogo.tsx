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
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size * 2, height: size * 2 }}>
            {/* Halo Glow */}
            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-logo-breathing" />
            
            {/* Circular Glass Container */}
            <div 
                className="absolute flex items-center justify-center bg-foreground/5 backdrop-blur-md border border-foreground/10 rounded-full shadow-2xl" 
                style={{ width: size, height: size }}
            >
                <img
                    src="/logo-app.png"
                    alt="Thaiba Logo"
                    className="object-contain brightness-0 invert drop-shadow-xl z-10"
                    style={{ width: size * 0.55, height: size * 0.55 }}
                />
            </div>
        </div>
    );
};
