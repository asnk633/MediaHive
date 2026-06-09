"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { nativeNavigate, cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/auth/ThemeToggle';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingProgress } from './OnboardingProgress';

const STEPS = [
    {
        title: "Welcome to MediaHive",
        subtitle: "Your command center for shoots, live streams, design work, and media coordination.",
    },
    {
        title: "Prioritise What Really Matters",
        description: "Focus on high-priority shoots, live streams, and design tasks with a clear view of today, this week, and upcoming work.",
    },
    {
        title: "Stay Organised & Sync",
        description: "Coordinate with your team, track deadlines, and ensure every production runs like clockwork.",
    }
];

export function OnboardingContainer() {
    const { theme } = useTheme();
    const [step, setStep] = useState(0);
    const router = useRouter();

    const handleNext = () => setStep(prev => prev + 1);
    
    const finishOnboarding = (action?: 'create') => {
        localStorage.setItem('mediahive_onboarding_complete', 'true');
        if (action === 'create') {
            nativeNavigate('/tasks?create=true', router, 'Onboarding');
        } else {
            nativeNavigate('/home', router, 'Onboarding');
        }
    };

    const TOTAL_STEPS = 3;

    const bgGradient = theme === 'luminous'
        ? "bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-800"
        : theme === 'golden'
        ? "bg-gradient-to-br from-[#02040a] via-[#0a0a05] to-[#151100]"
        : "bg-gradient-to-br from-[#050816] via-[#0B1026] to-[#1A1443]";

    const hazeGlow1 = theme === 'luminous'
        ? "bg-sky-400/15"
        : theme === 'golden'
        ? "bg-amber-500/10"
        : "bg-indigo-500/20";

    const hazeGlow2 = theme === 'luminous'
        ? "bg-indigo-400/15"
        : theme === 'golden'
        ? "bg-amber-600/5"
        : "bg-purple-500/20";

    return (
        <main suppressHydrationWarning className={cn("fixed inset-0 overflow-hidden flex items-center justify-center p-6 sm:p-12 transition-all duration-500", bgGradient)}>
            <ThemeToggle />

            {/* Animated color haze */}
            <div className={cn("absolute w-[900px] h-[900px] blur-[180px] rounded-full top-[-200px] left-[-200px] animate-[float_12s_ease-in-out_infinite] transition-colors duration-500", hazeGlow1)} />
            <div className={cn("absolute w-[700px] h-[700px] blur-[160px] rounded-full bottom-[-200px] right-[-200px] animate-[float_16s_ease-in-out_infinite_reverse] transition-colors duration-500", hazeGlow2)} />

            {/* Cinematic Focus Area */}
            {theme !== 'luminous' && <div className="onboarding-vignette" />}
            
            {/* 3 — Subtle Film Grain Overlay */}
            <div 
                className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: 'url("/noise.png")' }}
            />

            <div className="relative z-10 w-full max-w-[480px] flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.04, y: -10 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="w-full glass-card p-12 sm:p-14 rounded-2xl"
                    >
                        <OnboardingStep
                            key={step}
                            title={STEPS[step]?.title || ""}
                            subtitle={STEPS[step]?.subtitle}
                            description={STEPS[step]?.description}
                            onNext={handleNext}
                            onSkip={() => finishOnboarding()}
                            customAction={
                                step === 2 ? (
                                    <div className="space-y-4 w-full">
                                        <button
                                            onClick={() => finishOnboarding('create')}
                                            className="w-full py-4 btn-premium text-foreground rounded-2xl font-bold text-lg"
                                        >
                                            Create First Task
                                        </button>
                                    </div>
                                ) : undefined
                            }
                        />
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 relative z-20">
                    <OnboardingProgress current={step} total={TOTAL_STEPS} />
                </div>
            </div>
        </main>
    );
}
