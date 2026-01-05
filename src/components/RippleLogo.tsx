"use client";

import { motion } from "framer-motion";

export const RippleLogo = () => {
    return (
        <div className="relative flex items-center justify-center w-[200px] h-[200px]">
            {/* Soft Ripple Circles (reverting to previous framer logic but polished) */}
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

            {/* Main Center Circle + Logo (Glass removed, Logo enlarged) */}
            <div className="relative z-10 flex items-center justify-center">
                <img
                    src="/logo-app.png"
                    alt="Thaiba Logo"
                    className="w-28 h-28 object-contain brightness-0 invert drop-shadow-xl"
                />
            </div>
        </div>
    );
};
