"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
    current: number;
    total: number;
}

export function OnboardingProgress({ current, total }: OnboardingProgressProps) {
    return (
        <div className="flex gap-2">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        i === current ? "w-6 bg-indigo-400" : "w-2 bg-foreground/20"
                    )}
                />
            ))}
        </div>
    );
}
