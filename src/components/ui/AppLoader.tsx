'use client';
import React from 'react';
import { cn } from '@/lib/utils';

export const AppLoader = () => {
    const [isLate, setIsLate] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLate(true), 10000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8" aria-live="polite" aria-label="Loading Media">
            {/* Floating Arcs Spinner - Square fixed box */}
            <div className="relative w-12 h-12">
                {/* Arc 1: Outer, Thinner, Slower */}
                <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-blue-500/90 animate-[spin_1.6s_linear_infinite] motion-reduce:animate-none" />

                {/* Arc 2: Inner, Thicker, Faster offset */}
                <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-blue-500/40 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none" />
            </div>

            {/* Cycling Text - "Loading [Word]" */}
            <div className="flex flex-col items-center gap-1">
                <div className="h-6 overflow-hidden flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-foreground/60">Loading</span>
                    <div className="flex flex-col animate-[text-cycle_2s_linear_infinite] motion-reduce:animate-none text-left">
                        <span className="h-6 flex items-center text-blue-500">Media</span>
                        <span className="h-6 flex items-center text-blue-500">Tasks</span>
                        <span className="h-6 flex items-center text-blue-500">Events</span>
                        <span className="h-6 flex items-center text-blue-500">Reports</span>
                        <span className="h-6 flex items-center text-blue-500">Media</span>
                    </div>
                </div>
                {isLate && (
                    <p className="text-[10px] text-foreground/50 animate-in fade-in slide-in-from-top-1 duration-500">
                        Taking longer than usual... checking connection
                    </p>
                )}
            </div>
        </div>
    );
}
