"use client";

import { ReactNode } from 'react';
import { motion } from "framer-motion";
import { HaloLogo } from '@/components/HaloLogo';

interface OnboardingStepProps {
    title: string;
    subtitle?: string;
    description?: string;
    onNext: () => void;
    onSkip?: () => void;
    nextLabel?: string;
    customAction?: ReactNode;
    showLogo?: boolean;
}

export function OnboardingStep({
    title,
    subtitle,
    description,
    onNext,
    onSkip,
    nextLabel = "Next",
    customAction,
    showLogo = true
}: OnboardingStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.24 }}
            className="w-full flex flex-col items-center text-center"
        >
            {showLogo && (
                <div className="mb-8">
                    <HaloLogo />
                </div>
            )}

            <div className="space-y-4 mb-12">
                <h1 className="text-3xl font-semibold text-foreground tracking-tight text-premium-gradient">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm text-foreground leading-relaxed max-w-md">
                        {subtitle}
                    </p>
                )}
                {description && (
                    <p className="text-sm text-foreground/60/80 leading-relaxed max-w-md italic">
                        {description}
                    </p>
                )}
            </div>

            <div className="w-full space-y-4">
                {customAction ? (
                    customAction
                ) : (
                    <button
                        onClick={onNext}
                        className="w-full py-4 btn-premium button-micro text-foreground rounded-2xl font-bold text-lg"
                    >
                        {nextLabel}
                    </button>
                )}

                {onSkip && (
                    <button 
                        onClick={onSkip} 
                        className="text-foreground/80 hover:text-foreground font-medium text-sm transition-colors py-2 bg-foreground/5 rounded-xl px-4 border border-foreground/10 backdrop-blur-md button-micro"
                    >
                        Skip for Now
                    </button>
                )}
            </div>
        </motion.div>
    );
}
