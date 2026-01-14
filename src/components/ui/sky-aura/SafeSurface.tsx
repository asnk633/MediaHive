import React from 'react';
import { cn } from '@/lib/utils';

interface SafeSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    isInteractive?: boolean;
}

export const SafeSurface = React.forwardRef<HTMLDivElement, SafeSurfaceProps>(
    ({ className, children, isInteractive = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-xl shadow-soft",
                    // Gentle inner glow logic via pseudo-element or shadow? 
                    // Let's use shadow-inner for depth
                    "shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
                    isInteractive && "transition-all duration-300 hover:bg-white/[0.05] hover:border-white/10 hover:shadow-glow cursor-pointer",
                    className
                )}
                {...props}
            >
                {/* Optional: Add a top-highlight gradient line for "glass" feeling? */}
                {/* Keeping it simple per spec: Dark glass look, soft borders. */}
                {children}
            </div>
        );
    }
);

SafeSurface.displayName = "SafeSurface";
