import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const SkyToggle = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
        className={cn(
            "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-800/80",
            // Inner shadow for depth
            "shadow-inner",
            // Slow confident motion duration
            "duration-300",
            className
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitive.Thumb
            className={cn(
                "pointer-events-none block h-7 w-7 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5",
                "duration-300 ease-out", // Confident motion
                // Subtle glow on thumb?
                "data-[state=checked]:shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            )}
        />
    </SwitchPrimitive.Root>
))
SkyToggle.displayName = SwitchPrimitive.Root.displayName

export { SkyToggle }
