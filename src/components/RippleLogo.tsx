"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RippleLogoProps {
    size?: number;
    className?: string;
}

export const RippleLogo = ({ size = 200, className }: RippleLogoProps) => {
    return (
        <div
            className={cn("relative flex items-center justify-center", className)}
            style={{ width: size, height: size }}
        >
            {/* Soft Ripple Circles */}
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-white/10"
                    style={{ width: '100%', height: '100%' }}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Main Center Circle + Logo */}
            <div className="relative z-10 flex items-center justify-center">
                <img
                    src="/logo-app.png"
                    alt="Thaiba Logo"
                    className="object-contain brightness-0 invert drop-shadow-xl"
                    style={{ width: size * 0.56, height: size * 0.56 }} // Proportional to original 28/200
                />
            </div>
        </div>
    );
};
