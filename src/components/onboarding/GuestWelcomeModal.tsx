"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { X, ChevronRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GuestWelcomeModalProps {
    onOpenGuide: () => void;
}

export function GuestWelcomeModal({ onOpenGuide }: GuestWelcomeModalProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Trigger Rules:
        // 1. User must be logged in
        // 2. User must be a 'guest'
        // 3. 'hasSeenGuestWelcome' must be false (or missing)
        if (user && user.role === 'guest') {
            // Versioned key allows re-showing onboarding if content changes in future
            const hasSeen = localStorage.getItem("hasSeenGuestWelcome-v1");
            if (!hasSeen) {
                // Short delay for smooth entrance after load
                const timer = setTimeout(() => setOpen(true), 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [user]);

    const handleDismiss = () => {
        setOpen(false);
        localStorage.setItem("hasSeenGuestWelcome-v1", "true");
    };

    const handleOpenGuide = () => {
        handleDismiss();
        onOpenGuide();
    };

    if (!open) return null;

    const steps = [
        {
            title: "Set Your Context",
            content: (
                <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        You work on behalf of a Unit
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        Requests are submitted for your Institution / Office / Unit
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        All tasks and events are recorded under this Unit
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        Always verify the unit name before submitting
                    </li>
                </ul>
            )
        },
        {
            title: "Submit Requests the Right Way",
            content: (
                <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        One requirement = one task
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>
                            <strong className="text-blue-300">New Task</strong> → posters, videos, edits, photography, live streaming
                        </span>
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>
                            <strong className="text-purple-300">New Event</strong> → programs or functions needing media planning
                        </span>
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        Add clear details and a realistic due date
                    </li>
                </ul>
            )
        },
        {
            title: "Know Your Role",
            content: (
                <ul className="space-y-3">
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        Admin coordinates execution
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        You cannot assign team members
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        You cannot change task status or priority
                    </li>
                    <li className="flex gap-3 text-sm text-foreground/90">
                        <span className="text-blue-400 font-bold">•</span>
                        Track progress as the team updates it
                    </li>
                </ul>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-strong overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-bold text-foreground">Welcome to MediaHive</h2>
                    <p className="text-sm text-muted-foreground mt-1">Submit media requests clearly. Track them easily. Let the team handle the rest.</p>
                </div>

                {/* Content Carousel */}
                <div className="flex-1 px-6 py-4 overflow-y-auto min-h-[220px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                    {step + 1}
                                </span>
                                {steps[step].title}
                            </h3>
                            {steps[step].content}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className="p-6 pt-2 border-t border-border bg-muted/20">
                    <div className="flex items-center justify-between mb-6">
                        {/* Step Indicators */}
                        <div className="flex gap-2">
                            {steps.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-colors duration-300",
                                        i === step ? "bg-primary w-4" : "bg-muted-foreground/30"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        {step < steps.length - 1 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        ) : (
                            <span className="text-xs text-muted-foreground">All set!</span>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        {step === steps.length - 1 ? (
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]"
                            >
                                Start Using MediaHive
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="w-full py-3 rounded-xl bg-card border border-border hover:bg-accent text-foreground font-semibold text-sm transition-all"
                            >
                                Continue
                            </button>
                        )}

                        <button
                            onClick={handleOpenGuide}
                            className="w-full py-3 rounded-xl bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <BookOpen size={16} />
                            View Full Guest Guide
                        </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50 text-center">
                        <p className="text-[10px] text-muted-foreground/60">
                            ⚠️ Test Version: This app is in testing. Bugs may occur. Feedback helps us improve.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
