'use client';
export const dynamic = 'force-static';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RippleLogo } from "@/components/RippleLogo";

const slides = [
    {
        title: "Simplify Your\nMedia Workflow",
        subtitle:
            "Collect requests, assign your team, and track progress across all Thaiba campuses in one place.",
    },
    {
        title: "Prioritise What\nReally Matters",
        subtitle:
            "Focus on urgent shoots, live streams, and designs with a clear view of today, this week, and upcoming work.",
    },
    {
        title: "See Progress\nAt A Glance",
        subtitle:
            "Get a dashboard of tasks, events, and reports so nothing slips through the cracks.",
    },
];

export default function WelcomePage() {
    const [showSplash, setShowSplash] = useState(true);
    const [index, setIndex] = useState(0);
    const router = useRouter();


    useEffect(() => {
        // Auto-transition from Splash to Onboarding after 3.0s
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleNext = () => {
        if (index < slides.length - 1) {
            setIndex(index + 1);
        } else {
            router.push("/login");
        }
    };

    return (
        <main className="flex flex-1 flex-col min-h-screen bg-gradient-to-br from-[#00b4db] to-[#0083b0] text-white relative overflow-hidden font-display">
            {/* Decorative Background Elements removed for clean gradient fill */}


            <AnimatePresence mode="wait">
                {showSplash ? (
                    /* ---------------- SPLASH SCREEN ---------------- */
                    <motion.div
                        key="splash"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
                    >
                        {/* Ripple Logo */}
                        <div className="mb-12 scale-125">
                            <RippleLogo />
                        </div>

                        {/* Text Branding */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-center space-y-0"
                        >
                            <h2 className="text-2xl font-medium tracking-wider opacity-90">Thaiba</h2>
                            <h1 className="text-5xl font-bold tracking-tight drop-shadow-md mt-[-4px]">MediaHive</h1>
                        </motion.div>
                    </motion.div>
                ) : (
                    /* ---------------- ONBOARDING SLIDES ---------------- */
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-10 z-10 relative w-full"
                    >
                        {/* Persistent Ripple Logo for Slides */}
                        <div className="flex-1 flex items-center justify-center w-full max-h-[40vh]">
                            <motion.div
                                key={index}
                                initial={{ x: 50, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                className="flex items-center justify-center"
                            >
                                <RippleLogo />
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center max-w-sm space-y-4 min-h-[160px]">
                            <motion.h1
                                key={`t-${index}`}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-3xl font-bold whitespace-pre-line leading-tight"
                            >
                                {slides[index].title}
                            </motion.h1>
                            <motion.p
                                key={`s-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg text-blue-50 leading-relaxed font-light"
                            >
                                {slides[index].subtitle}
                            </motion.p>
                        </div>

                        {/* Indicators & Buttons */}
                        <div className="w-full max-w-xs pt-8 space-y-8 flex flex-col items-center">
                            {/* Dots */}
                            <div className="flex gap-2">
                                {slides.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-white text-[#0096FF] rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl active:scale-95 transition-all"
                            >
                                {index === slides.length - 1 ? "Get Started" : "Next"}
                            </button>

                            {index < slides.length - 1 && (
                                <button onClick={() => router.push('/login')} className="text-white/80 hover:text-white font-medium text-sm">
                                    Skip
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

