'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { RippleLogo } from '@/components/RippleLogo';
import { motion, AnimatePresence } from "framer-motion";

const HOLD_DURATION = 1500; // Slightly longer to read text
const EXIT_DURATION = 500;

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

import { useSearchParams } from 'next/navigation';

export default function WelcomeGate({ children }: { children: React.ReactNode }) {
    // Stages: 'loading' -> 'splash' -> 'onboarding' -> 'content'
    const [stage, setStage] = useState<'loading' | 'splash' | 'onboarding' | 'content'>('loading');
    const [index, setIndex] = useState(0);
    const searchParams = useSearchParams();

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hasSeen = localStorage.getItem('mediahive_welcome_seen');
        // searchParams hook handles window.location.search access safely
        const forceReset = searchParams.get('reset_welcome') === 'true';

        if (hasSeen === 'true' && !forceReset) {
            setStage('content');
        } else {
            setStage('splash');

            // Hold splash then move to onboarding
            const timer = setTimeout(() => {
                setStage('onboarding');
            }, HOLD_DURATION);

            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (index < slides.length - 1) {
            setIndex(index + 1);
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = () => {
        localStorage.setItem('mediahive_welcome_seen', 'true');
        setStage('content');
    };

    if (stage === 'content') {
        return <>{children}</>;
    }

    return (
        <AnimatePresence mode="wait">
            {stage === 'splash' && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#00b4db] to-[#0083b0]"
                >
                    <div className="mb-12 scale-125">
                        <RippleLogo />
                    </div>
                    {/* Fixed text without complex delayed animations to ensure visibility */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-center space-y-0"
                    >
                        <h2 className="text-2xl font-medium tracking-wider opacity-90 text-white">Thaiba</h2>
                        <h1 className="text-5xl font-bold tracking-tight drop-shadow-md mt-[-4px] text-white">MediaHive</h1>
                        <p className="mt-4 text-sm text-blue-200/50 font-medium tracking-widest uppercase text-[10px]">
                            Built for Teams That Create
                        </p>
                    </motion.div>
                </motion.div>
            )}

            {stage === 'onboarding' && (
                <motion.div
                    key="onboarding"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#00b4db] to-[#0083b0] text-white px-6 pt-20 pb-10 font-display"
                >
                    {/* Persistent Ripple Logo Area */}
                    <div className="flex-1 flex items-center justify-center w-full max-h-[30vh]">
                        <motion.div
                            key={index}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="scale-90"
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

                    {/* Controls */}
                    <div className="w-full max-w-xs pt-8 space-y-8 flex flex-col items-center">
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

                        <button onClick={finishOnboarding} className="text-white/80 hover:text-white font-medium text-sm">
                            Skip
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
