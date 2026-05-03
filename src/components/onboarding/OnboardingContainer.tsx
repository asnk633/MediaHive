"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { nativeNavigate } from '@/lib/utils';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingProgress } from './OnboardingProgress';

const STEPS = [
    {
        title: "Welcome to MediaHive",
        subtitle: "Your command center for shoots, live streams, design work, and media coordination.",
    },
    {
        title: "Prioritise What Really Matters",
        description: "Focus on urgent shoots, live streams, and design tasks with a clear view of today, this week, and upcoming work.",
    },
    {
        title: "Stay Organised & Sync",
        description: "Coordinate with your team, track deadlines, and ensure every production runs like clockwork.",
    }
];

export function OnboardingContainer() {
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

    return (
        <main className="fixed inset-0 overflow-hidden bg-[#050816] flex items-center justify-center p-6 sm:p-12">
            {/* 1 — Premium Background Gradient System */}
            <div 
                className="absolute inset-0 z-0"
                style={{
                    background: `linear-gradient(180deg, #050816 0%, #0B1026 45%, #1A1443 100%)`
                }}
            />

            {/* 2 — Animated Ambient Haze Layers */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="radial-indigo -top-20 -left-20 animate-drift opacity-50 animate-haze-drift" />
                <div className="radial-purple top-1/2 -right-20 animate-drift opacity-30 animate-haze-drift" style={{ animationDelay: '-10s' }} />
                <div className="radial-indigo -bottom-40 left-1/4 animate-drift opacity-20 animate-haze-drift" style={{ animationDelay: '-20s' }} />
            </div>

            {/* Cinematic Focus Area */}
            <div className="onboarding-vignette" />
            
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
                        className="onboarding-card onboarding-enter p-12 sm:p-14 w-full"
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
                                            className="w-full py-4 btn-premium text-white rounded-2xl font-bold text-lg"
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
