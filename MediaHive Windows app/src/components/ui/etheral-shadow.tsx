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

function mapRange(
    value: number,
    fromLow: number,
    fromHigh: number,
    toLow: number,
    toHigh: number
): number {
    if (fromLow === fromHigh) {
        return toLow;
    }
    const percentage = (value - fromLow) / (fromHigh - fromLow);
    return toLow + percentage * (toHigh - toLow);
}

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
    const generatedId = useId().replace(/:/g, "");
    const id = `shadowoverlay-${generatedId}`;
    // [Optimization] We disable the expensive SVG displacement filters globally. 
    // They cause severe Chromium GPU compositor crashes when the window is maximized.
    const animationEnabled = false; 
    const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
    const hueRotateMotionValue = useMotionValue(180);
    const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);

    const displacementScale = animation ? mapRange(animation.scale, 1, 100, 20, 100) : 0;
    const animationDuration = animation ? mapRange(animation.speed, 1, 100, 1000, 50) : 1;

    useEffect(() => {
        if (feColorMatrixRef.current && animationEnabled) {
            if (hueRotateAnimation.current) {
                hueRotateAnimation.current.stop();
            }
            hueRotateMotionValue.set(0);
            hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
                duration: animationDuration / 25,
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 0,
                ease: "linear",
                delay: 0,
                onUpdate: (value: number) => {
                    // [Optimization] We disable the continuous feColorMatrix attribute updates.
                    // Updating an SVG filter over a maximized window 60fps causes severe Chromium compositor flicker.
                    /* if (feColorMatrixRef.current) {
                        feColorMatrixRef.current.setAttribute("values", String(value));
                    } */
                }
            });

            return () => {
                if (hueRotateAnimation.current) {
                    hueRotateAnimation.current.stop();
                }
            };
        }
    }, [animationEnabled, animationDuration, hueRotateMotionValue]);

    return (
        <div
            className={cn("w-full h-full relative overflow-hidden bg-[#030305]", className)}
            style={{
                ...style
            }}
        >
            {/* SVG Filter Definition (rendered outside the filtered div to prevent cyclic rendering/clipping bugs) */}
            {animationEnabled && (
                <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
                    <defs>
                        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence
                                result="undulation"
                                numOctaves="2"
                                baseFrequency={`${mapRange(animation.scale, 0, 100, 0.001, 0.0005)},${mapRange(animation.scale, 0, 100, 0.004, 0.002)}`}
                                seed="0"
                                type="turbulence"
                            />
                            <feColorMatrix
                                ref={feColorMatrixRef}
                                in="undulation"
                                result="animatedNoise"
                                type="hueRotate"
                                values="180"
                            />
                            <feColorMatrix
                                in="animatedNoise"
                                result="circulation"
                                type="matrix"
                                values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0"
                            />
                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="circulation"
                                scale={displacementScale}
                                result="dist"
                            />
                            <feDisplacementMap
                                in="dist"
                                in2="animatedNoise"
                                scale={displacementScale}
                                result="dist2"
                            />
                        </filter>
                    </defs>
                </svg>
            )}

            {/* Animated Shadow Layer */}
            <div
                style={{
                    position: "absolute",
                    inset: -displacementScale,
                    filter: animationEnabled ? `url(#${id}) blur(4px)` : "none",
                    transform: "translateZ(0)",
                    pointerEvents: "none",
                    zIndex: 0
                }}
            >
                <div
                    style={{
                        backgroundColor: color,
                        maskImage: `radial-gradient(ellipse 140% 120% at 50% -20%, black 0%, black 40%, transparent 90%)`,
                        WebkitMaskImage: `radial-gradient(ellipse 140% 120% at 50% -20%, black 0%, black 40%, transparent 90%)`,
                        maskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                        width: "100%",
                        height: "100%"
                    }}
                />
            </div>

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

            {/* Noise Overlay Layer */}
            {noise && noise.opacity > 0 && (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        backgroundSize: `${noise.scale * 100}px`,
                        backgroundRepeat: "repeat",
                        opacity: noise.opacity / 2,
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
