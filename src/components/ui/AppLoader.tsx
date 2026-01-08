import React from 'react';
import { cn } from '@/lib/utils';

export function AppLoader() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 p-8" aria-live="polite" aria-label="Loading Media">
            {/* Floating Arcs Spinner - Square fixed box */}
            <div className="relative w-12 h-12">
                {/* Arc 1: Outer, Thinner, Slower */}
                {/* border-t only creates a 90deg arc. Transparent everywhere else. */}
                <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-blue-500/90 animate-[spin_1.6s_linear_infinite] motion-reduce:animate-none" />

                {/* Arc 2: Inner, Thicker, Faster offset */}
                {/* border-t ensures same direction visual start, slightly offset by logic or css if needed, but standard spin works. */}
                <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-blue-500/40 animate-[spin_1.2s_linear_infinite] motion-reduce:animate-none" />
            </div>

            {/* Cycling Text - "Loading [Word]" */}
            <div className="h-6 overflow-hidden flex items-center gap-1.5 text-sm font-medium">
                <span className="text-slate-400">Loading</span>
                <div className="flex flex-col animate-[text-cycle_2s_linear_infinite] motion-reduce:animate-none text-left">
                    <span className="h-6 flex items-center text-blue-500">Media</span>
                    <span className="h-6 flex items-center text-blue-500">Tasks</span>
                    <span className="h-6 flex items-center text-blue-500">Events</span>
                    <span className="h-6 flex items-center text-blue-500">Reports</span>
                    {/* Duplicate first item for seamless loop */}
                    <span className="h-6 flex items-center text-blue-500">Media</span>
                </div>
            </div>
        </div>
    );
}
