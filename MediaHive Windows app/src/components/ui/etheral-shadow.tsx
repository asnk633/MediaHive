"use client";

import React, { useRef, useId, useEffect, CSSProperties } from 'react';
import { animate, useMotionValue, AnimationPlaybackControls } from 'framer-motion';
import { cn } from "@/lib/utils";

// Type definitions
interface AnimationConfig {
    preview?: boolean;
    scale: number;
    speed: number;
}

interface NoiseConfig {
    opacity: number;
    scale: number;
}

interface EtheralShadowProps {
    sizing?: 'fill' | 'stretch';
    color?: string;
    animation?: AnimationConfig;
    noise?: NoiseConfig;
    style?: CSSProperties;
    className?: string;
    children?: React.ReactNode;
    showTitle?: boolean;
    titleText?: string;
}

const useInstanceId = (): string => {
    const id = useId();
    const cleanId = id.replace(/:/g, "");
    const instanceId = `shadowoverlay-${cleanId}`;
    return instanceId;
};

export function EtheralShadow({
    sizing = 'fill',
    color = 'rgba(20, 184, 166, 0.25)', // Premium Teal default
    animation = { scale: 80, speed: 40 },
    noise = { opacity: 0.15, scale: 1.2 },
    style,
    className,
    children,
    showTitle = false,
    titleText = "Etheral Shadows"
}: EtheralShadowProps) {
    const id = useInstanceId();
    const animationEnabled = animation && animation.scale > 0;

    // Helper to safely swap/insert rgba opacities dynamically
    const getGlowColor = (alpha: number) => {
        if (color.startsWith('rgba')) {
            return color.replace(/[^,]+(?=\s*\)$)/, ` ${alpha}`);
        }
        return color;
    };

    return (
        <div
            className={cn("w-full h-full relative overflow-hidden bg-[#030305]", className)}
            style={{
                ...style
            }}
        >
            <style jsx>{`
                @keyframes ambient-drift {
                    0% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(25px, -15px, 0) scale(1.06); }
                    100% { transform: translate3d(0, 0, 0) scale(1); }
                }
                .ambient-glow-layer {
                    animation: ${animationEnabled ? 'ambient-drift 25s ease-in-out infinite' : 'none'};
                }
            `}</style>

            {/* GPU-Safe Ambient Radial Gradient Orbs */}
            <div
                className="ambient-glow-layer absolute inset-0 pointer-events-none z-0 will-change-transform"
                style={{
                    background: `
                        radial-gradient(circle at 15% 20%, ${getGlowColor(0.12)} 0%, transparent 55%),
                        radial-gradient(circle at 85% 80%, ${getGlowColor(0.06)} 0%, transparent 50%),
                        radial-gradient(circle at 50% 50%, ${getGlowColor(0.04)} 0%, transparent 65%)
                    `,
                }}
            />

            {/* Optional Title Layer */}
            {showTitle && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        textAlign: "center",
                        zIndex: 5,
                        pointerEvents: "none"
                    }}
                >
                    <h1 className="md:text-7xl text-6xl lg:text-8xl font-bold text-center text-foreground relative z-20">
                        {titleText}
                    </h1>
                </div>
            )}

            {/* Noise Overlay Layer (Local optimized noise pattern) */}
            {noise && noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
                        backgroundSize: `${noise.scale * 200}px`,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2.5,
                        pointerEvents: "none",
                        zIndex: 1
                    }}
                />
            )}

            {/* Children Content Layer */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
